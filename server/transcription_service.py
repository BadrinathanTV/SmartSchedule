from __future__ import annotations

from functools import lru_cache
import os
import tempfile
from typing import Optional

import whisperx


def _get_model() -> object:
    """Load WhisperX model with safe device handling.
    Attempts to use CUDA if requested and available, otherwise falls back to CPU.
    """
    if whisperx is None:
        raise RuntimeError("whisperx is not installed")
    # Determine desired device; default to CPU
    requested_device = os.getenv("WHISPERX_DEVICE", "cpu").lower()
    device = "cuda" if requested_device == "cuda" else "cpu"
    model_name = os.getenv("WHISPERX_MODEL", "base")
    try:
        return whisperx.load_model(model_name, device)
    except Exception as e:
        # If CUDA fails, fallback to CPU
        if device == "cuda":
            print(f"Failed to load WhisperX on CUDA: {e}. Falling back to CPU.")
            return whisperx.load_model(model_name, "cpu")
        else:
            raise RuntimeError(f"Failed to load WhisperX model: {e}")



def transcribe_media_bytes(file_bytes: bytes, file_name: str) -> Optional[str]:
    if whisperx is None:
        return None
    try:
        model = _get_model()
        with tempfile.NamedTemporaryFile(delete=True, suffix=os.path.splitext(file_name)[1] or ".mp4") as temp_file:
            temp_file.write(file_bytes)
            temp_file.flush()
            result = model.transcribe(temp_file.name)
        if not isinstance(result, dict):
            return None
        if "text" in result:
            text = result["text"]
        else:
            text = " ".join([seg.get("text", "").strip() for seg in result.get("segments", [])])
        
        if not text:
            return None
        return text.strip() or None
    except Exception as e:
        import traceback
        traceback.print_exc()
        return None
