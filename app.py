import os
import re
import uuid
import requests
from fastapi import FastAPI, UploadFile, File, Form
from sentence_transformers import SentenceTransformer
from pdfminer.high_level import extract_text
import docx
import chromadb
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

API_KEY = os.getenv("OPENROUTER_API_KEY")
MODEL_URL = os.getenv("MODEL_ENDPOINT", "https://openrouter.ai/api/v1/chat/completions")

# Directories
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Initialize FastAPI
app = FastAPI(title="RAG Application (OpenRouter)", version="3.1")

# Initialize Chroma and embedding model
chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection("documents")
embedder = SentenceTransformer("all-MiniLM-L6-v2")


# ---------- Helpers ---------- #

def extract_text_from_file(path: str, filename: str) -> str:
    ext = filename.lower().split(".")[-1]
    if ext == "pdf":
        return extract_text(path)
    elif ext in ["docx", "doc"]:
        d = docx.Document(path)
        return "\n".join([p.text for p in d.paragraphs])
    else:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 100):
    text = re.sub(r"\s+", " ", text)
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start = end - overlap
    return chunks


# ---------- Endpoints ---------- #

@app.post("/upload")
async def upload(files: list[UploadFile] = File(...)):
    """Upload PDFs/TXT/DOCX files, embed, and store."""
    uploaded = []
    for file in files:
        data = await file.read()
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as f:
            f.write(data)

        text = extract_text_from_file(file_path, file.filename)
        chunks = chunk_text(text)
        embeddings = embedder.encode(chunks).tolist()
        ids = [str(uuid.uuid4()) for _ in chunks]
        metas = [{"filename": file.filename, "chunk": i} for i in range(len(chunks))]

        collection.add(ids=ids, documents=chunks, embeddings=embeddings, metadatas=metas)
        uploaded.append({"filename": file.filename, "chunks": len(chunks)})
    return {"status": "success", "uploaded_files": uploaded}


@app.post("/query")
async def query(question: str = Form(...)):
    """Ask a question about your uploaded documents."""
    # Retrieve relevant chunks
    results = collection.query(query_texts=[question], n_results=5)
    docs = results["documents"][0]
    metas = results["metadatas"][0]
    context = "\n".join(docs)

    # Build prompt
    prompt = f"""
You are a helpful assistant. Use only the context below to answer.
If the context does not contain the answer, reply "I don't know".

Context:
{context}

Question: {question}
Answer:
"""

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "HTTP-Referer": "https://openrouter.ai",  # required by OpenRouter
        "X-Title": "RAG App",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "gpt-4-turbo",  # You can also use "mistralai/mixtral-8x7b"
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 250
    }

    try:
        r = requests.post(MODEL_URL, headers=headers, json=payload, timeout=60)
        r.raise_for_status()
        data = r.json()
        answer = data["choices"][0]["message"]["content"]
    except Exception as e:
        return {"error": str(e)}

    sources = list({m["filename"] for m in metas})
    return {"question": question, "answer": answer, "sources": sources}


@app.get("/")
async def root():
    return {"message": "RAG app is running. Visit /docs to test."}


# ---------- Run the Server ---------- #
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
