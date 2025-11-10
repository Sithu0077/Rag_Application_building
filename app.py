import os
import re
import uuid
import requests
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer
from pdfminer.high_level import extract_text
import docx
import chromadb
from dotenv import load_dotenv

# ==========================================================
# 🌍 Environment Setup
# ==========================================================
load_dotenv()
API_KEY = os.getenv("OPENROUTER_API_KEY")
MODEL_URL = os.getenv("MODEL_ENDPOINT", "https://openrouter.ai/api/v1/chat/completions")

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ==========================================================
# 🚀 Initialize FastAPI
# ==========================================================
app = FastAPI(title="RAG Application (Final Stable Version)", version="3.3")

# ✅ Allow frontend (React) to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can limit to ["http://127.0.0.1:3000"] later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================================
# 🧠 Initialize ChromaDB + Embedding Model
# ==========================================================
chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection("documents")
embedder = SentenceTransformer("all-MiniLM-L6-v2")


# ==========================================================
# 📚 Helper Functions
# ==========================================================
def extract_text_from_file(path: str, filename: str) -> str:
    """Extract text safely from PDF, DOCX, or TXT."""
    ext = filename.lower().split(".")[-1]
    try:
        if ext == "pdf":
            return extract_text(path)
        elif ext in ["docx", "doc"]:
            doc = docx.Document(path)
            return "\n".join([p.text for p in doc.paragraphs])
        else:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()
    except Exception as e:
        print(f"⚠️ Error reading {filename}: {e}")
        return ""


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200):
    """Split text into overlapping chunks for embeddings."""
    text = re.sub(r"\s+", " ", text)
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start = end - overlap
    return chunks


# ==========================================================
# 📤 File Upload Endpoint
# ==========================================================
@app.post("/upload")
async def upload(files: list[UploadFile] = File(...)):
    if not files:
        return {"error": "No files received."}

    uploaded_files = []
    print(f"📂 Received {len(files)} file(s) for upload.")

    for file in files:
        try:
            # Save the uploaded file locally
            file_path = os.path.join(UPLOAD_DIR, file.filename)
            with open(file_path, "wb") as f:
                f.write(await file.read())
            print(f"✅ Saved file: {file.filename}")

            # Extract text
            text = extract_text_from_file(file_path, file.filename)
            if not text.strip():
                print(f"⚠️ No readable text in {file.filename}")
                continue

            # Chunk + Embed
            chunks = chunk_text(text)
            print(f"🧩 Created {len(chunks)} chunks from {file.filename}")
            embeddings = embedder.encode(chunks).tolist()
            ids = [str(uuid.uuid4()) for _ in chunks]
            metas = [{"filename": file.filename, "chunk": i} for i in range(len(chunks))]

            collection.add(ids=ids, documents=chunks, embeddings=embeddings, metadatas=metas)
            uploaded_files.append({"filename": file.filename, "chunks": len(chunks)})

        except Exception as e:
            print(f"❌ Error processing {file.filename}: {e}")
            return {"error": str(e)}

    print("✅ All files uploaded and embedded successfully.")
    return {"status": "success", "uploaded_files": uploaded_files}


# ==========================================================
# 💬 Query Endpoint (RAG)
# ==========================================================
@app.post("/query")
async def query(question: str = Form(...)):
    """Answer a question based on uploaded documents."""
    if not question.strip():
        return {"error": "Empty question received."}

    print(f"🧠 Received query: {question}")

    try:
        results = collection.query(query_texts=[question], n_results=8)
        docs = results.get("documents", [[]])[0]
        metas = results.get("metadatas", [[]])[0]

        if not docs or len(docs) == 0:
            print("⚠️ No relevant context found.")
            return {"question": question, "answer": "No relevant context found.", "sources": []}

        context = "\n\n".join([d.strip() for d in docs if d.strip()])

        # 🧠 Improved system prompt
        prompt = f"""
You are a highly intelligent assistant for answering document-based questions.
Use ONLY the following context to answer the user's question.
If the context does not contain the answer, say "I don't have enough information in the context."

Context:
{context}

Question: {question}

Answer clearly in 3–5 sentences.
"""

        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "HTTP-Referer": "https://openrouter.ai",
            "X-Title": "RAG App",
            "Content-Type": "application/json",
        }

        payload = {
            "model": "gpt-4-turbo",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 350,
            "temperature": 0.4,
        }

        r = requests.post(MODEL_URL, headers=headers, json=payload, timeout=60)
        r.raise_for_status()
        data = r.json()
        answer = data["choices"][0]["message"]["content"].strip()

        sources = list({m["filename"] for m in metas if "filename" in m})
        print(f"✅ Answer generated successfully for question: {question}")

        return {"question": question, "answer": answer, "sources": sources}

    except Exception as e:
        print(f"❌ Query error: {e}")
        return {"error": str(e)}


# ==========================================================
# 🏠 Root Endpoint + Health Check
# ==========================================================
@app.get("/")
async def root():
    return {
        "message": "✅ RAG backend is running successfully!",
        "endpoints": ["/upload", "/query"],
        "docs": "Visit /docs for API testing",
    }


@app.get("/ping")
async def ping():
    return {"status": "alive", "message": "Backend running smoothly 🚀"}


# ==========================================================
# ▶️ Run the App
# ==========================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
