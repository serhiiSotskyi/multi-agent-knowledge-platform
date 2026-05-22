from uuid import uuid4

from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, FieldCondition, Filter, MatchValue, PayloadSchemaType, PointStruct, VectorParams

from app.core.config import get_settings
from app.services.embeddings import embed_texts

VECTOR_SIZE = 384


def get_qdrant() -> QdrantClient:
    settings = get_settings()
    return QdrantClient(url=str(settings.qdrant_url), api_key=settings.qdrant_api_key, timeout=30)


def ensure_collections() -> None:
    settings = get_settings()
    client = get_qdrant()
    existing = {collection.name for collection in client.get_collections().collections}
    if settings.qdrant_collection_documents not in existing:
        client.create_collection(
            collection_name=settings.qdrant_collection_documents,
            vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
        )
    try:
        client.create_payload_index(
            collection_name=settings.qdrant_collection_documents,
            field_name="user_id",
            field_schema=PayloadSchemaType.KEYWORD,
            wait=True,
        )
    except Exception as exc:
        if "already exists" not in str(exc).lower():
            raise


def index_chunks(user_id: str, document_id: str, filename: str, chunks: list[str]) -> list[str]:
    settings = get_settings()
    client = get_qdrant()
    vectors = embed_texts(chunks)
    point_ids = [str(uuid4()) for _ in chunks]
    points = [
        PointStruct(
            id=point_id,
            vector=vector,
            payload={
                "user_id": user_id,
                "document_id": document_id,
                "filename": filename,
                "chunk_index": index,
                "content": chunk,
            },
        )
        for point_id, vector, index, chunk in zip(point_ids, vectors, range(len(chunks)), chunks, strict=True)
    ]
    if points:
        client.upsert(collection_name=settings.qdrant_collection_documents, points=points)
    return point_ids


def retrieve(user_id: str, query: str, limit: int = 5) -> list[dict]:
    settings = get_settings()
    client = get_qdrant()
    query_vector = embed_texts([query])[0]
    response = client.query_points(
        collection_name=settings.qdrant_collection_documents,
        query=query_vector,
        query_filter=Filter(must=[FieldCondition(key="user_id", match=MatchValue(value=user_id))]),
        limit=limit,
        with_payload=True,
    )
    citations = []
    for hit in response.points:
        payload = hit.payload or {}
        citations.append(
            {
                "score": hit.score,
                "filename": payload.get("filename", "unknown"),
                "document_id": payload.get("document_id"),
                "chunk_index": payload.get("chunk_index"),
                "content": payload.get("content", ""),
            }
        )
    return citations
