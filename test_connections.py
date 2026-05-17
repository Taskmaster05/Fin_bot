import os
from dotenv import load_dotenv
from neo4j import GraphDatabase
from pinecone import Pinecone
from langchain_openai import OpenAIEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chat_models import init_chat_model
load_dotenv()

# ── Test 1: Neo4j ──────────────────────────────────────────
print("Testing Neo4j...")

driver = GraphDatabase.driver(
    os.getenv("NEO4J_URI"),
    auth=(os.getenv("NEO4J_USERNAME"), os.getenv("NEO4J_PASSWORD"))
)
driver.verify_connectivity()
print("✓ Neo4j connected")

# Check stock data is actually there
with driver.session(database=os.getenv("NEO4J_DATABASE")) as s:
    result = s.run("MATCH (n) RETURN labels(n) AS label, count(n) AS count")
    for r in result:
        print(f"  → {r['label']}: {r['count']} nodes")
driver.close()

# ── Test 2: Pinecone ───────────────────────────────────────
print("\nTesting Pinecone...")

pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index(os.getenv("PINECONE_INDEX_NAME"))
stats = index.describe_index_stats()
print(f"✓ Pinecone connected")
print(f"  → Total vectors: {stats['total_vector_count']}")
print(f"  → Dimensions: {stats['dimension']}")

# ── Test 3: OpenAI embeddings ──────────────────────────────
print("\nTesting OpenAI embeddings...")

embed_model = OpenAIEmbeddings(
    model="text-embedding-3-small",
    api_key=os.getenv("OPENAI_API_KEY")
)
test_vector = embed_model.embed_query("test")
print(f"✓ OpenAI embeddings working — dimensions: {len(test_vector)}")

# # ── Test 4: Groq LLM ─────────────────────────────────────
# print("\nTesting Groq...")

# llm = init_chat_model(
#     model="llama-3.3-70b-versatile",
#     model_provider="groq"
# )

# response = llm.invoke("Explain LangGraph in simple terms")
# print(response.content)

# ── Test 5: Pinecone metadata structure ───────────────────
print("\nChecking Pinecone metadata keys...")
dummy_vector = embed_model.embed_query("revenue")
results = index.query(vector=dummy_vector, top_k=1, include_metadata=True)
if results["matches"]:
    print(f"  → Metadata keys: {list(results['matches'][0]['metadata'].keys())}")
    print(f"  → Sample text: {str(results['matches'][0]['metadata'])[:300]}")
else:
    print("  ⚠ No results returned — check your index name")

print("\n✓ All systems ready")