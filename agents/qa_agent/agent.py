"""
Q/A Agent - RAG avec FAISS, citations structurées et LLM router.
"""

from typing import Dict, List, Any
import logging
import time

from agents.core.llm_router import LLMRouter
from agents.core import rag_store

logger = logging.getLogger(__name__)


class QAAgent:
    """Agent responsable des réponses aux questions"""
    
    def __init__(self, llm: LLMRouter | None = None, base_dir: str = "data"):
        self.name = "QAAgent"
        self.llm = llm or LLMRouter()
        self.base_dir = base_dir
    
    async def search_relevant_sections(self, question: str, document_id: str) -> List[Dict[str, Any]]:
        """Recherche sémantique via FAISS avec métadonnées de page."""
        logger.info(f"Searching relevant sections for question: {question}")
        hits = rag_store.search(document_id, question, top_k=5, base_dir=self.base_dir)
        results = []
        for chunk, score, meta in hits:
            results.append({"text": chunk, "score": score, "meta": meta})
        return results
    
    async def generate_answer(self, question: str, context: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Génère une réponse concise avec citations des passages top-k."""
        ctx_text = "\n---\n".join([c["text"] for c in context])
        prompt = (
            "Tu es un assistant RAG. Réponds à la question en te basant uniquement sur le contexte. "
            "Ajoute une liste de citations sous forme d'extraits courts et garde le format JSON sécurisé."
            f"\nQuestion: {question}\nContexte:\n{ctx_text}\nRéponse concise en français:" 
        )
        start = time.time()
        answer = self.llm.generate(prompt)
        elapsed = int((time.time() - start) * 1000)
        citations = []
        for c in context:
            meta = c.get("meta", {})
            citations.append(
                {
                    "excerpt": c["text"][:240],
                    "score": c.get("score", 0.0),
                    "page": meta.get("page"),
                    "section": meta.get("section", ""),
                    "start_char": meta.get("start_char"),
                    "end_char": meta.get("end_char"),
                }
            )
        return {
            "question": question,
            "answer": answer.strip(),
            "citations": citations,
            "relevance_score": max([c.get("score", 0) for c in context], default=0),
            "processing_time_ms": elapsed,
        }
    
    async def answer_question(self, question: str, document_id: str) -> Dict[str, Any]:
        logger.info(f"Processing question for document: {document_id}")
        try:
            context = await self.search_relevant_sections(question, document_id)
            return await self.generate_answer(question, context)
        except FileNotFoundError:
            # Index manquant : retourner une réponse dégradée plutôt qu'un 500
            logger.warning("No index found for document %s; returning fallback answer", document_id)
            return {
                "question": question,
                "answer": "Aucun index n'est disponible pour ce document. Veuillez lancer l'ingestion/analysis puis réessayer.",
                "citations": [],
                "relevance_score": 0,
                "processing_time_ms": 0,
            }
        except Exception as e:
            logger.error(f"QA error for document {document_id}: {e}")
            return {
                "question": question,
                "answer": "Une erreur est survenue pendant la génération de la réponse.",
                "citations": [],
                "relevance_score": 0,
                "processing_time_ms": 0,
            }


if __name__ == "__main__":
    import asyncio
    
    agent = QAAgent()
    print(f"Initialized {agent.name}")
