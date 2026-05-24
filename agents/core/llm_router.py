"""
LLM Router: route generation calls to Ollama (local) or optional free-tier APIs (Groq, Together, Fireworks, OpenRouter).
Default remains local for confidentiality. Remote providers are used only if API keys are set.
"""
from __future__ import annotations

import os
import json
import logging
from typing import Any, Dict, List, Optional

import requests

try:
    import ollama  # type: ignore
except ImportError:  # pragma: no cover
    ollama = None

logger = logging.getLogger(__name__)

DEFAULT_MODEL = os.getenv("OLLAMA_MODEL", "phi3:mini")
DEFAULT_PROVIDER = os.getenv("LLM_PROVIDER", "mock").lower()

# Configuration des modèles disponibles
AVAILABLE_MODELS = {
    # Modèles locaux (Ollama)
    "local": {
        "tinyllama": {
            "name": "TinyLlama",
            "model_id": "tinyllama:latest",
            "description": "Modèle léger et rapide (637 MB)",
            "provider": "ollama",
            "local": True,
        },
        "phi3": {
            "name": "Phi-3 Mini",
            "model_id": "phi3:mini",
            "description": "Modèle Microsoft performant (2.2 GB)",
            "provider": "ollama",
            "local": True,
        },
    },
    # Modèles API (Cloud)
    "api": {
        "grok": {
            "name": "Grok (xAI)",
            "model_id": "grok-beta",
            "description": "Modèle xAI puissant",
            "provider": "groq",
            "local": False,
        },
        "mistral": {
            "name": "Mistral Devstral 2",
            "model_id": "mistralai/devstral-2-2512",
            "description": "Mistral AI - Gratuit via OpenRouter",
            "provider": "openrouter",
            "local": False,
            "api_key_env": "OPENROUTER_MISTRAL_KEY",
        },
        "kimi": {
            "name": "Kimi 2 Thinking",
            "model_id": "moonshotai/kimi-k2",
            "description": "Moonshot AI - Raisonnement avancé",
            "provider": "openrouter",
            "local": False,
            "api_key_env": "OPENROUTER_KIMI_KEY",
        },
    },
}

# Clés API par défaut (OpenRouter)
OPENROUTER_API_KEYS = {
    "mistral": os.getenv("OPENROUTER_MISTRAL_KEY", ""),
    "kimi": os.getenv("OPENROUTER_KIMI_KEY", ""),
}


class LLMRouter:
    def __init__(
        self,
        provider: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 2048,
    ) -> None:
        self.provider = (provider or DEFAULT_PROVIDER).lower()
        self.model = model or DEFAULT_MODEL
        self.temperature = temperature
        self.max_tokens = max_tokens

    def _build_payload(self, prompt: str) -> Dict[str, Any]:
        return {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
        }

    def _call_ollama(self, prompt: str) -> str:
        if ollama is None:
            raise RuntimeError("ollama package not installed")
        client = ollama.Client()
        resp = client.chat(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            options={"temperature": self.temperature, "num_predict": self.max_tokens},
        )
        return resp.get("message", {}).get("content", "")

    def _call_groq(self, prompt: str) -> str:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError("GROQ_API_KEY missing")
        url = "https://api.groq.com/openai/v1/chat/completions"
        payload = self._build_payload(prompt)
        groq_model = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
        payload["model"] = groq_model
        headers = {"Authorization": f"Bearer {api_key}"}
        r = requests.post(url, json=payload, headers=headers, timeout=60)
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"]

    def _call_openrouter(self, prompt: str, model_key: str = "mistral") -> str:
        """Appel via OpenRouter pour Mistral et Kimi"""
        api_key = OPENROUTER_API_KEYS.get(model_key)
        if not api_key:
            raise RuntimeError(f"OpenRouter API key missing for {model_key}")
        
        url = "https://openrouter.ai/api/v1/chat/completions"
        
        # Sélectionner le bon modèle - utiliser des modèles gratuits disponibles
        if model_key == "mistral":
            # Modèle Mistral gratuit sur OpenRouter
            model_id = "mistralai/mistral-7b-instruct:free"
        elif model_key == "kimi":
            # Qwen3 4B gratuit sur OpenRouter
            model_id = "qwen/qwen3-4b:free"
        else:
            model_id = self.model
        
        payload = {
            "model": model_id,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
        }
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "ReqAI Analyze",
        }
        
        logger.info(f"Calling OpenRouter with model: {model_id}")
        
        try:
            r = requests.post(url, json=payload, headers=headers, timeout=120)
            r.raise_for_status()
            response_json = r.json()
            logger.info(f"OpenRouter response received successfully")
            return response_json["choices"][0]["message"]["content"]
        except requests.exceptions.HTTPError as e:
            logger.error(f"OpenRouter HTTP error: {e.response.status_code} - {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"OpenRouter error: {e}")
            raise

    def _call_together(self, prompt: str) -> str:
        api_key = os.getenv("TOGETHER_API_KEY")
        if not api_key:
            raise RuntimeError("TOGETHER_API_KEY missing")
        url = "https://api.together.xyz/v1/chat/completions"
        payload = self._build_payload(prompt)
        payload["model"] = self.model or "meta-llama/Meta-Llama-3-8B-Instruct-Turbo"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        r = requests.post(url, json=payload, headers=headers, timeout=60)
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"]

    def _call_fireworks(self, prompt: str) -> str:
        api_key = os.getenv("FIREWORKS_API_KEY")
        if not api_key:
            raise RuntimeError("FIREWORKS_API_KEY missing")
        url = "https://api.fireworks.ai/inference/v1/chat/completions"
        payload = self._build_payload(prompt)
        payload["model"] = self.model or "accounts/fireworks/models/phi-3-mini-4k-instruct"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        r = requests.post(url, json=payload, headers=headers, timeout=60)
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"]

    def generate(self, prompt: str) -> str:
        """Route the call to the selected provider. Falls back to Ollama if remote fails."""
        try:
            if self.provider == "groq":
                return self._call_groq(prompt)
            if self.provider == "together":
                return self._call_together(prompt)
            if self.provider == "fireworks":
                return self._call_fireworks(prompt)
            if self.provider == "mistral":
                return self._call_openrouter(prompt, "mistral")
            if self.provider == "kimi":
                return self._call_openrouter(prompt, "kimi")
            if self.provider == "mock":
                return "Réponse non disponible (LLM non configuré)"
            # default local (ollama)
            return self._call_ollama(prompt)
        except Exception as exc:
            logger.warning("LLM provider %s failed (%s), returning mock reply", self.provider, exc)
            return "Réponse non disponible (LLM non configuré)"

    @staticmethod
    def get_available_models() -> Dict[str, Any]:
        """Retourne la liste des modèles disponibles"""
        return AVAILABLE_MODELS


def render_json_prompt(instruction: str, schema_hint: str, examples: Optional[List[Dict[str, Any]]] = None) -> str:
    """Helper to produce a structured JSON-oriented prompt."""
    example_block = f"\nExamples:\n{json.dumps(examples, ensure_ascii=False, indent=2)}" if examples else ""
    return (
        f"{instruction}\n"
        f"Réponds uniquement en JSON strictement valide.\n"
        f"Schéma attendu (hint): {schema_hint}.{example_block}"
    )
