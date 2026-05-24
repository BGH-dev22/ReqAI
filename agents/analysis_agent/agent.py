"""
Analysis Agent - extraction, classification et priorisation des exigences.
Adapté pour les contextes industriels (batteries, automobile, aéronautique, etc.)
"""

from typing import Dict, List, Any
import logging
import re
import json

from agents.core.llm_router import LLMRouter, render_json_prompt

logger = logging.getLogger(__name__)


class AnalysisAgent:
    """Agent responsable de l'analyse et structuration des exigences"""
    
    def __init__(self, llm: LLMRouter | None = None):
        self.name = "AnalysisAgent"
        self.llm = llm or LLMRouter(max_tokens=4096)  # Plus de tokens pour l'extraction
    
    async def extract_requirements(self, text: str, document_id: str, industry_context: str = "industriel") -> List[Dict[str, Any]]:
        """Extraction via LLM avec contexte industriel, fallback regex."""
        logger.info(f"Extracting requirements from document: {document_id}")
        
        # Prompt plus concis pour éviter les réponses trop longues
        instruction = f"""Extrait les exigences du texte suivant (secteur: {industry_context}).

Pour chaque exigence, donne:
- titre: max 50 caractères
- description: max 150 caractères  
- type: fonctionnelle|performance|sécurité|qualité
- priorite: haute|moyenne|basse

Maximum 10 exigences les plus importantes.
Réponds en JSON valide uniquement."""

        prompt = f"{instruction}\n\nTexte:\n{text[:3000]}"

        try:
            raw = self.llm.generate(prompt)
            # Nettoyer la réponse (enlever markdown si présent)
            raw = raw.strip()
            if raw.startswith("```json"):
                raw = raw[7:]
            if raw.startswith("```"):
                raw = raw[3:]
            if raw.endswith("```"):
                raw = raw[:-3]
            raw = raw.strip()
            
            # Tenter de réparer un JSON tronqué
            parsed = self._parse_partial_json(raw)
            requirements = []
            if isinstance(parsed, list):
                for r in parsed:
                    if not isinstance(r, dict):
                        continue
                    requirements.append(
                        {
                            "id": (r.get("id") or "").strip(),
                            "titre": (r.get("titre") or r.get("title") or "").strip(),
                            "description": (r.get("description") or "").strip(),
                            "type": (r.get("type") or "fonctionnelle").strip().lower(),
                            "priorite": (r.get("priorite") or r.get("priority") or "moyenne").strip().lower(),
                            "criteres_acceptation": r.get("criteres_acceptation") or "",
                            "source": r.get("source") or "",
                        }
                    )
            logger.info(f"Extracted {len(requirements)} requirements via LLM")
        except Exception as e:
            logger.warning(f"LLM extraction failed: {e}, using fallback")
            requirements = []

        # Fallback amélioré: chercher des patterns d'exigences
        if not requirements:
            requirements = self._fallback_extraction(text)
            
        return requirements
    
    def _parse_partial_json(self, raw: str) -> List[Dict[str, Any]]:
        """Tente de parser un JSON même s'il est tronqué"""
        import re
        
        # Essayer de parser tel quel
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            pass
        
        # Essayer d'extraire les objets JSON complets
        results = []
        # Pattern pour trouver des objets JSON complets
        pattern = r'\{[^{}]*"titre"[^{}]*\}'
        matches = re.findall(pattern, raw, re.DOTALL)
        
        for match in matches:
            try:
                obj = json.loads(match)
                results.append(obj)
            except:
                pass
        
        if results:
            return results
        
        # Dernier essai: fermer le JSON tronqué
        if raw.startswith('['):
            # Trouver le dernier objet complet
            last_complete = raw.rfind('},')
            if last_complete > 0:
                try:
                    return json.loads(raw[:last_complete+1] + ']')
                except:
                    pass
            last_complete = raw.rfind('}')
            if last_complete > 0:
                try:
                    return json.loads(raw[:last_complete+1] + ']')
                except:
                    pass
        
        raise ValueError("Could not parse JSON")
    
    def _fallback_extraction(self, text: str) -> List[Dict[str, Any]]:
        """Extraction de secours basée sur des patterns regex"""
        requirements = []
        
        # Pattern pour les exigences numérotées (REQ-001, EX-1, etc.)
        req_pattern = re.findall(r"(?:REQ|EX|SPEC|R)-?\d+[:\s]+(.+?)(?=\n|$)", text, re.IGNORECASE)
        for i, match in enumerate(req_pattern):
            requirements.append({
                "id": "",
                "titre": match[:100].strip(),
                "description": match.strip(),
                "type": "fonctionnelle",
                "priorite": "moyenne",
                "criteres_acceptation": "",
                "source": "extraction automatique"
            })
        
        # Pattern pour les puces et listes
        bullets = re.findall(r"^[-•*]\s+(.+?)$", text, flags=re.MULTILINE)
        for b in bullets:
            if len(b) > 20 and any(kw in b.lower() for kw in ["doit", "shall", "must", "devra", "requiert", "nécessite", "minimum", "maximum"]):
                requirements.append({
                    "id": "",
                    "titre": b[:80].strip(),
                    "description": b.strip(),
                    "type": "fonctionnelle",
                    "priorite": "moyenne",
                    "criteres_acceptation": "",
                    "source": "extraction automatique"
                })
        
        # Pattern pour les spécifications techniques avec valeurs
        specs = re.findall(r"([A-Za-zÀ-ÿ\s]+)[\s:]+(\d+(?:[.,]\d+)?)\s*(mm|cm|m|kg|g|V|A|W|°C|%|h|min|s)", text)
        for spec in specs:
            name, value, unit = spec
            requirements.append({
                "id": "",
                "titre": f"{name.strip()}: {value} {unit}",
                "description": f"La valeur de {name.strip()} doit être de {value} {unit}",
                "type": "performance",
                "priorite": "haute",
                "criteres_acceptation": f"Mesure: {value} {unit}",
                "source": "extraction automatique"
            })
        
        return requirements
    
    async def classify_requirements(self, requirements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        logger.info(f"Classifying {len(requirements)} requirements")
        for req in requirements:
            t = req.get("type", "").lower()
            if t not in {"fonctionnelle", "performance", "interface", "sécurité", "qualité"}:
                req["type"] = "fonctionnelle"
        return requirements
    
    async def prioritize_requirements(self, requirements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        logger.info(f"Prioritizing {len(requirements)} requirements")
        for req in requirements:
            p = req.get("priorite", "").lower()
            if p not in {"haute", "moyenne", "basse"}:
                req["priorite"] = "moyenne"
        return requirements
    
    async def assign_ids(self, requirements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        for idx, req in enumerate(requirements, start=1):
            if not req.get("id"):
                req["id"] = f"REQ-{idx:03d}"
        return requirements
    
    async def analyze(self, text: str, document_id: str) -> Dict[str, Any]:
        logger.info(f"Starting analysis for document: {document_id}")
        requirements = await self.extract_requirements(text, document_id)
        requirements = await self.classify_requirements(requirements)
        requirements = await self.prioritize_requirements(requirements)
        requirements = await self.assign_ids(requirements)
        return {
            "requirements": requirements,
            "total_count": len(requirements),
            "quality_score": 0.85,
        }


if __name__ == "__main__":
    import asyncio
    
    agent = AnalysisAgent()
    print(f"Initialized {agent.name}")
