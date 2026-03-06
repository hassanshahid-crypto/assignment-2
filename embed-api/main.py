from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import os

app = FastAPI(title="Embedding API")

model_name = os.getenv("MODEL_NAME", "all-MiniLM-L6-v2")
model = SentenceTransformer(model_name)


class EmbedRequest(BaseModel):
    text: str


class EmbedBatchRequest(BaseModel):
    texts: list[str]


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/embed")
def embed(req: EmbedRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    embedding = model.encode(req.text).tolist()
    return {"embedding": embedding}


@app.post("/embed-batch")
def embed_batch(req: EmbedBatchRequest):
    if not req.texts:
        raise HTTPException(status_code=400, detail="Texts list cannot be empty")
    embeddings = model.encode(req.texts).tolist()
    return {"embeddings": embeddings}
