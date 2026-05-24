"""
FMEA Agent - Analyse des Modes de Défaillance et de leurs Effets
(Failure Mode and Effects Analysis)

Génère automatiquement une analyse FMEA à partir des exigences.
Calcule le RPN (Risk Priority Number) et propose des actions correctives.
"""

from typing import Dict, List, Any, Optional
import logging
import json

from agents.core.llm_router import LLMRouter

logger = logging.getLogger(__name__)


class FMEAAgent:
    """Agent responsable de l'analyse FMEA automatisée"""
    
    # Échelles de notation FMEA standard
    SEVERITY_SCALE = {
        10: "Défaillance catastrophique - danger sans avertissement",
        9: "Défaillance critique - danger avec avertissement",
        8: "Perte de fonction principale - système inopérant",
        7: "Dégradation majeure de performance",
        6: "Perte partielle de fonction",
        5: "Dégradation modérée de performance",
        4: "Défaut mineur - fonction dégradée",
        3: "Défaut mineur - légère gêne",
        2: "Défaut très mineur - presque imperceptible",
        1: "Aucun effet"
    }
    
    OCCURRENCE_SCALE = {
        10: "Très élevée: défaillance quasi-certaine (≥1/2)",
        9: "Très élevée: défaillance très probable (1/3)",
        8: "Élevée: défaillances fréquentes (1/8)",
        7: "Élevée: défaillances répétées (1/20)",
        6: "Modérée: défaillances occasionnelles (1/80)",
        5: "Modérée: défaillances peu fréquentes (1/400)",
        4: "Modérée: défaillances isolées (1/2000)",
        3: "Faible: défaillances rares (1/15000)",
        2: "Faible: défaillances très rares (1/150000)",
        1: "Très faible: défaillance improbable (≤1/1500000)"
    }
    
    DETECTION_SCALE = {
        10: "Impossible: aucun contrôle ne peut détecter",
        9: "Très difficile: contrôle très peu fiable",
        8: "Difficile: contrôle peu fiable",
        7: "Très faible: faible probabilité de détection",
        6: "Faible: contrôle peut détecter",
        5: "Modérée: contrôle modérément efficace",
        4: "Modérément élevée: bonne probabilité de détection",
        3: "Élevée: contrôle fiable",
        2: "Très élevée: contrôle très fiable",
        1: "Certaine: détection garantie avant effet"
    }
    
    RPN_THRESHOLDS = {
        "critique": 200,      # RPN ≥ 200: action immédiate requise
        "majeur": 120,        # RPN 120-199: action prioritaire
        "modere": 80,         # RPN 80-119: action planifiée
        "mineur": 40,         # RPN 40-79: surveillance
        "acceptable": 0       # RPN < 40: acceptable
    }
    
    def __init__(self, llm: LLMRouter | None = None):
        self.name = "FMEAAgent"
        self.llm = llm or LLMRouter()
    
    async def generate_fmea(
        self,
        requirements: List[Dict[str, Any]],
        system_context: str = "système industriel",
        industry: str = "general"
    ) -> Dict[str, Any]:
        """
        Génère une analyse FMEA complète à partir des exigences.
        
        Args:
            requirements: Liste des exigences à analyser
            system_context: Contexte du système (ex: "batterie véhicule électrique")
            industry: Secteur industriel (automotive, aerospace, medical, general)
        
        Returns:
            Analyse FMEA complète avec RPN et recommandations
        """
        logger.info(f"Generating FMEA for {len(requirements)} requirements")
        
        fmea_items: List[Dict[str, Any]] = []
        
        for idx, req in enumerate(requirements, start=1):
            req_id = req.get("id") or req.get("ID") or f"REQ-{idx:03d}"
            titre = req.get("titre") or req.get("Titre") or req.get("title") or "Exigence"
            description = req.get("description") or req.get("Description") or titre
            req_type = (req.get("type") or req.get("Type") or "fonctionnelle").lower()
            priorite = (req.get("priorite") or req.get("Priorité") or req.get("priority") or "medium").lower()
            
            # Générer les modes de défaillance via LLM
            failure_modes = await self._generate_failure_modes(
                req_id, titre, description, req_type, system_context, industry
            )
            
            for fm_idx, fm in enumerate(failure_modes, start=1):
                # Calculer le RPN
                severity = fm.get("severity", 5)
                occurrence = fm.get("occurrence", 5)
                detection = fm.get("detection", 5)
                rpn = severity * occurrence * detection
                
                # Déterminer le niveau de risque
                risk_level = self._get_risk_level(rpn)
                
                # Générer les actions recommandées
                actions = self._generate_actions(fm, rpn, risk_level)
                
                fmea_item = {
                    "id": f"FMEA-{idx:03d}-{fm_idx:02d}",
                    "requirement_id": req_id,
                    "requirement_title": titre,
                    "function": fm.get("function", f"Assurer {titre}"),
                    "failure_mode": fm.get("failure_mode", "Défaillance non spécifiée"),
                    "failure_effect": fm.get("effect", "Impact sur le système"),
                    "failure_cause": fm.get("cause", "Cause à déterminer"),
                    "severity": severity,
                    "severity_desc": self.SEVERITY_SCALE.get(severity, ""),
                    "occurrence": occurrence,
                    "occurrence_desc": self.OCCURRENCE_SCALE.get(occurrence, ""),
                    "detection": detection,
                    "detection_desc": self.DETECTION_SCALE.get(detection, ""),
                    "rpn": rpn,
                    "risk_level": risk_level,
                    "current_controls": fm.get("controls", "Aucun contrôle défini"),
                    "recommended_actions": actions,
                    "action_owner": "",
                    "target_date": "",
                    "status": "ouvert"
                }
                
                fmea_items.append(fmea_item)
        
        # Statistiques globales
        stats = self._calculate_statistics(fmea_items)
        
        return {
            "fmea_items": fmea_items,
            "statistics": stats,
            "scales": {
                "severity": self.SEVERITY_SCALE,
                "occurrence": self.OCCURRENCE_SCALE,
                "detection": self.DETECTION_SCALE
            },
            "thresholds": self.RPN_THRESHOLDS,
            "metadata": {
                "system_context": system_context,
                "industry": industry,
                "total_requirements": len(requirements),
                "total_failure_modes": len(fmea_items)
            }
        }
    
    async def _generate_failure_modes(
        self,
        req_id: str,
        titre: str,
        description: str,
        req_type: str,
        system_context: str,
        industry: str
    ) -> List[Dict[str, Any]]:
        """Génère les modes de défaillance pour une exigence via LLM"""
        
        # Adapter le nombre de modes selon le type d'exigence
        if req_type in ["security", "sécurité", "safety"]:
            num_modes = "2-3"
        elif req_type in ["performance"]:
            num_modes = "1-2"
        else:
            num_modes = "1-2"
        
        prompt = f"""Analyse FMEA pour cette exigence dans le contexte: {system_context}

EXIGENCE:
- ID: {req_id}
- Titre: {titre}
- Description: {description}
- Type: {req_type}

Génère {num_modes} modes de défaillance RÉALISTES et PERTINENTS.

Pour chaque mode, évalue:
- Gravité (severity): 1-10 selon l'impact
- Occurrence: 1-10 selon la probabilité
- Détection: 1-10 selon la difficulté à détecter (10 = impossible)

RÈGLES:
- Sois CONCRET et SPÉCIFIQUE au domaine {industry}
- Ne génère QUE des défaillances liées à l'exigence
- Les notes doivent être JUSTIFIÉES par le contexte

Format JSON strict:
[
  {{
    "function": "La fonction que l'exigence doit assurer",
    "failure_mode": "Description du mode de défaillance",
    "effect": "Effet sur le système/utilisateur",
    "cause": "Cause potentielle de la défaillance",
    "severity": 7,
    "occurrence": 4,
    "detection": 5,
    "controls": "Contrôles actuels ou à mettre en place"
  }}
]

JSON uniquement:"""

        raw = self.llm.generate(prompt)
        
        try:
            # Nettoyer la réponse
            raw = raw.strip()
            if raw.startswith("```json"):
                raw = raw[7:]
            if raw.startswith("```"):
                raw = raw[3:]
            if raw.endswith("```"):
                raw = raw[:-3]
            raw = raw.strip()
            
            # Trouver le JSON
            start_idx = raw.find('[')
            end_idx = raw.rfind(']') + 1
            if start_idx != -1 and end_idx > start_idx:
                raw = raw[start_idx:end_idx]
            
            failure_modes = json.loads(raw)
            
            if isinstance(failure_modes, list) and len(failure_modes) > 0:
                # Valider et normaliser les scores
                for fm in failure_modes:
                    fm["severity"] = max(1, min(10, int(fm.get("severity", 5))))
                    fm["occurrence"] = max(1, min(10, int(fm.get("occurrence", 5))))
                    fm["detection"] = max(1, min(10, int(fm.get("detection", 5))))
                return failure_modes
            else:
                raise ValueError("Empty response")
                
        except Exception as e:
            logger.warning(f"LLM FMEA generation failed for {req_id}: {e}, using fallback")
            return self._fallback_failure_modes(req_id, titre, description, req_type)
    
    def _fallback_failure_modes(
        self,
        req_id: str,
        titre: str,
        description: str,
        req_type: str
    ) -> List[Dict[str, Any]]:
        """Génère des modes de défaillance par défaut si le LLM échoue"""
        
        base_severity = 5
        base_occurrence = 4
        base_detection = 5
        
        # Ajuster selon le type
        if req_type in ["security", "sécurité", "safety"]:
            base_severity = 8
            base_detection = 6
        elif req_type == "performance":
            base_severity = 6
            base_occurrence = 5
        
        return [
            {
                "function": f"Assurer: {titre}",
                "failure_mode": f"Non-respect de l'exigence {req_id}",
                "effect": "Fonctionnalité non disponible ou dégradée",
                "cause": "Défaut de conception ou d'implémentation",
                "severity": base_severity,
                "occurrence": base_occurrence,
                "detection": base_detection,
                "controls": "Tests de validation, revue de conception"
            },
            {
                "function": f"Maintenir: {titre}",
                "failure_mode": f"Dégradation progressive de {titre[:30]}",
                "effect": "Performance réduite dans le temps",
                "cause": "Usure, conditions environnementales",
                "severity": base_severity - 1,
                "occurrence": base_occurrence + 1,
                "detection": base_detection + 1,
                "controls": "Maintenance préventive, monitoring"
            }
        ]
    
    def _get_risk_level(self, rpn: int) -> str:
        """Détermine le niveau de risque basé sur le RPN"""
        if rpn >= self.RPN_THRESHOLDS["critique"]:
            return "critique"
        elif rpn >= self.RPN_THRESHOLDS["majeur"]:
            return "majeur"
        elif rpn >= self.RPN_THRESHOLDS["modere"]:
            return "modéré"
        elif rpn >= self.RPN_THRESHOLDS["mineur"]:
            return "mineur"
        else:
            return "acceptable"
    
    def _generate_actions(
        self,
        failure_mode: Dict[str, Any],
        rpn: int,
        risk_level: str
    ) -> List[str]:
        """Génère des actions recommandées basées sur le RPN et le mode de défaillance"""
        
        actions = []
        
        severity = failure_mode.get("severity", 5)
        occurrence = failure_mode.get("occurrence", 5)
        detection = failure_mode.get("detection", 5)
        
        # Actions basées sur la gravité
        if severity >= 8:
            actions.append("Revoir la conception pour éliminer ou réduire la gravité")
            actions.append("Ajouter des systèmes de sécurité redondants")
        elif severity >= 5:
            actions.append("Évaluer les protections existantes")
        
        # Actions basées sur l'occurrence
        if occurrence >= 7:
            actions.append("Améliorer la robustesse du composant/système")
            actions.append("Renforcer les contrôles qualité en production")
        elif occurrence >= 4:
            actions.append("Analyser les causes racines pour réduction")
        
        # Actions basées sur la détection
        if detection >= 7:
            actions.append("Implémenter des tests de détection automatisés")
            actions.append("Ajouter des capteurs ou indicateurs de défaillance")
        elif detection >= 4:
            actions.append("Améliorer les procédures d'inspection")
        
        # Actions prioritaires selon le niveau de risque
        if risk_level == "critique":
            actions.insert(0, "⚠️ ACTION IMMÉDIATE REQUISE - Arrêt si nécessaire")
        elif risk_level == "majeur":
            actions.insert(0, "🔴 Action prioritaire dans les 30 jours")
        elif risk_level == "modéré":
            actions.insert(0, "🟠 Action planifiée dans les 90 jours")
        
        return actions if actions else ["Surveillance continue recommandée"]
    
    def _calculate_statistics(self, fmea_items: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calcule les statistiques globales de l'analyse FMEA"""
        
        if not fmea_items:
            return {
                "total_items": 0,
                "by_risk_level": {},
                "average_rpn": 0,
                "max_rpn": 0,
                "critical_items": []
            }
        
        rpn_values = [item["rpn"] for item in fmea_items]
        
        by_risk = {}
        for item in fmea_items:
            level = item["risk_level"]
            by_risk[level] = by_risk.get(level, 0) + 1
        
        critical_items = [
            {
                "id": item["id"],
                "requirement_id": item["requirement_id"],
                "failure_mode": item["failure_mode"],
                "rpn": item["rpn"]
            }
            for item in fmea_items
            if item["risk_level"] in ["critique", "majeur"]
        ]
        
        # Top 5 RPN les plus élevés
        top_rpn = sorted(fmea_items, key=lambda x: x["rpn"], reverse=True)[:5]
        
        return {
            "total_items": len(fmea_items),
            "by_risk_level": by_risk,
            "average_rpn": round(sum(rpn_values) / len(rpn_values), 1),
            "max_rpn": max(rpn_values),
            "min_rpn": min(rpn_values),
            "critical_items": critical_items,
            "top_5_rpn": [
                {"id": item["id"], "failure_mode": item["failure_mode"][:50], "rpn": item["rpn"]}
                for item in top_rpn
            ],
            "action_required_count": len([i for i in fmea_items if i["risk_level"] in ["critique", "majeur", "modéré"]])
        }
    
    async def update_fmea_item(
        self,
        fmea_id: str,
        updates: Dict[str, Any],
        fmea_items: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Met à jour un élément FMEA et recalcule le RPN"""
        
        for item in fmea_items:
            if item["id"] == fmea_id:
                # Mettre à jour les champs
                for key, value in updates.items():
                    if key in item:
                        item[key] = value
                
                # Recalculer le RPN si les scores ont changé
                if any(k in updates for k in ["severity", "occurrence", "detection"]):
                    item["rpn"] = item["severity"] * item["occurrence"] * item["detection"]
                    item["risk_level"] = self._get_risk_level(item["rpn"])
                    item["recommended_actions"] = self._generate_actions(
                        item, item["rpn"], item["risk_level"]
                    )
                
                return {"success": True, "updated_item": item}
        
        return {"success": False, "error": f"FMEA item {fmea_id} not found"}
    
    async def export_fmea_report(
        self,
        fmea_data: Dict[str, Any],
        format: str = "excel"
    ) -> Dict[str, Any]:
        """Prépare les données FMEA pour l'export"""
        
        items = fmea_data.get("fmea_items", [])
        stats = fmea_data.get("statistics", {})
        
        # Format tabulaire pour Excel/CSV
        export_rows = []
        for item in items:
            export_rows.append({
                "ID_FMEA": item["id"],
                "ID_Exigence": item["requirement_id"],
                "Exigence": item["requirement_title"],
                "Fonction": item["function"],
                "Mode_Defaillance": item["failure_mode"],
                "Effet": item["failure_effect"],
                "Cause": item["failure_cause"],
                "Gravité_S": item["severity"],
                "Occurrence_O": item["occurrence"],
                "Détection_D": item["detection"],
                "RPN": item["rpn"],
                "Niveau_Risque": item["risk_level"],
                "Contrôles_Actuels": item["current_controls"],
                "Actions_Recommandées": " | ".join(item["recommended_actions"]),
                "Responsable": item["action_owner"],
                "Date_Cible": item["target_date"],
                "Statut": item["status"]
            })
        
        return {
            "rows": export_rows,
            "statistics": stats,
            "format": format
        }


if __name__ == "__main__":
    import asyncio
    
    agent = FMEAAgent()
    print(f"Initialized {agent.name}")
    
    # Test avec des exigences exemple
    test_reqs = [
        {
            "id": "REQ-001",
            "titre": "Authentification sécurisée",
            "description": "Le système doit authentifier les utilisateurs",
            "type": "security"
        }
    ]
    
    async def test():
        result = await agent.generate_fmea(test_reqs, "application web", "general")
        print(f"Generated {len(result['fmea_items'])} FMEA items")
        for item in result['fmea_items']:
            print(f"  - {item['id']}: RPN={item['rpn']} ({item['risk_level']})")
    
    asyncio.run(test())
