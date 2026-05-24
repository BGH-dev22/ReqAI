"""
Export Agent - Export des données en différents formats
"""

from typing import Dict, List, Any
import logging
from enum import Enum
import json
from pathlib import Path

import pandas as pd


class ExportFormat(str, Enum):
    EXCEL = "excel"
    JSON = "json"
    PDF = "pdf"
    CSV = "csv"


logger = logging.getLogger(__name__)


class ExportAgent:
    """Agent responsable de l'export des données"""
    
    def __init__(self):
        self.name = "ExportAgent"
    
    async def export_to_excel(self, data: Dict[str, Any], output_path: str) -> Dict[str, Any]:
        """Export Excel avec onglets Exigences, Tests, Exigences+Tests et Trace."""
        try:
            logger.info(f"Exporting to Excel: {output_path}")
            
            requirements = data.get("requirements", [])
            tests = data.get("test_cases", [])
            trace = data.get("traceability", {}).get("links", [])
            
            with pd.ExcelWriter(output_path) as writer:
                # Onglet 1: Exigences seules
                if requirements:
                    pd.DataFrame(requirements).to_excel(writer, sheet_name="Exigences", index=False)
                
                # Onglet 2: Tests seuls
                if tests:
                    pd.DataFrame(tests).to_excel(writer, sheet_name="Tests", index=False)
                
                # Onglet 3: Exigences avec leurs tests (vue combinée)
                combined_rows = []
                for req in requirements:
                    req_id = req.get("id") or req.get("ID")
                    req_tests = [t for t in tests if t.get("id_exigence") == req_id]
                    
                    if req_tests:
                        for test in req_tests:
                            combined_rows.append({
                                "ID_Exigence": req_id,
                                "Titre_Exigence": req.get("titre") or req.get("Titre") or req.get("title"),
                                "Type_Exigence": req.get("type") or req.get("Type"),
                                "Priorité": req.get("priorite") or req.get("Priorité") or req.get("priority"),
                                "ID_Test": test.get("id"),
                                "Nom_Test": test.get("nom"),
                                "Objectif_Test": test.get("objectif"),
                                "Type_Test": test.get("type_test"),
                                "Procédure": test.get("procedure"),
                                "Résultat_Attendu": test.get("attendu"),
                            })
                    else:
                        # Exigence sans test
                        combined_rows.append({
                            "ID_Exigence": req_id,
                            "Titre_Exigence": req.get("titre") or req.get("Titre") or req.get("title"),
                            "Type_Exigence": req.get("type") or req.get("Type"),
                            "Priorité": req.get("priorite") or req.get("Priorité") or req.get("priority"),
                            "ID_Test": "AUCUN",
                            "Nom_Test": "Test non généré",
                            "Objectif_Test": "",
                            "Type_Test": "",
                            "Procédure": "",
                            "Résultat_Attendu": "",
                        })
                
                if combined_rows:
                    pd.DataFrame(combined_rows).to_excel(writer, sheet_name="Exigences_Tests", index=False)
                
                # Onglet 4: Matrice de traçabilité
                if trace:
                    pd.DataFrame(trace).to_excel(writer, sheet_name="Tracabilite", index=False)
            
            size = Path(output_path).stat().st_size if Path(output_path).exists() else 0
            return {"format": "excel", "file_size": size, "download_url": output_path}
        except Exception as e:
            logger.error(f"Error exporting to Excel: {e}")
            raise
    
    async def export_to_json(self, data: Dict[str, Any], output_path: str) -> Dict[str, Any]:
        """Export JSON structuré avec exigences et leurs tests."""
        try:
            logger.info(f"Exporting to JSON: {output_path}")
            
            requirements = data.get("requirements", [])
            tests = data.get("test_cases", [])
            trace = data.get("traceability", {})
            
            # Structure enrichie: chaque exigence contient ses tests
            enriched_requirements = []
            for req in requirements:
                req_id = req.get("id") or req.get("ID")
                req_tests = [t for t in tests if t.get("id_exigence") == req_id]
                
                enriched_req = {
                    **req,
                    "tests_generes": req_tests,
                    "nombre_tests": len(req_tests)
                }
                enriched_requirements.append(enriched_req)
            
            # Structure finale
            export_data = {
                "metadata": {
                    "total_exigences": len(requirements),
                    "total_tests": len(tests),
                    "couverture": f"{(len([r for r in enriched_requirements if r['nombre_tests'] > 0]) / len(requirements) * 100):.1f}%" if requirements else "0%"
                },
                "exigences_avec_tests": enriched_requirements,
                "tous_les_tests": tests,
                "tracabilite": trace
            }
            
            Path(output_path).write_text(json.dumps(export_data, ensure_ascii=False, indent=2), encoding="utf-8")
            size = Path(output_path).stat().st_size
            return {"format": "json", "file_size": size, "download_url": output_path}
        except Exception as e:
            logger.error(f"Error exporting to JSON: {e}")
            raise
    
    async def export_to_pdf(self, data: Dict[str, Any], output_path: str) -> Dict[str, Any]:
        """
        Exporte les données en format PDF
        """
        try:
            logger.info(f"Exporting to PDF: {output_path}")
            
            # Implémentation d'export PDF - placeholder
            Path(output_path).write_text("PDF export non implémenté", encoding="utf-8")
            size = Path(output_path).stat().st_size
            return {"format": "pdf", "file_size": size, "download_url": output_path}
        except Exception as e:
            logger.error(f"Error exporting to PDF: {e}")
            raise
    
    async def export_to_csv(self, data: Dict[str, Any], output_path: str) -> Dict[str, Any]:
        """
        Exporte les données en format CSV avec exigences et tests combinés
        """
        try:
            logger.info(f"Exporting to CSV: {output_path}")
            
            requirements = data.get("requirements", [])
            tests = data.get("test_cases", [])
            
            # Format CSV: chaque ligne = 1 test avec son exigence parente
            combined_rows = []
            for req in requirements:
                req_id = req.get("id") or req.get("ID")
                req_tests = [t for t in tests if t.get("id_exigence") == req_id]
                
                if req_tests:
                    for test in req_tests:
                        combined_rows.append({
                            "ID_Exigence": req_id,
                            "Titre_Exigence": req.get("titre") or req.get("Titre") or req.get("title"),
                            "Description_Exigence": req.get("description") or req.get("Description"),
                            "Type_Exigence": req.get("type") or req.get("Type"),
                            "Priorite": req.get("priorite") or req.get("Priorité") or req.get("priority"),
                            "ID_Test": test.get("id"),
                            "Nom_Test": test.get("nom"),
                            "Objectif_Test": test.get("objectif"),
                            "Type_Test": test.get("type_test"),
                            "Preconditions": test.get("preconditions"),
                            "Procedure": test.get("procedure"),
                            "Resultat_Attendu": test.get("attendu"),
                            "Critere_Reussite": test.get("critere_reussite"),
                            "Duree_Estimee": test.get("duree_estimee"),
                        })
                else:
                    # Exigence sans test généré
                    combined_rows.append({
                        "ID_Exigence": req_id,
                        "Titre_Exigence": req.get("titre") or req.get("Titre") or req.get("title"),
                        "Description_Exigence": req.get("description") or req.get("Description"),
                        "Type_Exigence": req.get("type") or req.get("Type"),
                        "Priorite": req.get("priorite") or req.get("Priorité") or req.get("priority"),
                        "ID_Test": "",
                        "Nom_Test": "Aucun test généré",
                        "Objectif_Test": "",
                        "Type_Test": "",
                        "Preconditions": "",
                        "Procedure": "",
                        "Resultat_Attendu": "",
                        "Critere_Reussite": "",
                        "Duree_Estimee": "",
                    })
            
            # Si pas d'exigences, exporter uniquement les tests
            if not combined_rows and tests:
                combined_rows = tests
            
            pd.DataFrame(combined_rows).to_csv(output_path, index=False, encoding="utf-8-sig")
            size = Path(output_path).stat().st_size if Path(output_path).exists() else 0
            return {"format": "csv", "file_size": size, "download_url": output_path}
        except Exception as e:
            logger.error(f"Error exporting to CSV: {e}")
            raise
    
    async def export(
        self,
        data: Dict[str, Any],
        format: ExportFormat,
        output_path: str
    ) -> Dict[str, Any]:
        """
        Pipeline complet d'export
        """
        logger.info(f"Exporting data in format: {format}")
        
        if format == ExportFormat.EXCEL:
            return await self.export_to_excel(data, output_path)
        elif format == ExportFormat.JSON:
            return await self.export_to_json(data, output_path)
        elif format == ExportFormat.PDF:
            return await self.export_to_pdf(data, output_path)
        elif format == ExportFormat.CSV:
            return await self.export_to_csv(data, output_path)
        else:
            raise ValueError(f"Unknown export format: {format}")


if __name__ == "__main__":
    import asyncio
    
    agent = ExportAgent()
    print(f"Initialized {agent.name}")
