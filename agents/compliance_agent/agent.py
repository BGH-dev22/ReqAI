"""
Compliance Agent - Vérification de conformité aux normes industrielles
Supporte: ISO 26262, IEC 61508, DO-178C, IEC 62443, EN 50128, ISO 13849
"""

from typing import Dict, List, Any, Optional
import logging
import json

from agents.core.llm_router import LLMRouter

logger = logging.getLogger(__name__)


class ComplianceAgent:
    """Agent responsable de la vérification de conformité normative"""
    
    # Définition des normes supportées et leurs critères
    NORMS_DATABASE = {
        "ISO 26262": {
            "name": "ISO 26262",
            "full_name": "ISO 26262 - Sécurité fonctionnelle des véhicules routiers",
            "domain": "Automobile",
            "description": "Norme internationale pour la sécurité fonctionnelle des systèmes électriques/électroniques automobiles",
            "asil_levels": ["QM", "ASIL A", "ASIL B", "ASIL C", "ASIL D"],
            "categories": [
                {
                    "id": "ISO26262-REQ",
                    "name": "Gestion des exigences",
                    "criteria": [
                        {"id": "ISO26262-REQ-01", "text": "Traçabilité bidirectionnelle des exigences", "keywords": ["traçabilité", "tracabilite", "traceability", "lien", "référence"]},
                        {"id": "ISO26262-REQ-02", "text": "Exigences de sécurité clairement identifiées", "keywords": ["sécurité", "safety", "sûreté", "protection", "asil"]},
                        {"id": "ISO26262-REQ-03", "text": "Vérification et validation des exigences", "keywords": ["vérification", "validation", "test", "revue", "audit"]},
                    ]
                },
                {
                    "id": "ISO26262-SAFE",
                    "name": "Analyse de sécurité",
                    "criteria": [
                        {"id": "ISO26262-SAFE-01", "text": "Analyse des risques (HARA)", "keywords": ["risque", "hara", "hazard", "danger", "analyse"]},
                        {"id": "ISO26262-SAFE-02", "text": "Objectifs de sécurité définis", "keywords": ["objectif", "goal", "cible", "sécurité"]},
                        {"id": "ISO26262-SAFE-03", "text": "Mécanismes de détection des défaillances", "keywords": ["détection", "défaillance", "failure", "diagnostic", "monitoring"]},
                        {"id": "ISO26262-SAFE-04", "text": "États sûrs définis", "keywords": ["état sûr", "safe state", "mode dégradé", "fallback"]},
                    ]
                },
                {
                    "id": "ISO26262-HW",
                    "name": "Développement hardware",
                    "criteria": [
                        {"id": "ISO26262-HW-01", "text": "Métriques hardware (SPFM, LFM)", "keywords": ["spfm", "lfm", "métrique", "hardware", "taux"]},
                        {"id": "ISO26262-HW-02", "text": "Analyse FMEA/FMEDA", "keywords": ["fmea", "fmeda", "défaillance", "mode"]},
                    ]
                },
                {
                    "id": "ISO26262-SW",
                    "name": "Développement software",
                    "criteria": [
                        {"id": "ISO26262-SW-01", "text": "Architecture logicielle documentée", "keywords": ["architecture", "logiciel", "software", "conception"]},
                        {"id": "ISO26262-SW-02", "text": "Couverture de code spécifiée", "keywords": ["couverture", "coverage", "test", "mc/dc", "branche"]},
                        {"id": "ISO26262-SW-03", "text": "Revue de code", "keywords": ["revue", "review", "inspection", "code"]},
                    ]
                },
                {
                    "id": "ISO26262-VAL",
                    "name": "Validation",
                    "criteria": [
                        {"id": "ISO26262-VAL-01", "text": "Plan de validation défini", "keywords": ["plan", "validation", "stratégie", "test"]},
                        {"id": "ISO26262-VAL-02", "text": "Tests d'intégration", "keywords": ["intégration", "integration", "système", "test"]},
                        {"id": "ISO26262-VAL-03", "text": "Tests de validation véhicule", "keywords": ["véhicule", "vehicle", "validation", "terrain"]},
                    ]
                }
            ]
        },
        "IEC 61508": {
            "name": "IEC 61508",
            "full_name": "IEC 61508 - Sécurité fonctionnelle des systèmes E/E/PE",
            "domain": "Industriel général",
            "description": "Norme mère pour la sécurité fonctionnelle des systèmes électriques, électroniques et programmables",
            "sil_levels": ["SIL 1", "SIL 2", "SIL 3", "SIL 4"],
            "categories": [
                {
                    "id": "IEC61508-REQ",
                    "name": "Exigences de sécurité",
                    "criteria": [
                        {"id": "IEC61508-REQ-01", "text": "Spécification des exigences de sécurité (SRS)", "keywords": ["srs", "spécification", "sécurité", "exigence"]},
                        {"id": "IEC61508-REQ-02", "text": "Allocation SIL aux fonctions", "keywords": ["sil", "allocation", "niveau", "intégrité"]},
                        {"id": "IEC61508-REQ-03", "text": "Exigences d'intégrité matérielle", "keywords": ["intégrité", "hardware", "matériel", "fiabilité"]},
                    ]
                },
                {
                    "id": "IEC61508-LIFECYCLE",
                    "name": "Cycle de vie de sécurité",
                    "criteria": [
                        {"id": "IEC61508-LC-01", "text": "Plan de sécurité fonctionnelle", "keywords": ["plan", "sécurité", "fonctionnelle", "gestion"]},
                        {"id": "IEC61508-LC-02", "text": "Gestion de la configuration", "keywords": ["configuration", "gestion", "version", "changement"]},
                        {"id": "IEC61508-LC-03", "text": "Documentation de sécurité", "keywords": ["documentation", "dossier", "rapport", "sécurité"]},
                    ]
                },
                {
                    "id": "IEC61508-VALID",
                    "name": "Vérification et validation",
                    "criteria": [
                        {"id": "IEC61508-VV-01", "text": "Plan de vérification", "keywords": ["vérification", "plan", "test", "revue"]},
                        {"id": "IEC61508-VV-02", "text": "Preuves de validation", "keywords": ["validation", "preuve", "évidence", "démonstration"]},
                        {"id": "IEC61508-VV-03", "text": "Tests de sécurité fonctionnelle", "keywords": ["test", "sécurité", "fonctionnel", "scénario"]},
                    ]
                }
            ]
        },
        "DO-178C": {
            "name": "DO-178C",
            "full_name": "DO-178C - Software Considerations in Airborne Systems",
            "domain": "Aéronautique",
            "description": "Standard pour le développement de logiciels embarqués aéronautiques",
            "dal_levels": ["DAL A", "DAL B", "DAL C", "DAL D", "DAL E"],
            "categories": [
                {
                    "id": "DO178C-PLAN",
                    "name": "Planification",
                    "criteria": [
                        {"id": "DO178C-PLAN-01", "text": "Plan de développement logiciel (SDP)", "keywords": ["plan", "développement", "sdp", "logiciel"]},
                        {"id": "DO178C-PLAN-02", "text": "Plan de vérification logiciel (SVP)", "keywords": ["vérification", "plan", "svp", "test"]},
                        {"id": "DO178C-PLAN-03", "text": "Plan de gestion de configuration (SCMP)", "keywords": ["configuration", "gestion", "scmp", "version"]},
                    ]
                },
                {
                    "id": "DO178C-DEV",
                    "name": "Développement",
                    "criteria": [
                        {"id": "DO178C-DEV-01", "text": "Exigences haut niveau (HLR)", "keywords": ["hlr", "haut niveau", "exigence", "système"]},
                        {"id": "DO178C-DEV-02", "text": "Exigences bas niveau (LLR)", "keywords": ["llr", "bas niveau", "exigence", "détaillé"]},
                        {"id": "DO178C-DEV-03", "text": "Architecture logicielle", "keywords": ["architecture", "design", "conception", "logiciel"]},
                        {"id": "DO178C-DEV-04", "text": "Standards de codage", "keywords": ["codage", "standard", "règle", "code"]},
                    ]
                },
                {
                    "id": "DO178C-VERIF",
                    "name": "Vérification",
                    "criteria": [
                        {"id": "DO178C-VER-01", "text": "Couverture structurelle (MC/DC pour DAL A)", "keywords": ["couverture", "mc/dc", "structurel", "branche"]},
                        {"id": "DO178C-VER-02", "text": "Traçabilité exigences-tests", "keywords": ["traçabilité", "exigence", "test", "lien"]},
                        {"id": "DO178C-VER-03", "text": "Analyse de code mort", "keywords": ["code mort", "dead code", "analyse", "inutilisé"]},
                    ]
                }
            ]
        },
        "IEC 62443": {
            "name": "IEC 62443",
            "full_name": "IEC 62443 - Cybersécurité des systèmes industriels",
            "domain": "Cybersécurité industrielle",
            "description": "Série de normes pour la sécurité des systèmes d'automatisation et de contrôle industriels (IACS)",
            "sl_levels": ["SL 1", "SL 2", "SL 3", "SL 4"],
            "categories": [
                {
                    "id": "IEC62443-SEC",
                    "name": "Exigences de sécurité",
                    "criteria": [
                        {"id": "IEC62443-SEC-01", "text": "Identification et authentification", "keywords": ["authentification", "identification", "accès", "utilisateur", "login"]},
                        {"id": "IEC62443-SEC-02", "text": "Contrôle d'accès", "keywords": ["accès", "contrôle", "autorisation", "permission", "rôle"]},
                        {"id": "IEC62443-SEC-03", "text": "Intégrité des données", "keywords": ["intégrité", "donnée", "data", "protection", "modification"]},
                        {"id": "IEC62443-SEC-04", "text": "Confidentialité des données", "keywords": ["confidentialité", "chiffrement", "encryption", "secret", "cryptage"]},
                        {"id": "IEC62443-SEC-05", "text": "Disponibilité du système", "keywords": ["disponibilité", "availability", "uptime", "redondance"]},
                    ]
                },
                {
                    "id": "IEC62443-RISK",
                    "name": "Gestion des risques",
                    "criteria": [
                        {"id": "IEC62443-RISK-01", "text": "Analyse des menaces", "keywords": ["menace", "threat", "attaque", "vulnérabilité"]},
                        {"id": "IEC62443-RISK-02", "text": "Évaluation des risques cyber", "keywords": ["risque", "cyber", "évaluation", "impact"]},
                        {"id": "IEC62443-RISK-03", "text": "Plan de réponse aux incidents", "keywords": ["incident", "réponse", "plan", "recovery"]},
                    ]
                }
            ]
        },
        "EN 50128": {
            "name": "EN 50128",
            "full_name": "EN 50128 - Logiciels pour systèmes de commande et de protection ferroviaires",
            "domain": "Ferroviaire",
            "description": "Norme européenne pour le développement de logiciels ferroviaires critiques",
            "sil_levels": ["SIL 0", "SIL 1", "SIL 2", "SIL 3", "SIL 4"],
            "categories": [
                {
                    "id": "EN50128-REQ",
                    "name": "Exigences logicielles",
                    "criteria": [
                        {"id": "EN50128-REQ-01", "text": "Spécification des exigences logicielles", "keywords": ["spécification", "exigence", "logiciel", "software"]},
                        {"id": "EN50128-REQ-02", "text": "Exigences de sécurité logicielle", "keywords": ["sécurité", "safety", "logiciel", "exigence"]},
                    ]
                },
                {
                    "id": "EN50128-DEV",
                    "name": "Développement",
                    "criteria": [
                        {"id": "EN50128-DEV-01", "text": "Architecture et conception", "keywords": ["architecture", "conception", "design", "structure"]},
                        {"id": "EN50128-DEV-02", "text": "Implémentation et codage", "keywords": ["implémentation", "codage", "code", "développement"]},
                        {"id": "EN50128-DEV-03", "text": "Tests unitaires et d'intégration", "keywords": ["test", "unitaire", "intégration", "module"]},
                    ]
                }
            ]
        },
        "ISO 13849": {
            "name": "ISO 13849",
            "full_name": "ISO 13849 - Sécurité des machines - Parties des systèmes de commande",
            "domain": "Machines industrielles",
            "description": "Norme pour la conception des parties de systèmes de commande relatives à la sécurité des machines",
            "pl_levels": ["PL a", "PL b", "PL c", "PL d", "PL e"],
            "categories": [
                {
                    "id": "ISO13849-REQ",
                    "name": "Exigences de sécurité",
                    "criteria": [
                        {"id": "ISO13849-REQ-01", "text": "Fonctions de sécurité identifiées", "keywords": ["fonction", "sécurité", "safety", "protection"]},
                        {"id": "ISO13849-REQ-02", "text": "Performance Level requis (PLr)", "keywords": ["pl", "performance", "level", "niveau"]},
                        {"id": "ISO13849-REQ-03", "text": "Catégorie de sécurité", "keywords": ["catégorie", "category", "architecture", "redondance"]},
                    ]
                },
                {
                    "id": "ISO13849-VALID",
                    "name": "Validation",
                    "criteria": [
                        {"id": "ISO13849-VAL-01", "text": "Plan de validation", "keywords": ["plan", "validation", "test", "vérification"]},
                        {"id": "ISO13849-VAL-02", "text": "Tests des fonctions de sécurité", "keywords": ["test", "fonction", "sécurité", "essai"]},
                        {"id": "ISO13849-VAL-03", "text": "Documentation de validation", "keywords": ["documentation", "rapport", "validation", "preuve"]},
                    ]
                }
            ]
        }
    }
    
    def __init__(self, llm: LLMRouter | None = None):
        self.name = "ComplianceAgent"
        self.llm = llm or LLMRouter()
    
    def get_available_norms(self) -> List[Dict[str, Any]]:
        """Retourne la liste des normes disponibles"""
        return [
            {
                "id": norm_id,
                "name": norm["name"],
                "full_name": norm["full_name"],
                "domain": norm["domain"],
                "description": norm["description"],
                "categories_count": len(norm["categories"]),
                "criteria_count": sum(len(cat["criteria"]) for cat in norm["categories"])
            }
            for norm_id, norm in self.NORMS_DATABASE.items()
        ]
    
    def get_norm_details(self, norm_id: str) -> Optional[Dict[str, Any]]:
        """Retourne les détails d'une norme spécifique"""
        return self.NORMS_DATABASE.get(norm_id)
    
    async def check_compliance(
        self,
        requirements: List[Dict[str, Any]],
        norm_id: str,
        use_llm: bool = True
    ) -> Dict[str, Any]:
        """
        Vérifie la conformité des exigences par rapport à une norme.
        
        Args:
            requirements: Liste des exigences à vérifier
            norm_id: Identifiant de la norme (ex: "ISO 26262")
            use_llm: Utiliser le LLM pour une analyse plus approfondie
        
        Returns:
            Rapport de conformité détaillé
        """
        logger.info(f"Checking compliance for {len(requirements)} requirements against {norm_id}")
        
        norm = self.NORMS_DATABASE.get(norm_id)
        if not norm:
            return {"error": f"Norme '{norm_id}' non supportée", "available_norms": list(self.NORMS_DATABASE.keys())}
        
        # Analyse par critère
        compliance_results = []
        covered_criteria = set()
        partially_covered = set()
        
        for category in norm["categories"]:
            category_results = {
                "category_id": category["id"],
                "category_name": category["name"],
                "criteria_results": []
            }
            
            for criterion in category["criteria"]:
                # Rechercher les exigences correspondantes
                matching_requirements = self._find_matching_requirements(
                    requirements, criterion, use_llm
                )
                
                coverage_status = "non_couvert"
                if len(matching_requirements) >= 2:
                    coverage_status = "couvert"
                    covered_criteria.add(criterion["id"])
                elif len(matching_requirements) == 1:
                    coverage_status = "partiel"
                    partially_covered.add(criterion["id"])
                
                criterion_result = {
                    "criterion_id": criterion["id"],
                    "criterion_text": criterion["text"],
                    "status": coverage_status,
                    "matching_requirements": matching_requirements,
                    "coverage_count": len(matching_requirements),
                    "recommendation": self._get_recommendation(criterion, coverage_status, matching_requirements)
                }
                
                category_results["criteria_results"].append(criterion_result)
            
            # Calculer le score de la catégorie
            total_criteria = len(category["criteria"])
            covered_in_cat = sum(1 for c in category_results["criteria_results"] if c["status"] == "couvert")
            partial_in_cat = sum(1 for c in category_results["criteria_results"] if c["status"] == "partiel")
            
            category_results["coverage_score"] = round((covered_in_cat + 0.5 * partial_in_cat) / total_criteria * 100, 1) if total_criteria > 0 else 0
            category_results["total_criteria"] = total_criteria
            category_results["covered_count"] = covered_in_cat
            category_results["partial_count"] = partial_in_cat
            
            compliance_results.append(category_results)
        
        # Statistiques globales
        total_criteria = sum(len(cat["criteria"]) for cat in norm["categories"])
        global_score = round((len(covered_criteria) + 0.5 * len(partially_covered)) / total_criteria * 100, 1) if total_criteria > 0 else 0
        
        # Générer les recommandations prioritaires via LLM si activé
        priority_recommendations = []
        if use_llm:
            priority_recommendations = await self._generate_priority_recommendations(
                compliance_results, norm, requirements
            )
        
        # Déterminer le niveau de conformité
        compliance_level = self._determine_compliance_level(global_score)
        
        return {
            "norm_id": norm_id,
            "norm_name": norm["name"],
            "norm_full_name": norm["full_name"],
            "domain": norm["domain"],
            "compliance_level": compliance_level,
            "global_score": global_score,
            "statistics": {
                "total_requirements": len(requirements),
                "total_criteria": total_criteria,
                "covered_criteria": len(covered_criteria),
                "partially_covered": len(partially_covered),
                "uncovered_criteria": total_criteria - len(covered_criteria) - len(partially_covered)
            },
            "categories": compliance_results,
            "priority_recommendations": priority_recommendations,
            "gaps": self._identify_gaps(compliance_results),
            "strengths": self._identify_strengths(compliance_results)
        }
    
    def _find_matching_requirements(
        self,
        requirements: List[Dict[str, Any]],
        criterion: Dict[str, Any],
        use_llm: bool
    ) -> List[Dict[str, Any]]:
        """Trouve les exigences correspondant à un critère"""
        matches = []
        keywords = criterion.get("keywords", [])
        
        for req in requirements:
            titre = (req.get("titre") or req.get("Titre") or req.get("title") or "").lower()
            description = (req.get("description") or req.get("Description") or "").lower()
            combined = f"{titre} {description}"
            
            # Score de correspondance basé sur les mots-clés
            match_score = 0
            matched_keywords = []
            
            for keyword in keywords:
                if keyword.lower() in combined:
                    match_score += 1
                    matched_keywords.append(keyword)
            
            if match_score > 0:
                matches.append({
                    "requirement_id": req.get("id") or req.get("ID"),
                    "requirement_title": req.get("titre") or req.get("Titre") or req.get("title"),
                    "match_score": match_score,
                    "matched_keywords": matched_keywords,
                    "confidence": min(100, match_score * 30)  # Max 100%
                })
        
        # Trier par score de correspondance
        matches.sort(key=lambda x: x["match_score"], reverse=True)
        return matches[:5]  # Retourner max 5 correspondances
    
    def _get_recommendation(
        self,
        criterion: Dict[str, Any],
        status: str,
        matching_requirements: List[Dict[str, Any]]
    ) -> str:
        """Génère une recommandation pour un critère"""
        if status == "couvert":
            return f"✅ Critère bien couvert par {len(matching_requirements)} exigence(s)"
        elif status == "partiel":
            return f"⚠️ Couverture partielle - Renforcer avec des exigences supplémentaires pour: {criterion['text']}"
        else:
            return f"❌ Ajouter des exigences pour couvrir: {criterion['text']}"
    
    def _determine_compliance_level(self, score: float) -> str:
        """Détermine le niveau de conformité global"""
        if score >= 90:
            return "conforme"
        elif score >= 70:
            return "quasi_conforme"
        elif score >= 50:
            return "partiellement_conforme"
        elif score >= 25:
            return "non_conforme"
        else:
            return "non_applicable"
    
    def _identify_gaps(self, compliance_results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Identifie les écarts de conformité (critères non couverts)"""
        gaps = []
        for category in compliance_results:
            for criterion in category["criteria_results"]:
                if criterion["status"] == "non_couvert":
                    gaps.append({
                        "category": category["category_name"],
                        "criterion_id": criterion["criterion_id"],
                        "criterion_text": criterion["criterion_text"],
                        "severity": "high" if "sécurité" in criterion["criterion_text"].lower() else "medium"
                    })
        return gaps
    
    def _identify_strengths(self, compliance_results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Identifie les points forts (critères bien couverts)"""
        strengths = []
        for category in compliance_results:
            if category["coverage_score"] >= 80:
                strengths.append({
                    "category": category["category_name"],
                    "score": category["coverage_score"],
                    "covered_count": category["covered_count"]
                })
        return strengths
    
    async def _generate_priority_recommendations(
        self,
        compliance_results: List[Dict[str, Any]],
        norm: Dict[str, Any],
        requirements: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Génère des recommandations prioritaires via LLM"""
        
        # Collecter les gaps
        gaps = []
        for category in compliance_results:
            for criterion in category["criteria_results"]:
                if criterion["status"] in ["non_couvert", "partiel"]:
                    gaps.append({
                        "category": category["category_name"],
                        "criterion": criterion["criterion_text"],
                        "status": criterion["status"]
                    })
        
        if not gaps:
            return [{"priority": 1, "action": "Aucune action requise - Conformité complète", "impact": "none"}]
        
        # Limiter à 5 gaps pour le prompt
        gaps = gaps[:5]
        
        prompt = f"""Analyse de conformité {norm['name']} pour un système {norm['domain']}.

ÉCARTS IDENTIFIÉS:
{json.dumps(gaps, ensure_ascii=False, indent=2)}

EXIGENCES EXISTANTES: {len(requirements)} exigences

Génère 3-5 recommandations prioritaires pour combler ces écarts.

Format JSON strict:
[
  {{
    "priority": 1,
    "action": "Description de l'action corrective",
    "criterion": "Critère concerné",
    "impact": "high|medium|low",
    "effort": "Estimation de l'effort (jours/semaines)"
  }}
]

JSON uniquement:"""

        try:
            raw = self.llm.generate(prompt)
            raw = raw.strip()
            if raw.startswith("```json"):
                raw = raw[7:]
            if raw.startswith("```"):
                raw = raw[3:]
            if raw.endswith("```"):
                raw = raw[:-3]
            raw = raw.strip()
            
            start_idx = raw.find('[')
            end_idx = raw.rfind(']') + 1
            if start_idx != -1 and end_idx > start_idx:
                raw = raw[start_idx:end_idx]
            
            recommendations = json.loads(raw)
            return recommendations if isinstance(recommendations, list) else []
            
        except Exception as e:
            logger.warning(f"LLM recommendation generation failed: {e}")
            # Fallback: générer des recommandations basiques
            return [
                {
                    "priority": idx + 1,
                    "action": f"Ajouter des exigences pour couvrir: {gap['criterion']}",
                    "criterion": gap["criterion"],
                    "impact": "high" if gap["status"] == "non_couvert" else "medium",
                    "effort": "1-2 semaines"
                }
                for idx, gap in enumerate(gaps[:3])
            ]
    
    async def generate_compliance_report(
        self,
        compliance_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Génère un rapport de conformité formaté pour l'export"""
        
        report_rows = []
        
        for category in compliance_data.get("categories", []):
            for criterion in category.get("criteria_results", []):
                matching_reqs = ", ".join([
                    m["requirement_id"] for m in criterion.get("matching_requirements", [])
                ]) or "Aucune"
                
                report_rows.append({
                    "Norme": compliance_data.get("norm_id"),
                    "Catégorie": category.get("category_name"),
                    "ID_Critère": criterion.get("criterion_id"),
                    "Critère": criterion.get("criterion_text"),
                    "Statut": criterion.get("status"),
                    "Exigences_Correspondantes": matching_reqs,
                    "Nb_Correspondances": criterion.get("coverage_count", 0),
                    "Recommandation": criterion.get("recommendation")
                })
        
        return {
            "rows": report_rows,
            "summary": {
                "norm": compliance_data.get("norm_name"),
                "global_score": compliance_data.get("global_score"),
                "compliance_level": compliance_data.get("compliance_level"),
                "statistics": compliance_data.get("statistics")
            }
        }


if __name__ == "__main__":
    import asyncio
    
    agent = ComplianceAgent()
    print(f"Initialized {agent.name}")
    print(f"Available norms: {[n['name'] for n in agent.get_available_norms()]}")
    
    # Test avec des exigences exemple
    test_reqs = [
        {
            "id": "REQ-001",
            "titre": "Authentification sécurisée des utilisateurs",
            "description": "Le système doit authentifier les utilisateurs avant accès",
            "type": "security"
        },
        {
            "id": "REQ-002",
            "titre": "Traçabilité des exigences",
            "description": "Toutes les exigences doivent être traçables",
            "type": "functional"
        }
    ]
    
    async def test():
        result = await agent.check_compliance(test_reqs, "ISO 26262", use_llm=False)
        print(f"Compliance score: {result['global_score']}%")
        print(f"Level: {result['compliance_level']}")
    
    asyncio.run(test())
