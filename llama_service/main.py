import os
from fastapi import FastAPI, Request
from pydantic import BaseModel
from llama_cpp import Llama
from fastapi.middleware.cors import CORSMiddleware

MODEL_PATH = os.environ.get("LLAMA_MODEL_PATH", "../data/llama-2-7b-chat.Q4_K_M.gguf")

app = FastAPI()

# Allow CORS for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

llm = None

class Query(BaseModel):
    question: str

@app.on_event("startup")
def load_model():
    global llm
    llm = Llama(model_path=MODEL_PATH, n_ctx=2048)

@app.post("/api/llama")
def ask_llama(query: Query):
    prompt = query.question.strip()
    if not prompt:
        return {"error": "Empty question"}
    # Simple prompt format
    full_prompt = f"[INST] {prompt} [/INST]"
    output = llm(full_prompt, max_tokens=512, stop=["</s>"])
    answer = output["choices"][0]["text"].strip()
    return {"answer": answer}

@app.get("/")
def root():
    return {"message": "Llama Inference Service running"} 