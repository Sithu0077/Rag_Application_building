import os
import re
import uuid
import requests
import docx
from datetime import datetime, timedelta
from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy import Column, Integer, String, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from jose import JWTError, jwt
from passlib.context import CryptContext
from pdfminer.high_level import extract_text
from sentence_transformers import SentenceTransformer
import chromadb
from dotenv import load_dotenv

# =====================================================
# 🔧 Environment
# =====================================================
load_dotenv()
API_KEY = os.getenv("OPENROUTER_API_KEY")
MODEL_URL = os.getenv("MODEL_ENDPOINT", "https://openrouter.ai/api/v1/chat/completions")

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# =====================================================
# 🚀 FastAPI Setup
# =====================================================
app = FastAPI(title="SBB RAG Application", version="5.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================
# 🧱 Database Setup
# =====================================================
DATABASE_URL = "sqlite:///./users.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True)
    email = Column(String, unique=True)
    hashed_password = Column(String)

Base.metadata.create_all(bind=engine)

# =====================================================
# 🔐 JWT & Auth Config
# =====================================================
SECRET_KEY = "supersecretkey"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict, expires_delta=None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(status_code=401, detail="Invalid credentials")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

# =====================================================
# 🧍‍♂️ AUTH ENDPOINTS
# =====================================================
@app.post("/register")
def register(username: str = Form(...), email: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already exists")
    hashed_pw = get_password_hash(password)
    user = User(username=username, email=email, hashed_password=hashed_pw)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "✅ Registered successfully"}

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}

# =====================================================
# 🧠 Document Processing
# =====================================================
chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection("docs")
embedder = SentenceTransformer("all-MiniLM-L6-v2")

def extract_text_from_file(path):
    ext = os.path.splitext(path)[1].lower()
    if ext == ".pdf":
        return extract_text(path)
    elif ext == ".docx":
        doc = docx.Document(path)
        return "\n".join([p.text for p in doc.paragraphs])
    elif ext == ".txt":
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    return ""

@app.post("/upload")
async def upload(files: list[UploadFile] = File(...), current_user: User = Depends(get_current_user)):
    uploaded = []
    for file in files:
        path = os.path.join(UPLOAD_DIR, file.filename)
        with open(path, "wb") as f:
            f.write(await file.read())
        text = extract_text_from_file(path)
        chunks = [text[i:i+1000] for i in range(0, len(text), 800)]
        embeddings = embedder.encode(chunks).tolist()
        ids = [str(uuid.uuid4()) for _ in chunks]
        metas = [{"filename": file.filename, "email": current_user.email} for _ in chunks]
        collection.add(ids=ids, documents=chunks, embeddings=embeddings, metadatas=metas)
        uploaded.append(file.filename)
    return {"uploaded": uploaded}

@app.post("/query")
def query(question: str = Form(...), current_user: User = Depends(get_current_user)):
    results = collection.query(query_texts=[question], n_results=5)
    docs = results.get("documents", [[]])[0]
    context = "\n".join(docs)
    prompt = f"Context:\n{context}\n\nQuestion: {question}\nAnswer briefly:"
    headers = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}
    payload = {"model": "gpt-4-turbo", "messages": [{"role": "user", "content": prompt}]}
    r = requests.post(MODEL_URL, headers=headers, json=payload)
    return {"answer": r.json()["choices"][0]["message"]["content"]}

@app.get("/")
def root():
    return {"message": "SBB Backend Running ✅"}
