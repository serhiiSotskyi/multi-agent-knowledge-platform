from functools import lru_cache

from fastembed import TextEmbedding

from app.core.config import get_settings


@lru_cache
def _embedding_model() -> TextEmbedding:
    return TextEmbedding(model_name=get_settings().embedding_model)


def embed_texts(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    return [vector.tolist() for vector in _embedding_model().embed(texts)]

