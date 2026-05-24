"""
API FastAPI pour les agents multi-agent
"""
from dotenv import load_dotenv
load_dotenv()  # Charger les variables d'environnement depuis .env

from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import logging
from pathlib import Path

from agents.core.langgraph_orchestrator import run_workflow
from agents.parsing_agent.agent import ParsingAgent
from agents.qa_agent.agent import QAAgent
from agents.test_generator_agent.agent import TestGeneratorAgent
from agents.export_agent.agent import ExportAgent, ExportFormat
from agents.analysis_agent.agent import AnalysisAgent
from agents.fmea_agent.agent import FMEAAgent
from agents.compliance_agent.agent import ComplianceAgent
from agents.core import rag_store

# Configuration logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# App FastAPI
app = FastAPI(
    title="Multi-Agent Analysis API",
    description="API pour l'analyse multi-agent de documents",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:5176",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class WorkflowRequest(BaseModel):
    document_id: str
    workflow_type: str = "full"


class QARequest(BaseModel):
    document_id: str
    question: str
    llm_provider: Optional[str] = None  # tinyllama, phi3, groq, mistral, kimi


class TestRequest(BaseModel):
    document_id: str
    requirements: List[dict]
    llm_provider: Optional[str] = None  # tinyllama, phi3, groq, mistral, kimi


class ExportRequest(BaseModel):
    document_id: str
    payload: dict
    format: str = "json"


# === Conversation Models ===
class ConversationCreate(BaseModel):
    title: str = "Nouvelle conversation"
    document_id: Optional[str] = None
    document_name: Optional[str] = None


class ConversationUpdate(BaseModel):
    title: str


class MessageCreate(BaseModel):
    type: str  # 'user', 'agent', 'system'
    content: str
    data: Optional[dict] = None


class WorkflowResponse(BaseModel):
    status: str
    document_id: str
    message: str

@app.get("/")
async def root():
    return {
        "service": "Multi-Agent Analysis API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/llm/models")
async def get_available_models():
    """Retourne la liste des modèles LLM disponibles"""
    return {
        "models": {
            "local": [
                {
                    "id": "tinyllama",
                    "name": "TinyLlama",
                    "description": "Léger et rapide (637 MB)",
                    "provider": "ollama",
                    "local": True,
                },
                {
                    "id": "phi3",
                    "name": "Phi-3 Mini",
                    "description": "Microsoft - Performant (2.2 GB)",
                    "provider": "ollama",
                    "local": True,
                },
            ],
            "api": [
                {
                    "id": "groq",
                    "name": "Grok (xAI)",
                    "description": "Modèle xAI puissant",
                    "provider": "groq",
                    "local": False,
                },
                {
                    "id": "mistral",
                    "name": "Mistral Devstral 2",
                    "description": "Mistral AI - Gratuit",
                    "provider": "openrouter",
                    "local": False,
                },
                {
                    "id": "kimi",
                    "name": "Kimi 2 Thinking",
                    "description": "Raisonnement avancé",
                    "provider": "openrouter",
                    "local": False,
                },
            ],
        }
    }

@app.post("/workflow/start", response_model=WorkflowResponse)
async def start_workflow(
    request: WorkflowRequest,
    background_tasks: BackgroundTasks
):
    """Démarrer un workflow d'analyse"""
    import tempfile
    try:
        logger.info(f"Starting workflow for document {request.document_id}")
        
        # TODO: Récupérer le chemin du document depuis Supabase
        temp_dir = tempfile.gettempdir()
        document_path = f"{temp_dir}/{request.document_id}.pdf"
        
        # Lancer le workflow en arrière-plan
        background_tasks.add_task(
            run_workflow,
            request.document_id,
            document_path,
            request.workflow_type
        )
        
        return WorkflowResponse(
            status="started",
            document_id=request.document_id,
            message="Workflow started successfully"
        )
        
    except Exception as e:
        logger.error(f"Workflow error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload un document, parse et extrait automatiquement les exigences"""
    import tempfile
    import os
    
    try:
        document_id = Path(file.filename).stem
        
        # Sauvegarder temporairement (compatible Windows/Linux)
        temp_dir = Path(tempfile.gettempdir())
        file_path = temp_dir / file.filename
        content = await file.read()
        with file_path.open("wb") as buffer:
            buffer.write(content)
        
        # Parser le document
        parsing_agent = ParsingAgent()
        suffix = file_path.suffix.lower()
        if suffix == ".pdf":
            parsed = await parsing_agent.parse_pdf(str(file_path))
        elif suffix in {".doc", ".docx"}:
            parsed = await parsing_agent.parse_docx(str(file_path))
        else:
            # Fichier non supporté, retourner sans exigences
            return {
                "document_id": document_id,
                "filename": file.filename,
                "path": str(file_path),
                "size": len(content),
                "requirements": [],
                "metadata": {}
            }
        
        # Extraire les exigences du texte
        analysis_agent = AnalysisAgent()
        text = parsed.get("text", "")
        analysis = await analysis_agent.analyze(text, document_id)
        requirements = analysis.get("requirements", [])
        
        # === INDEXATION RAG AUTOMATIQUE ===
        # Créer des pages à partir du texte parsé pour l'indexation
        pages = parsed.get("pages", [])
        if not pages and text:
            # Si pas de pages structurées, créer une page unique
            pages = [{"text": text, "page_number": 1}]
        
        if pages:
            try:
                # Chunker le document
                chunks, chunk_meta = rag_store.chunk_document(pages)
                if chunks:
                    # Créer les embeddings
                    embeddings = rag_store.embed_chunks(chunks)
                    # Sauvegarder l'index FAISS
                    rag_store.save_index(document_id, chunks, chunk_meta, embeddings)
                    logger.info(f"RAG index created for {document_id} with {len(chunks)} chunks")
            except Exception as e:
                logger.warning(f"RAG indexing failed (non-blocking): {e}")
        
        logger.info(f"Extracted {len(requirements)} requirements from {file.filename}")
        
        return {
            "document_id": document_id,
            "filename": file.filename,
            "path": str(file_path),
            "size": len(content),
            "requirements": requirements,
            "metadata": parsed.get("metadata", {})
        }
        
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ingest", response_model=WorkflowResponse)
async def ingest_document(request: WorkflowRequest):
    import tempfile
    try:
        parsing = ParsingAgent()
        temp_dir = tempfile.gettempdir()
        doc_path = f"{temp_dir}/{request.document_id}"
        result = await parsing.ingest_and_index(request.document_id, doc_path)
        return WorkflowResponse(status="ingested", document_id=request.document_id, message=str(result))
    except Exception as e:
        logger.error(f"Ingest error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/qa")
async def qa(request: QARequest):
    try:
        from agents.core.llm_router import LLMRouter
        
        # Créer le LLM avec le provider choisi
        llm = None
        if request.llm_provider:
            provider = request.llm_provider
            model = None
            # Mapper les IDs aux providers/modèles
            if provider == "tinyllama":
                llm = LLMRouter(provider="ollama", model="tinyllama:latest")
            elif provider == "phi3":
                llm = LLMRouter(provider="ollama", model="phi3:mini")
            elif provider in ["groq", "mistral", "kimi"]:
                llm = LLMRouter(provider=provider)
        
        qa_agent = QAAgent(llm=llm)
        answer = await qa_agent.answer_question(request.question, request.document_id)
        return answer
    except Exception as e:
        logger.error(f"QA error: {e}")
        raise HTTPException(status_code=500, detail="QA processing failed")


class ExtractAndGenerateRequest(BaseModel):
    document_id: str
    industry_context: Optional[str] = "industriel"  # Ex: "batterie", "automobile", "aéronautique"


@app.post("/extract-requirements")
async def extract_requirements(request: WorkflowRequest):
    """Extrait automatiquement les exigences d'un document uploadé"""
    try:
        # 1. Lire le texte du document depuis le store RAG
        from agents.core import rag_store
        import json
        from pathlib import Path
        
        meta_path = Path("data/metadata") / f"{request.document_id}.json"
        if not meta_path.exists():
            raise HTTPException(status_code=404, detail="Document non indexé. Veuillez d'abord uploader et ingérer le document.")
        
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
        chunks = meta.get("chunks", [])
        full_text = "\n".join(chunks[:20])  # Prendre les 20 premiers chunks
        
        # 2. Extraire les exigences
        from agents.analysis_agent.agent import AnalysisAgent
        analysis_agent = AnalysisAgent()
        result = await analysis_agent.analyze(full_text, request.document_id)
        
        return {
            "document_id": request.document_id,
            "requirements": result["requirements"],
            "total_count": result["total_count"],
            "statistics": result.get("statistics", {})
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Requirement extraction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/extract-and-generate-tests")
async def extract_and_generate_tests(request: ExtractAndGenerateRequest):
    """
    Workflow complet: Extrait les exigences du document puis génère les tests.
    Idéal pour l'industrie (batteries, automobile, etc.)
    """
    try:
        from agents.core import rag_store
        import json
        from pathlib import Path
        from agents.analysis_agent.agent import AnalysisAgent
        
        logger.info(f"Starting full extraction workflow for {request.document_id}")
        
        # 1. Récupérer le texte du document
        meta_path = Path("data/metadata") / f"{request.document_id}.json"
        if not meta_path.exists():
            raise HTTPException(
                status_code=404, 
                detail="Document non indexé. Veuillez d'abord uploader et ingérer le document via /upload puis /ingest"
            )
        
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
        chunks = meta.get("chunks", [])
        full_text = "\n".join(chunks[:30])  # Plus de contexte
        
        # 2. Extraire les exigences avec contexte industriel
        analysis_agent = AnalysisAgent()
        analysis_result = await analysis_agent.analyze(full_text, request.document_id)
        requirements = analysis_result["requirements"]
        
        if not requirements:
            return {
                "document_id": request.document_id,
                "status": "no_requirements_found",
                "message": "Aucune exigence n'a pu être extraite du document.",
                "requirements": [],
                "test_cases": [],
                "traceability": {"links": [], "total_coverage": 0}
            }
        
        # 3. Générer les tests pour chaque exigence
        test_agent = TestGeneratorAgent()
        test_cases = await test_agent.generate_test_cases(requirements)
        
        # 4. Créer la matrice de traçabilité
        traceability = await test_agent.create_traceability_matrix(requirements, test_cases)
        
        # 5. Vérifier la couverture
        coverage = await test_agent.verify_test_coverage(requirements, test_cases)
        
        logger.info(f"Workflow complete: {len(requirements)} requirements, {len(test_cases)} tests, {coverage['actual_coverage']*100:.1f}% coverage")
        
        return {
            "document_id": request.document_id,
            "status": "success",
            "industry_context": request.industry_context,
            "requirements": requirements,
            "requirements_count": len(requirements),
            "test_cases": test_cases,
            "test_cases_count": len(test_cases),
            "traceability": traceability,
            "coverage": coverage
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Extract and generate error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate-tests")
async def generate_tests(request: TestRequest):
    try:
        from agents.core.llm_router import LLMRouter
        
        # Créer le LLM avec le provider choisi
        llm = None
        if request.llm_provider:
            provider = request.llm_provider
            # Mapper les IDs aux providers/modèles
            if provider == "tinyllama":
                llm = LLMRouter(provider="ollama", model="tinyllama:latest")
            elif provider == "phi3":
                llm = LLMRouter(provider="ollama", model="phi3:mini")
            elif provider in ["groq", "mistral", "kimi"]:
                llm = LLMRouter(provider=provider)
        
        test_agent = TestGeneratorAgent(llm=llm)
        tests = await test_agent.generate_test_cases(request.requirements)
        trace = await test_agent.create_traceability_matrix(request.requirements, tests)
        return {"test_cases": tests, "traceability": trace}
    except Exception as e:
        logger.error(f"Test generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/export")
async def export_data(request: ExportRequest):
    try:
        export_agent = ExportAgent()
        fmt = ExportFormat(request.format)
        out_dir = Path("data/exports")
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / f"{request.document_id}.{fmt.value if fmt != ExportFormat.JSON else 'json'}"
        result = await export_agent.export(request.payload, fmt, str(out_path))
        return result
    except Exception as e:
        logger.error(f"Export error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# ==========================================
# === FMEA ENDPOINTS ===
# ==========================================

class FMEARequest(BaseModel):
    requirements: List[dict]
    system_context: Optional[str] = "système industriel"
    industry: Optional[str] = "general"  # automotive, aerospace, medical, general
    llm_provider: Optional[str] = None


class FMEAUpdateRequest(BaseModel):
    fmea_id: str
    updates: dict
    fmea_items: List[dict]


@app.post("/fmea/generate")
async def generate_fmea(request: FMEARequest):
    """
    Génère une analyse FMEA automatisée à partir des exigences.
    Calcule le RPN (Risk Priority Number) et propose des actions correctives.
    """
    try:
        from agents.core.llm_router import LLMRouter
        
        # Créer le LLM avec le provider choisi
        llm = None
        if request.llm_provider:
            provider = request.llm_provider
            if provider == "tinyllama":
                llm = LLMRouter(provider="ollama", model="tinyllama:latest")
            elif provider == "phi3":
                llm = LLMRouter(provider="ollama", model="phi3:mini")
            elif provider in ["groq", "mistral", "kimi"]:
                llm = LLMRouter(provider=provider)
        
        fmea_agent = FMEAAgent(llm=llm)
        
        result = await fmea_agent.generate_fmea(
            requirements=request.requirements,
            system_context=request.system_context,
            industry=request.industry
        )
        
        logger.info(f"FMEA generated: {len(result['fmea_items'])} items, "
                   f"avg RPN: {result['statistics'].get('average_rpn', 0)}")
        
        return {
            "status": "success",
            "fmea_items": result["fmea_items"],
            "statistics": result["statistics"],
            "scales": result["scales"],
            "thresholds": result["thresholds"],
            "metadata": result["metadata"]
        }
        
    except Exception as e:
        logger.error(f"FMEA generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/fmea/update-item")
async def update_fmea_item(request: FMEAUpdateRequest):
    """
    Met à jour un élément FMEA et recalcule automatiquement le RPN.
    """
    try:
        fmea_agent = FMEAAgent()
        
        result = await fmea_agent.update_fmea_item(
            fmea_id=request.fmea_id,
            updates=request.updates,
            fmea_items=request.fmea_items
        )
        
        if result["success"]:
            return result
        else:
            raise HTTPException(status_code=404, detail=result["error"])
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"FMEA update error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/fmea/export")
async def export_fmea(request: ExportRequest):
    """
    Exporte l'analyse FMEA dans le format demandé (excel, csv, json).
    """
    try:
        fmea_agent = FMEAAgent()
        export_agent = ExportAgent()
        
        # Préparer les données pour l'export
        fmea_export = await fmea_agent.export_fmea_report(
            fmea_data=request.payload,
            format=request.format
        )
        
        # Créer le fichier d'export
        out_dir = Path("data/exports")
        out_dir.mkdir(parents=True, exist_ok=True)
        
        ext = "xlsx" if request.format == "excel" else request.format
        out_path = out_dir / f"fmea_{request.document_id}.{ext}"
        
        # Préparer les données dans le format attendu par l'export agent
        export_data = {
            "requirements": [],  # Non utilisé pour FMEA
            "test_cases": [],    # Non utilisé pour FMEA
            "fmea_items": fmea_export["rows"],
            "statistics": fmea_export["statistics"],
            "traceability": {}
        }
        
        # Utiliser l'export agent pour créer le fichier
        fmt = ExportFormat(request.format)
        
        if fmt == ExportFormat.EXCEL:
            import pandas as pd
            with pd.ExcelWriter(str(out_path)) as writer:
                pd.DataFrame(fmea_export["rows"]).to_excel(
                    writer, sheet_name="FMEA", index=False
                )
                # Ajouter un onglet statistiques
                stats_df = pd.DataFrame([fmea_export["statistics"]])
                stats_df.to_excel(writer, sheet_name="Statistiques", index=False)
            
            size = out_path.stat().st_size if out_path.exists() else 0
            result = {"format": "excel", "file_size": size, "download_url": str(out_path)}
        else:
            result = await export_agent.export(export_data, fmt, str(out_path))
        
        return result
        
    except Exception as e:
        logger.error(f"FMEA export error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# === COMPLIANCE ENDPOINTS ===
# ==========================================

class ComplianceRequest(BaseModel):
    requirements: List[dict]
    norm_id: str  # ISO 26262, IEC 61508, DO-178C, IEC 62443, EN 50128, ISO 13849
    use_llm: Optional[bool] = True
    llm_provider: Optional[str] = None


@app.get("/compliance/norms")
async def get_available_norms():
    """
    Retourne la liste des normes industrielles disponibles pour la vérification de conformité.
    """
    try:
        compliance_agent = ComplianceAgent()
        norms = compliance_agent.get_available_norms()
        return {"norms": norms}
    except Exception as e:
        logger.error(f"Error getting norms: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/compliance/norms/{norm_id}")
async def get_norm_details(norm_id: str):
    """
    Retourne les détails d'une norme spécifique avec tous ses critères.
    """
    try:
        compliance_agent = ComplianceAgent()
        norm = compliance_agent.get_norm_details(norm_id)
        if not norm:
            raise HTTPException(status_code=404, detail=f"Norme '{norm_id}' non trouvée")
        return norm
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting norm details: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/compliance/check")
async def check_compliance(request: ComplianceRequest):
    """
    Vérifie la conformité des exigences par rapport à une norme industrielle.
    Calcule le score de conformité et identifie les écarts.
    """
    try:
        from agents.core.llm_router import LLMRouter
        
        # Créer le LLM avec le provider choisi
        llm = None
        if request.llm_provider:
            provider = request.llm_provider
            if provider == "tinyllama":
                llm = LLMRouter(provider="ollama", model="tinyllama:latest")
            elif provider == "phi3":
                llm = LLMRouter(provider="ollama", model="phi3:mini")
            elif provider in ["groq", "mistral", "kimi"]:
                llm = LLMRouter(provider=provider)
        
        compliance_agent = ComplianceAgent(llm=llm)
        
        result = await compliance_agent.check_compliance(
            requirements=request.requirements,
            norm_id=request.norm_id,
            use_llm=request.use_llm
        )
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        logger.info(f"Compliance check completed: {result['norm_id']} - Score: {result['global_score']}%")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Compliance check error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/compliance/export")
async def export_compliance(request: ExportRequest):
    """
    Exporte le rapport de conformité dans le format demandé (excel, csv, json).
    """
    try:
        compliance_agent = ComplianceAgent()
        export_agent = ExportAgent()
        
        # Préparer les données pour l'export
        compliance_export = await compliance_agent.generate_compliance_report(
            compliance_data=request.payload
        )
        
        # Créer le fichier d'export
        out_dir = Path("data/exports")
        out_dir.mkdir(parents=True, exist_ok=True)
        
        ext = "xlsx" if request.format == "excel" else request.format
        norm_id = request.payload.get("norm_id", "compliance").replace(" ", "_")
        out_path = out_dir / f"compliance_{norm_id}_{request.document_id}.{ext}"
        
        fmt = ExportFormat(request.format)
        
        if fmt == ExportFormat.EXCEL:
            import pandas as pd
            with pd.ExcelWriter(str(out_path)) as writer:
                # Onglet principal avec les résultats
                pd.DataFrame(compliance_export["rows"]).to_excel(
                    writer, sheet_name="Conformité", index=False
                )
                # Onglet résumé
                summary_df = pd.DataFrame([compliance_export["summary"]])
                summary_df.to_excel(writer, sheet_name="Résumé", index=False)
            
            size = out_path.stat().st_size if out_path.exists() else 0
            result = {"format": "excel", "file_size": size, "download_url": str(out_path)}
        elif fmt == ExportFormat.CSV:
            import pandas as pd
            pd.DataFrame(compliance_export["rows"]).to_csv(str(out_path), index=False, encoding="utf-8-sig")
            size = out_path.stat().st_size if out_path.exists() else 0
            result = {"format": "csv", "file_size": size, "download_url": str(out_path)}
        else:
            # JSON
            import json
            out_path.write_text(json.dumps(request.payload, ensure_ascii=False, indent=2), encoding="utf-8")
            size = out_path.stat().st_size
            result = {"format": "json", "file_size": size, "download_url": str(out_path)}
        
        return result
        
    except Exception as e:
        logger.error(f"Compliance export error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# === CONVERSATIONS ENDPOINTS ===
# ==========================================

# Stockage en mémoire pour les conversations (remplacer par DB en production)
conversations_store: dict = {}
messages_store: dict = {}


@app.post("/conversations")
async def create_conversation(request: ConversationCreate):
    """Créer une nouvelle conversation"""
    import uuid
    from datetime import datetime
    
    conv_id = str(uuid.uuid4())
    conversation = {
        "id": conv_id,
        "title": request.title,
        "document_id": request.document_id,
        "document_name": request.document_name,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
    
    conversations_store[conv_id] = conversation
    messages_store[conv_id] = []
    
    # Ajouter le message de bienvenue
    welcome_msg = {
        "id": str(uuid.uuid4()),
        "type": "agent",
        "content": "Bonjour ! 👋 Je suis votre assistant d'analyse des exigences.\n\nVoici ce que je peux faire pour vous :\n• 📄 **Analyser vos documents** - Uploadez un fichier PDF ou DOCX\n• ❓ **Répondre à vos questions** sur le contenu du document\n• 🧪 **Générer des tests** pour chaque exigence extraite\n\nCommencez par uploader un document en cliquant sur le bouton 📎 ou en glissant un fichier ici.",
        "data": None,
        "created_at": datetime.now().isoformat()
    }
    messages_store[conv_id].append(welcome_msg)
    
    logger.info(f"Created conversation: {conv_id}")
    return {**conversation, "messages": messages_store[conv_id]}


@app.get("/conversations")
async def list_conversations():
    """Lister toutes les conversations"""
    convs = list(conversations_store.values())
    # Trier par date de mise à jour décroissante
    convs.sort(key=lambda x: x.get("updated_at", ""), reverse=True)
    return {"conversations": convs}


@app.get("/conversations/{conv_id}")
async def get_conversation(conv_id: str):
    """Récupérer une conversation avec ses messages"""
    if conv_id not in conversations_store:
        raise HTTPException(status_code=404, detail="Conversation non trouvée")
    
    conversation = conversations_store[conv_id]
    messages = messages_store.get(conv_id, [])
    
    return {**conversation, "messages": messages}


@app.put("/conversations/{conv_id}")
async def update_conversation(conv_id: str, request: ConversationUpdate):
    """Mettre à jour le titre d'une conversation"""
    from datetime import datetime
    
    if conv_id not in conversations_store:
        raise HTTPException(status_code=404, detail="Conversation non trouvée")
    
    conversations_store[conv_id]["title"] = request.title
    conversations_store[conv_id]["updated_at"] = datetime.now().isoformat()
    
    logger.info(f"Updated conversation {conv_id}: {request.title}")
    return conversations_store[conv_id]


@app.delete("/conversations/{conv_id}")
async def delete_conversation(conv_id: str):
    """Supprimer une conversation"""
    if conv_id not in conversations_store:
        raise HTTPException(status_code=404, detail="Conversation non trouvée")
    
    del conversations_store[conv_id]
    if conv_id in messages_store:
        del messages_store[conv_id]
    
    logger.info(f"Deleted conversation: {conv_id}")
    return {"status": "deleted", "id": conv_id}


@app.post("/conversations/{conv_id}/messages")
async def add_message(conv_id: str, request: MessageCreate):
    """Ajouter un message à une conversation"""
    import uuid
    from datetime import datetime
    
    if conv_id not in conversations_store:
        raise HTTPException(status_code=404, detail="Conversation non trouvée")
    
    message = {
        "id": str(uuid.uuid4()),
        "type": request.type,
        "content": request.content,
        "data": request.data,
        "created_at": datetime.now().isoformat()
    }
    
    if conv_id not in messages_store:
        messages_store[conv_id] = []
    
    messages_store[conv_id].append(message)
    
    # Mettre à jour le timestamp de la conversation
    conversations_store[conv_id]["updated_at"] = datetime.now().isoformat()
    
    # Mettre à jour le titre automatiquement si c'est le premier message utilisateur
    user_messages = [m for m in messages_store[conv_id] if m["type"] == "user"]
    if len(user_messages) == 1 and request.type == "user":
        # Extraire un titre du premier message
        content = request.content
        if content.startswith("📄"):
            # C'est un upload de fichier
            match = content.split(":")
            if len(match) > 1:
                conversations_store[conv_id]["title"] = f"Analyse de {match[-1].strip()}"
        else:
            # Premier message texte
            conversations_store[conv_id]["title"] = content[:50] + ("..." if len(content) > 50 else "")
    
    logger.info(f"Added message to conversation {conv_id}: {request.type}")
    return message


# Route de téléchargement des fichiers exportés
@app.get("/download/{file_path:path}")
async def download_file(file_path: str):
    """Télécharger un fichier exporté"""
    # Le file_path peut être absolu ou relatif
    if Path(file_path).is_absolute():
        full_path = Path(file_path)
    else:
        # Chemin relatif depuis la racine du projet
        full_path = Path(__file__).parent.parent / file_path
    
    logger.info(f"Download request for: {file_path} -> {full_path}")
    
    if not full_path.exists():
        logger.error(f"File not found: {full_path}")
        raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
    
    # Déterminer le type MIME
    suffix = full_path.suffix.lower()
    media_types = {
        ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".csv": "text/csv",
        ".json": "application/json",
        ".pdf": "application/pdf",
    }
    media_type = media_types.get(suffix, "application/octet-stream")
    
    return FileResponse(
        path=str(full_path),
        filename=full_path.name,
        media_type=media_type
    )


if __name__ == "__main__":
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
