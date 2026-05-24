"""
Parsing Agent - Extraction de texte, tables, chunking et index FAISS avec métadonnées par page.
"""

from typing import Dict, List, Any
import logging
import os
from pathlib import Path

import fitz  # PyMuPDF
import docx

from agents.core.rag_store import chunk_document, embed_chunks, save_index

logger = logging.getLogger(__name__)


class ParsingAgent:
    """Agent responsable de l'extraction du contenu des documents"""
    
    def __init__(self, base_dir: str = "data"):
        self.name = "ParsingAgent"
        self.base_dir = base_dir
    
    async def parse_pdf(self, file_path: str) -> Dict[str, Any]:
        """Parse un PDF, retourne texte complet, pages, tables (placeholder) et métadonnées."""
        try:
            logger.info(f"Parsing PDF: {file_path}")
            doc = fitz.open(file_path)
            pages: List[Dict[str, Any]] = []
            texts = []
            for i, page in enumerate(doc, start=1):
                page_text = page.get_text("text") or ""
                pages.append({"page_number": i, "text": page_text})
                texts.append(page_text)
            text = "\n".join(texts)
            metadata = {
                "total_pages": len(doc),
                "language": "fr",
                "extraction_quality": 0.95,
                "file_type": "pdf",
            }
            return {"text": text, "pages": pages, "tables": [], "metadata": metadata}
        except Exception as e:
            logger.error(f"Error parsing PDF: {e}")
            raise
    
    async def parse_docx(self, file_path: str) -> Dict[str, Any]:
        """Parse un DOCX, retourne texte, pages estimées et métadonnées."""
        try:
            logger.info(f"Parsing DOCX: {file_path}")
            doc = docx.Document(file_path)
            paragraphs = [p.text for p in doc.paragraphs]
            text = "\n".join(paragraphs)
            # Approximation: 40 paragraphes ~ 1 page pour les métadonnées
            pages: List[Dict[str, Any]] = []
            for i in range(0, len(paragraphs), 40):
                page_number = (i // 40) + 1
                slice_text = "\n".join(paragraphs[i : i + 40])
                pages.append({"page_number": page_number, "text": slice_text})
            metadata = {
                "total_pages": max(len(paragraphs) // 40, 1),
                "language": "fr",
                "extraction_quality": 0.9,
                "file_type": "docx",
            }
            return {"text": text, "pages": pages or [{"page_number": 1, "text": text}], "tables": [], "metadata": metadata}
        except Exception as e:
            logger.error(f"Error parsing DOCX: {e}")
            raise
    
    async def extract_tables(self, file_path: str) -> List[Dict[str, Any]]:
        """Placeholder d'extraction de tableaux (Camelot/pandas à brancher)."""
        logger.info("Extracting tables (placeholder)")
        return []
    
    async def ingest_and_index(self, document_id: str, file_path: str) -> Dict[str, Any]:
        """Pipeline : parse, chunk avec métadonnées, embed, sauvegarde index FAISS."""
        suffix = Path(file_path).suffix.lower()
        if suffix == ".pdf":
            parsed = await self.parse_pdf(file_path)
        elif suffix in {".docx", ".doc"}:
            parsed = await self.parse_docx(file_path)
        else:
            raise ValueError(f"Unsupported file type: {suffix}")

        chunks, chunk_meta = chunk_document(parsed.get("pages", []), chunk_size=512, overlap=64)
        embeddings = embed_chunks(chunks)
        index_path = save_index(document_id, chunks, chunk_meta, embeddings, base_dir=self.base_dir)

        os.makedirs(Path(self.base_dir) / "processed", exist_ok=True)
        processed_path = Path(self.base_dir) / "processed" / f"{document_id}.txt"
        processed_path.write_text(parsed["text"], encoding="utf-8")

        return {
            "document_id": document_id,
            "index_path": index_path,
            "chunks": len(chunks),
            "metadata": parsed["metadata"],
        }


if __name__ == "__main__":
    import asyncio
    
    agent = ParsingAgent()
    print(f"Initialized {agent.name}")
