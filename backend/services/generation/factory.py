from typing import Optional
from config.settings import get_generation_provider


class ImageGeneratorProtocol:
    def generate_image(self, prompt: str, negative_prompt: Optional[str] = None, **kwargs):  # -> PIL.Image.Image | None
        raise NotImplementedError


def get_image_generator() -> ImageGeneratorProtocol:
    provider = get_generation_provider()
    if provider == "replicate":
        from .replicate_client import ReplicateImageGenerator
        return ReplicateImageGenerator()
    else:
        # Fallback to Hugging Face generator
        from generator.image_gen import HFImageGenerator  # type: ignore
        return HFImageGenerator()  # type: ignore


