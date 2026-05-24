"""
RAG store helpers: chunking, embeddings, FAISS index persistence with per-chunk metadata.
"""
from __future__ import annotations

import json
import os
import logging
from pathlib import Path
from typing import Any, Dict, List, Tuple

import faiss  # type: ignore
import numpy as np
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

# Lazy-loaded global model to avoid repeated downloads
_EMBED_MODEL: SentenceTransformer | None = None


def get_embed_model(model_name: str = "sentence-transformers/all-MiniLM-L6-v2") -> SentenceTransformer:
    global _EMBED_MODEL
    if _EMBED_MODEL is None:
        _EMBED_MODEL = SentenceTransformer(model_name)
    return _EMBED_MODEL


def chunk_page_text(
    text: str,
    page_number: int,
    chunk_size: int = 512,
    overlap: int = 64,
    section: str | None = None,
) -> Tuple[List[str], List[Dict[str, Any]]]:
    """Chunk a single page and keep minimal metadata for citations.

    Offsets are based on a whitespace-joined version of the page, sufficient to
    anchor citations in the original text without requiring full layout.
    """
    words = text.split()
    chunks: List[str] = []
    meta: List[Dict[str, Any]] = []
    i = 0
    while i < len(words):
        chunk_words = words[i : i + chunk_size]
        chunk = " ".join(chunk_words)
        start_char = len(" ".join(words[:i])) if i > 0 else 0
        end_char = start_char + len(chunk)
        chunks.append(chunk)
        meta.append(
            {
                "page": page_number,
                "section": section or "",
                "start_char": start_char,
                "end_char": end_char,
            }
        )
        i += max(chunk_size - overlap, 1)
    return chunks, meta


def chunk_document(pages: List[Dict[str, Any]], chunk_size: int = 512, overlap: int = 64) -> Tuple[List[str], List[Dict[str, Any]]]:
    """Chunk an entire document represented as a list of page dicts."""
    all_chunks: List[str] = []
    all_meta: List[Dict[str, Any]] = []
    for page in pages:
        page_text = page.get("text", "")
        page_number = int(page.get("page_number", 1))
        section = page.get("section")
        chunks, meta = chunk_page_text(page_text, page_number, chunk_size, overlap, section)
        all_chunks.extend(chunks)
        all_meta.extend(meta)
    return all_chunks, all_meta


def embed_chunks(chunks: List[str], model_name: str = "sentence-transformers/all-MiniLM-L6-v2") -> np.ndarray:
    model = get_embed_model(model_name)
    embeddings = model.encode(chunks, normalize_embeddings=True)
    return np.array(embeddings, dtype="float32")


def save_index(
    document_id: str,
    chunks: List[str],
    chunk_meta: List[Dict[str, Any]],
    embeddings: np.ndarray,
    base_dir: str = "data",
) -> str:
    os.makedirs(Path(base_dir) / "embeddings", exist_ok=True)
    os.makedirs(Path(base_dir) / "metadata", exist_ok=True)
    index = faiss.IndexFlatIP(embeddings.shape[1])
    index.add(embeddings)
    index_path = Path(base_dir) / "embeddings" / f"{document_id}.faiss"
    faiss.write_index(index, str(index_path))
    meta = {"chunks": chunks, "metadata": chunk_meta}
    meta_path = Path(base_dir) / "metadata" / f"{document_id}.json"
    meta_path.write_text(json.dumps(meta, ensure_ascii=False), encoding="utf-8")
    return str(index_path)


def load_index(document_id: str, base_dir: str = "data") -> Tuple[faiss.IndexFlatIP, List[str], List[Dict[str, Any]]]:
    index_path = Path(base_dir) / "embeddings" / f"{document_id}.faiss"
    meta_path = Path(base_dir) / "metadata" / f"{document_id}.json"
    if not index_path.exists() or not meta_path.exists():
        raise FileNotFoundError(f"Index or metadata missing for {document_id}")
    index = faiss.read_index(str(index_path))
    meta = json.loads(meta_path.read_text(encoding="utf-8"))
    return index, meta.get("chunks", []), meta.get("metadata", [])


def search(
    document_id: str,
    query: str,
    top_k: int = 5,
    base_dir: str = "data",
) -> List[Tuple[str, float, Dict[str, Any]]]:
    index, chunks, chunk_meta = load_index(document_id, base_dir=base_dir)
    model = get_embed_model()
    query_vec = model.encode([query], normalize_embeddings=True).astype("float32")
    scores, idx = index.search(query_vec, top_k)
    results: List[Tuple[str, float, Dict[str, Any]]] = []
    for i, score in zip(idx[0], scores[0]):
        if i == -1 or i >= len(chunks):
            continue
        meta = chunk_meta[i] if i < len(chunk_meta) else {}
        results.append((chunks[i], float(score), meta))
    return results
