"""
Test Generator Agent - Génération automatique de cas de test et traçabilité.
Adapté pour les contextes industriels (batteries, production, qualification, etc.)
"""

from typing import Dict, List, Any
import logging
import json

from agents.core.llm_router import LLMRouter, render_json_prompt

logger = logging.getLogger(__name__)


class TestGeneratorAgent:
    """Agent responsable de la génération de cas de test industriels"""
    
    def __init__(self, llm: LLMRouter | None = None):
        self.name = "TestGeneratorAgent"
        self.llm = llm or LLMRouter()
    
    async def generate_test_cases(
        self,
        requirements: List[Dict[str, Any]],
        test_types: List[str] = None,
        industry_context: str = "industriel"
    ) -> List[Dict[str, Any]]:
        if test_types is None:
            test_types = ["nominal", "limite", "dégradé"]
        
        logger.info(f"Generating test cases for {len(requirements)} requirements")
        cases: List[Dict[str, Any]] = []
        
        for idx, req in enumerate(requirements, start=1):
            req_id = req.get("id") or f"REQ-{idx:03d}"
            req_titre = req.get("titre") or req.get("title") or req.get("name") or "Exigence"
            req_desc = req.get("description") or req_titre
            req_type = req.get("type") or "fonctionnelle"
            
            # Prompt optimisé - nombre de tests adapté à la complexité
            instruction = f"""Analyse cette exigence et génère le nombre approprié de cas de test:

EXIGENCE:
- ID: {req_id}
- Titre: {req_titre}
- Description: {req_desc}
- Type: {req_type}

RÈGLES STRICTES:
- Exigence SIMPLE (action unique, vérification directe): génère 1 test
- Exigence MOYENNE (plusieurs aspects à vérifier): génère 2 tests
- Exigence COMPLEXE (sécurité, performance, multi-scénarios): génère 3 tests

IMPORTANT: Ne génère QUE des tests directement liés à l'exigence ci-dessus. Pas d'invention.

Format JSON strict:
[
  {{
    "id": "TEST-{idx:03d}-01",
    "nom": "Nom court et précis",
    "objectif": "Ce que le test vérifie (basé sur l'exigence)",
    "type_test": "fonctionnel|performance|sécurité|robustesse",
    "procedure": "1) Étape 1\\n2) Étape 2\\n3) Vérifier résultat"
  }}
]

JSON uniquement:"""
            
            raw = self.llm.generate(instruction)
            
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
                
                # Trouver le JSON dans la réponse
                start_idx = raw.find('[')
                end_idx = raw.rfind(']') + 1
                if start_idx != -1 and end_idx > start_idx:
                    raw = raw[start_idx:end_idx]
                
                generated = json.loads(raw)
                if isinstance(generated, list) and len(generated) > 0:
                    for c_idx, case in enumerate(generated, start=1):
                        cases.append(
                            {
                                "id": case.get("id") or f"TEST-{idx:03d}-{c_idx:02d}",
                                "id_exigence": req_id,
                                "nom": case.get("nom") or case.get("name") or f"Test {req_titre[:40]}",
                                "objectif": case.get("objectif") or case.get("objective") or f"Valider {req_titre}",
                                "type_test": case.get("type_test") or "fonctionnel",
                                "preconditions": case.get("preconditions") or "Système initialisé",
                                "procedure": case.get("procedure") or "1) Exécuter le scénario\n2) Vérifier le résultat",
                                "attendu": case.get("attendu") or "Comportement conforme",
                                "critere_reussite": case.get("critere_reussite") or "Test validé",
                                "duree_estimee": case.get("duree_estimee") or "15 min",
                            }
                        )
                    logger.info(f"Generated {len(generated)} tests for {req_id} via LLM")
                else:
                    raise ValueError("Empty or invalid response")
            except Exception as e:
                logger.warning(f"LLM test generation failed for {req_id}: {e}, using smart fallback")
                # Fallback intelligent basé sur le contenu de l'exigence
                cases.extend(self._smart_fallback_tests(req, idx))
        
        return cases
    
    def _smart_fallback_tests(self, req: Dict[str, Any], idx: int) -> List[Dict[str, Any]]:
        """Génère des tests intelligents basés sur le contenu de l'exigence"""
        req_id = req.get("id") or f"REQ-{idx:03d}"
        titre = req.get("titre") or req.get("title") or req.get("name") or "Exigence"
        desc = req.get("description") or titre
        req_type = (req.get("type") or "fonctionnelle").lower()
        
        tests = []
        
        # Détecter les mots-clés pour adapter les tests
        desc_lower = desc.lower()
        titre_lower = titre.lower()
        combined = f"{titre_lower} {desc_lower}"
        
        # Test 1: Test fonctionnel principal
        test1 = {
            "id": f"TEST-{idx:03d}-01",
            "id_exigence": req_id,
            "nom": f"Validation fonctionnelle - {titre[:40]}",
            "objectif": f"Vérifier que {titre}",
            "type_test": "fonctionnel",
            "preconditions": "Système opérationnel, utilisateur connecté",
            "procedure": f"1) Accéder à la fonctionnalité concernée\n2) Exécuter l'action: {titre}\n3) Vérifier le comportement attendu\n4) Documenter le résultat",
            "attendu": "Fonctionnement conforme à l'exigence",
            "critere_reussite": "Comportement validé sans erreur",
            "duree_estimee": "15 min",
        }
        
        # Adapter selon le type d'exigence
        if "authentifi" in combined or "login" in combined or "connexion" in combined:
            test1["nom"] = f"Test d'authentification - {titre[:30]}"
            test1["procedure"] = "1) Ouvrir la page de connexion\n2) Saisir les identifiants valides\n3) Cliquer sur Connexion\n4) Vérifier l'accès au système"
            test1["attendu"] = "Authentification réussie, accès accordé"
            
        elif "mobile" in combined or "responsive" in combined or "desktop" in combined:
            test1["nom"] = f"Test de compatibilité - {titre[:30]}"
            test1["procedure"] = "1) Ouvrir l'application sur navigateur desktop\n2) Vérifier l'affichage correct\n3) Ouvrir sur navigateur mobile\n4) Vérifier l'adaptation responsive"
            test1["attendu"] = "Interface adaptée à tous les écrans"
            
        elif "chiffr" in combined or "encrypt" in combined or "sécur" in combined:
            test1["nom"] = f"Test de sécurité - {titre[:30]}"
            test1["type_test"] = "sécurité"
            test1["procedure"] = "1) Capturer le trafic réseau\n2) Vérifier le protocole HTTPS\n3) Contrôler le chiffrement des données stockées\n4) Valider l'absence de données en clair"
            test1["attendu"] = "Données chiffrées en transit et au repos"
            
        elif "perform" in combined or "rapide" in combined or "temps" in combined or "seconde" in combined:
            test1["nom"] = f"Test de performance - {titre[:30]}"
            test1["type_test"] = "performance"
            test1["procedure"] = "1) Préparer le scénario de test\n2) Démarrer le chronomètre\n3) Exécuter l'action utilisateur\n4) Mesurer le temps de réponse"
            test1["attendu"] = "Temps de réponse < 2 secondes"
            
        elif "accessib" in combined or "wcag" in combined:
            test1["nom"] = f"Test d'accessibilité - {titre[:30]}"
            test1["type_test"] = "conformité"
            test1["procedure"] = "1) Lancer un audit WCAG (axe, WAVE)\n2) Tester la navigation au clavier\n3) Vérifier le contraste des couleurs\n4) Tester avec un lecteur d'écran"
            test1["attendu"] = "Conformité WCAG 2.1 niveau AA"
        
        tests.append(test1)
        
        # Test 2: Test négatif / aux limites
        test2 = {
            "id": f"TEST-{idx:03d}-02",
            "id_exigence": req_id,
            "nom": f"Test négatif - {titre[:40]}",
            "objectif": f"Vérifier le comportement en cas d'erreur pour {titre}",
            "type_test": "robustesse",
            "preconditions": "Système opérationnel",
            "procedure": "1) Préparer des données invalides\n2) Tenter l'action avec ces données\n3) Vérifier le message d'erreur\n4) Confirmer que le système reste stable",
            "attendu": "Gestion correcte des erreurs, pas de crash",
            "critere_reussite": "Erreur gérée proprement",
            "duree_estimee": "10 min",
        }
        
        if "authentifi" in combined or "login" in combined:
            test2["procedure"] = "1) Saisir un mot de passe incorrect\n2) Vérifier le message d'erreur\n3) Tenter plusieurs fois\n4) Vérifier le verrouillage du compte"
        elif "perform" in combined or "temps" in combined:
            test2["nom"] = f"Test de charge - {titre[:40]}"
            test2["procedure"] = "1) Simuler 100 utilisateurs simultanés\n2) Mesurer les temps de réponse\n3) Vérifier la stabilité du système"
            
        tests.append(test2)
        
        # Test 3: Test de régression (optionnel pour certains types)
        if "sécur" in combined or "chiffr" in combined or "accessib" in combined:
            test3 = {
                "id": f"TEST-{idx:03d}-03",
                "id_exigence": req_id,
                "nom": f"Test de conformité - {titre[:35]}",
                "objectif": f"Vérifier la conformité aux normes pour {titre}",
                "type_test": "conformité",
                "preconditions": "Environnement de test configuré",
                "procedure": "1) Exécuter les outils d'audit\n2) Analyser le rapport généré\n3) Vérifier la conformité aux standards\n4) Documenter les écarts",
                "attendu": "Conformité totale aux normes applicables",
                "critere_reussite": "Aucun écart critique détecté",
                "duree_estimee": "30 min",
            }
            tests.append(test3)
        
        return tests
    
    def _fallback_tests(self, req: Dict[str, Any], idx: int) -> List[Dict[str, Any]]:
        """Génère des tests de base si le LLM échoue"""
        req_type = req.get("type", "fonctionnelle").lower()
        titre = req.get("titre", "")
        
        tests = [
            {
                "id": f"TEST-{idx:03d}-01",
                "id_exigence": req.get("id"),
                "nom": f"Test nominal - {titre[:50]}",
                "objectif": f"Vérifier que {titre} fonctionne en conditions nominales",
                "type_test": "fonctionnel",
                "preconditions": "Système initialisé, conditions ambiantes normales (20-25°C)",
                "procedure": "1) Préparer le système selon les spécifications\n2) Exécuter le scénario nominal\n3) Mesurer les résultats\n4) Comparer aux critères d'acceptation",
                "equipements": ["Multimètre", "Thermomètre", "Chronomètre"],
                "entrees": [],
                "seuils": {},
                "attendu": "Comportement conforme à l'exigence",
                "critere_reussite": "Toutes les mesures dans les tolérances spécifiées",
                "duree_estimee": "30 min",
            },
            {
                "id": f"TEST-{idx:03d}-02",
                "id_exigence": req.get("id"),
                "nom": f"Test aux limites - {titre[:50]}",
                "objectif": f"Vérifier le comportement aux limites de {titre}",
                "type_test": "performance",
                "preconditions": "Système en état nominal",
                "procedure": "1) Amener le système aux conditions limites\n2) Maintenir pendant la durée spécifiée\n3) Mesurer les paramètres critiques\n4) Vérifier l'absence de dégradation",
                "equipements": ["Équipements de mesure adaptés", "Système de contrôle environnemental"],
                "entrees": [],
                "seuils": {},
                "attendu": "Fonctionnement correct aux limites spécifiées",
                "critere_reussite": "Pas de défaillance, performance maintenue",
                "duree_estimee": "1h",
            }
        ]
        
        # Ajouter un test de sécurité si pertinent
        if req_type in ["sécurité", "securite", "security"]:
            tests.append({
                "id": f"TEST-{idx:03d}-03",
                "id_exigence": req.get("id"),
                "nom": f"Test de sécurité - {titre[:50]}",
                "objectif": "Vérifier les mécanismes de sécurité",
                "type_test": "sécurité",
                "preconditions": "Environnement de test sécurisé",
                "procedure": "1) Simuler une condition de défaillance\n2) Vérifier l'activation des protections\n3) Confirmer l'arrêt sécurisé",
                "equipements": ["Équipements de protection", "Système de surveillance"],
                "entrees": [],
                "seuils": {},
                "attendu": "Activation des mécanismes de sécurité",
                "critere_reussite": "Protection efficace, pas de danger",
                "duree_estimee": "45 min",
            })
        
        return tests
    
    async def create_traceability_matrix(
        self,
        requirements: List[Dict[str, Any]],
        test_cases: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        logger.info("Creating traceability matrix")
        links = []
        for req in requirements:
            linked = [t["id"] for t in test_cases if t.get("id_exigence") == req.get("id")]
            links.append({"id_exigence": req.get("id"), "ids_tests": linked})
        total = len(requirements)
        covered = sum(1 for l in links if l["ids_tests"])
        coverage = covered / total if total else 0.0
        return {"links": links, "total_coverage": coverage}
    
    async def verify_test_coverage(
        self,
        requirements: List[Dict[str, Any]],
        test_cases: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        logger.info("Verifying test coverage")
        trace = await self.create_traceability_matrix(requirements, test_cases)
        warnings = [l for l in trace["links"] if not l["ids_tests"]]
        return {
            "minimum_coverage": 0.90,
            "actual_coverage": trace["total_coverage"],
            "warnings": warnings,
        }


if __name__ == "__main__":
    import asyncio
    
    agent = TestGeneratorAgent()
    print(f"Initialized {agent.name}")
