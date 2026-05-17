import os
from langchain.chat_models import init_chat_model
from langchain_core.tools import tool
from langchain_openai import OpenAIEmbeddings
from neo4j import GraphDatabase
from pinecone import Pinecone
from config import (
    NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD, NEO4J_DATABASE,
    PINECONE_API_KEY, PINECONE_INDEX,
    OPENAI_API_KEY, GROQ_API_KEY
)

# ── Clients (initialised once, reused across requests) ─────
driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USERNAME, NEO4J_PASSWORD))

pc    = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(PINECONE_INDEX)

embed_model = OpenAIEmbeddings(
    model="text-embedding-3-small",
    api_key=OPENAI_API_KEY
)

llm = init_chat_model(
    model="llama-3.3-70b-versatile",
    model_provider="groq",
    temperature=0
)


# ── Tool 1: Pinecone document search ───────────────────────

@tool
def pinecone_search(question: str) -> dict:
    """
    Search across annual report, quarterly earnings PDFs,
    and investor sheet for financial data, narratives,
    management commentary, P&L, balance sheet, and employee data.
    """
    embedding = embed_model.embed_query(question)

    results = index.query(
        vector=embedding,
        top_k=6,
        include_metadata=True
    )

    chunks  = []
    sources = []

    for match in results["matches"]:
        meta = match["metadata"]

        # !! Use the exact keys from your Test 5 output below !!
        text   = meta.get("text", "")        # change if your key differs
        source = meta.get("source", "document")  # change if your key differs

        if text:
            chunks.append(f"[{source}]\n{text}")
        if source and source not in sources:
            sources.append(source)

    return {
        "content": "\n\n---\n\n".join(chunks),
        "sources": sources
    }


# ── Tool 2: Neo4j stock price query ────────────────────────

STOCK_SCHEMA = """
Node label: StockPrice
Properties: date (string, format YYYY-MM-DD), open (float),
            high (float), low (float), close (float), volume (float)
Relationship: (:Company)-[:HAS_STOCK_PRICE]->(:StockPrice)
"""

@tool
def stock_query(question: str) -> dict:
    """
    Query stock price data from Neo4j. Use for questions about
    closing price, opening price, volume, price on a specific date,
    price range over a period, or highest/lowest price.
    """
    cypher_prompt = f"""
You are a Neo4j Cypher expert. Write a Cypher query to answer the question.

Schema:
{STOCK_SCHEMA}

Rules:
- Always LIMIT results to 100 rows maximum
- For date filtering use: WHERE sp.date >= '2023-01-01'
- For sorting use: ORDER BY sp.date DESC
- Return only relevant properties
- Return ONLY the Cypher query, no explanation, no markdown fences

Question: {question}
"""
    cypher = llm.invoke(cypher_prompt).content.strip()
    # Strip markdown fences if Gemini adds them anyway
    cypher = cypher.replace("```cypher", "").replace("```", "").strip()

    try:
        with driver.session(database=NEO4J_DATABASE) as s:
            rows = [r.data() for r in s.run(cypher)]
        return {
            "content": str(rows),
            "sources": ["stock_prices.csv"],
            "cypher_used": cypher  # useful for debugging
        }
    except Exception as e:
        return {
            "content": f"Query failed: {str(e)}",
            "sources": [],
            "cypher_used": cypher
        }