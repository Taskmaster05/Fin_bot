# Reflection

---

## 1. What makes your chatbot feel intelligent rather than just doing keyword search?

Several specific architectural decisions push this beyond keyword matching:

**Semantic retrieval, not term matching.**
The Pinecone vector index stores chunks embedded with OpenAI's
`text-embedding-ada-002`. A question like "how profitable was the company
last year" retrieves chunks about net income, operating margins, and EBITDA
— none of which contain the word "profitable". The match happens in meaning,
not vocabulary. A keyword search would return nothing for that query.

**Query resolution before retrieval.**
Before any search happens, a `context_resolver` node rewrites the user's
question using conversation history. If a user asks "did that improve in
Q4?", the system rewrites it to reference the actual metric discussed
earlier before hitting Pinecone or Neo4j. Without this step, follow-up
questions return irrelevant results because vector search has no memory —
the resolver gives it one.

**Routing by intent, not by file type.**
A dedicated router node classifies each question as `docs`, `stock`, or
`both` before retrieval runs. A question about closing price goes to Neo4j
Cypher. A question about management commentary goes to Pinecone. A question
comparing earnings to stock reaction goes to both. This means the system
uses structured queries where the data is structured, and semantic search
where the data is narrative — rather than treating everything the same way.

**LLM-generated Cypher for stock queries.**
Instead of hardcoding query patterns for stock price data, the system
prompts Gemini to write the Cypher query dynamically based on the question.
This means "what was the average closing price between March and June" and
"which month had the highest volume" both work without any pre-written query
templates.

**Citation-grounded synthesis.**
The synthesiser node explicitly instructs the LLM to tag every claim with
a source reference inline and prohibits it from using information outside
the retrieved context. This forces the model to stay grounded in the actual
documents rather than hallucinating plausible-sounding financial figures
from training data.

**Automatic output format selection.**
A format classifier node decides whether the answer should be plain text,
a markdown table, a downloadable Excel file, or a PDF report — based on
the question, not user instruction. A question asking for a full quarterly
comparison gets Excel. A question asking for risk commentary gets a PDF.
This is a decision a junior analyst would make manually; the system makes
it automatically.

---

## 2. Where does it still fall short?

**Numerical precision is not guaranteed.**
When financial figures are retrieved as text chunks from Pinecone (including
the investor sheet, which was ingested as CSV-derived text), the numbers
pass through two lossy steps: chunking during ingestion, and LLM
paraphrasing during synthesis. A real analyst would notice if a revenue
figure is slightly off because the relevant row was split across two chunks
and only one was retrieved.

**No calculation engine.**
The system retrieves and summarises numbers — it does not compute them.
If a user asks "what is the year-over-year revenue growth rate?", the
system will try to find that figure in the documents rather than
calculating it from the raw numbers. If the document does not state it
explicitly, the answer will either be wrong or incomplete. A real analyst
would expect the system to do the arithmetic itself.

**The Cypher generator can fail silently.**
When Gemini generates a Cypher query for stock data, there is a try/except
block that catches errors and returns a failure message. But Gemini can also
generate syntactically valid Cypher that returns wrong results — for example,
filtering on the wrong date format or returning rows in the wrong order.
The system has no way to validate whether the query result is actually
correct; it just passes it to the synthesiser.

**Chunk boundaries cut across tables.**
The n8n ingestion pipeline used a Recursive Character Text Splitter with
no awareness of table structure. A financial table with 12 rows spanning a
page boundary gets split mid-table, and each chunk loses context about what
the columns mean. A real analyst looking at a multi-year P&L comparison
would notice missing rows or misattributed figures.

**No confidence signalling.**
The system never tells the user when it is uncertain. If Pinecone returns
low-similarity matches because the question is outside the document scope,
the synthesiser still produces a confident-sounding answer. A real analyst
would expect the system to say "I could not find sufficient data to answer
this reliably" rather than speculating.

**Session memory is in-memory only.**
The `InMemorySaver` checkpointer means all conversation history is lost
when the server restarts. In a real deployment this would be unacceptable
for any multi-session or multi-user scenario.

---

## 3. Which AI tools did you use, and what did you have to fix or override?

**Tools used:**

- **Claude (Anthropic)** — used throughout the build for architecture
  design, code generation for all core files (`tools.py`, `graph.py`,
  `main.py`, `prompts.py`), debugging decisions, and infrastructure
  choices such as switching from local Neo4j to Aura, from OpenAI LLM
  to Gemini, and from SQLite checkpointer to InMemorySaver.

- **n8n** — used to build the ingestion pipeline: Google Drive trigger,
  file download, OpenAI embedding generation, document chunking with
  Recursive Character Text Splitter, and Pinecone vector store upload.
  This handled all 6 document files without writing ingestion code manually.

- **Gemini 1.5 Pro (Google)** — used as the LLM for all reasoning:
  context resolution, routing, format classification, Cypher generation,
  and answer synthesis.

- **OpenAI `text-embedding-ada-002`** — used only for query embedding
  at retrieval time, because n8n used OpenAI embeddings during ingestion.
  The two had to match or Pinecone search results would be meaningless.

**What had to be fixed or overridden:**

- The original architecture used OpenAI as the LLM. This was swapped
  to Gemini after confirming the OpenAI key was only strictly needed
  for embeddings to match the n8n ingestion model.

- The original plan used a local Neo4j Desktop instance. This was
  replaced with Neo4j Aura (cloud), which required changing the
  connection URI from `bolt://` to `neo4j+s://` and explicitly passing
  the database name in every session call — something the local driver
  does not require.

- The checkpointer was planned as SQLite (`SqliteSaver`), then switched
  to `InMemorySaver` because the `langgraph-checkpoint-sqlite` package
  added an unnecessary dependency. The import also changed from
  `MemorySaver` to `InMemorySaver` after verifying the correct
  LangGraph API.

- Gemini occasionally wraps Cypher output in markdown fences
  (` ```cypher ``` `). A strip step was added to the stock query tool
  to remove these before the query reaches Neo4j, otherwise every
  Cypher call would fail with a syntax error.

- The `/chat` endpoint originally returned a `FileResponse` directly
  for PDF and Excel outputs. This was revised twice based on how Swagger
  UI handles binary responses — ultimately keeping `FileResponse` so
  Swagger's built-in "Download file" link works without a separate
  workflow.