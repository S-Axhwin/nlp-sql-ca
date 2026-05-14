"""
FastAPI Application — NL2SQL System
Exposes /query endpoint: takes natural language → returns SQL + results
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os

from backend.nlp.preprocessor import NLPreprocessor
from backend.nlp.embeddings import EmbeddingMatcher
from backend.sql_generator.generator import SQLGenerator
from backend.database.schema import init_db
from backend.database.executor import SQLExecutor

app = FastAPI(title="NL2SQL — Transformer-Based Query Generation")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Init components
init_db()
preprocessor = NLPreprocessor()
matcher = EmbeddingMatcher()
generator = SQLGenerator()
executor = SQLExecutor()

class QueryRequest(BaseModel):
    query: str

@app.get("/")
def index():
    return FileResponse("frontend/index.html")

@app.post("/query")
def process_query(req: QueryRequest):
    # Step 1: Preprocess
    preprocessed = preprocessor.preprocess(req.query)

    # Step 2: Semantic schema matching (transformer embeddings + cosine similarity)
    schema_match = matcher.get_schema_match(req.query)

    # Step 3: SQL generation
    sql_result = generator.generate(req.query, preprocessed, schema_match)

    # Step 4: Execute
    execution = executor.execute(sql_result["sql"])

    return {
        "query": req.query,
        "preprocessed": preprocessed,
        "schema_match": schema_match,
        "generated_sql": sql_result["sql"],
        "explanation": sql_result["explanation"],
        "execution": execution
    }

@app.get("/schema")
def get_schema():
    from backend.utils.schema_meta import SCHEMA_META
    return SCHEMA_META

@app.get("/health")
def health():
    return {"status": "ok", "model": "all-MiniLM-L6-v2"}
