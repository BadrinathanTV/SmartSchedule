import json
from functools import lru_cache

try:
    from transformers import pipeline
except ImportError:
    pipeline = None

@lru_cache(maxsize=1)
def _get_generator():
    if pipeline is None:
        raise RuntimeError("transformers library is not installed")
    return pipeline("text-generation", model="Qwen/Qwen2.5-0.5B-Instruct", device="cpu")

def generate_metadata_from_transcript(transcript: str) -> dict:
    if pipeline is None:
        return {}
    if not transcript or len(transcript.strip()) < 10:
        return {}
        
    generator = _get_generator()
    
    prompt = f"""Analyze the following video transcript and extract the following metadata.
You must output ONLY a valid JSON object matching exactly this format:
{{
  "description": "A 2-3 sentence engaging description.",
  "targetAudience": ["list of strings"],
  "tags": ["list of strings"],
  "genre": ["list of strings"]
}}

Transcript:
{transcript}
"""
    
    messages = [
        {"role": "system", "content": "You are a helpful media metadata extraction assistant. You must respond with only raw valid JSON without markdown wrapping."},
        {"role": "user", "content": prompt}
    ]
    
    try:
        output = generator(messages, max_new_tokens=200, temperature=0.1)
        generated_text = output[0]['generated_text'][-1]['content'].strip()
        
        # Clean up any potential markdown formatting from the response
        if generated_text.startswith("```json"):
            generated_text = generated_text[7:]
        elif generated_text.startswith("```"):
            generated_text = generated_text[3:]
        if generated_text.endswith("```"):
            generated_text = generated_text[:-3]
            
        parsed = json.loads(generated_text.strip())
        return parsed
    except Exception as e:
        print(f"Failed to generate or parse metadata: {e}")
        return {}
