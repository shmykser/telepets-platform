from __future__ import annotations

import logging
from io import BytesIO
import os
from typing import Optional

import replicate  # type: ignore
import requests
from PIL import Image

from config.settings import (
    get_replicate_settings,
    get_quality_settings,
    get_generation_defaults,
)
from .factory import ImageGeneratorProtocol


logger = logging.getLogger(__name__)
_LOG_PATH = "./logs/replicate.log"
def _w(msg: str) -> None:
    try:
        import os, time
        os.makedirs(os.path.dirname(_LOG_PATH), exist_ok=True)
        with open(_LOG_PATH, "a", encoding="utf-8") as f:
            f.write(f"[{int(time.time())}] {msg}\n")
    except Exception:
        pass


class ReplicateImageGenerator(ImageGeneratorProtocol):
    def __init__(self) -> None:
        settings = get_replicate_settings()
        self.model: str = settings.get("model")  # e.g. black-forest-labs/flux-1.1-pro
        self.timeout: int = int(settings.get("timeout", 180))
        # token comes from env REPLICATE_API_TOKEN (replicate lib uses it)

    def generate_image(
        self,
        prompt: str,
        negative_prompt: Optional[str] = None,
        **kwargs,
    ) -> Optional[Image.Image]:
        # Map common kwargs -> replicate inputs for flux-1.1-pro
        defaults = get_generation_defaults()
        quality = get_quality_settings(defaults.get("quality_preset", "high"))  # type: ignore
        width = int(kwargs.get("width", quality.get("width", 1024)))
        height = int(kwargs.get("height", quality.get("height", 1024)))
        steps = int(kwargs.get("steps", quality.get("steps", 30)))
        guidance = float(kwargs.get("guidance_scale", quality.get("guidance_scale", 8.5)))

        def _call(image_size: str):
            # Для flux-1.1-pro не передаём negative_prompt: часть сборок падает на этом параметре
            inputs = {
                "prompt": prompt,
                "image_size": image_size,
                "num_inference_steps": steps,
                "guidance": guidance,
                "output_format": "png",
            }
            logger.info("Replicate call %s with keys=%s", self.model, sorted(inputs.keys()))
            _w(f"call model={self.model} inputs={sorted(inputs.keys())}")
            return replicate.run(self.model, input=inputs)

        try:
            # Первая попытка — запрошенный размер
            # Проверка наличия токена в окружении конкретно в серверном процессе
            _w(f"token_set={bool(os.getenv('REPLICATE_API_TOKEN'))}")
            _w(f"try size {width}x{height}")
            output = _call(f"{width}x{height}")
            # Output может быть FileOutput, str, list[str] или dict
            url = None
            if isinstance(output, list) and output:
                url = output[0]
            elif isinstance(output, str):
                url = output
            else:
                # пробуем привести к строке (FileOutput)
                try:
                    s = str(output)
                    if s.startswith("http"):
                        url = s
                except Exception:
                    pass
            if not url:
                # fallback 1: 768x768
                try:
                    _w("retry 768x768")
                    out2 = _call("768x768")
                    s = str(out2)
                    if s.startswith("http"):
                        url = s
                except Exception as e:
                    logger.warning("Replicate retry 768 failed: %s", e)
                    _w(f"retry768 error {e}")
                # fallback 2: 512x512
                if not url:
                    try:
                        _w("retry 512x512")
                        out3 = _call("512x512")
                        s = str(out3)
                        if s.startswith("http"):
                            url = s
                    except Exception as e:
                        logger.warning("Replicate retry 512 failed: %s", e)
                        _w(f"retry512 error {e}")
                if not url:
                    logger.warning("Replicate returned empty output for model %s after retries", self.model)
                    _w("no url after retries")
                    return None

            _w(f"fetch {url}")
            resp = requests.get(url, timeout=self.timeout)
            resp.raise_for_status()
            _w(f"fetched {len(resp.content)} bytes")
            return Image.open(BytesIO(resp.content)).convert("RGB")
        except Exception as e:
            logger.error("Replicate generation failed: %s", e)
            _w(f"error {e}")
            return None


