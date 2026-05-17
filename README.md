# FinSight AI Financial Analyst

A full-stack financial analyst chatbot that uses a LangGraph-driven agent, document search, and stock query tools to answer questions and return results as text, Excel, or PDF reports.

## Project Overview

This repository has two main parts:

- `api/`: backend FastAPI service powering the chatbot and file generation
- `frontend/`: React/Vite frontend UI for interacting with the agent
- `agent/`: graph-based agent logic, prompt flow, and tool integration

## Repository Structure

- `api/main.py` - FastAPI app exposing `/health`, `/chat`, and `/chat/stream`
- `agent/graph.py` - state graph and conversational workflow
- `agent/tools.py` - Pinecone and Neo4j tools, embeddings, and LLM setup
- `agent/prompts.py` - prompt templates for routing, formatting, resolution, and synthesis
- `frontend/` - React UI with chat, output panel, and file download support
- `config.py` - environment variable loader for database and API keys
- `requirements.txt` - backend Python dependencies

## Prerequisites

- Python 3.11+ (recommended)
- Node.js 20+ / npm 10+ (or latest stable)
- Git
- Access to the external services used by the project:
  - Neo4j database
  - Pinecone index
  - OpenAI API or Groq provider credentials

## Backend Setup

1. Create a Python virtual environment

```bash
python -m venv .venv
```

2. Activate the environment

Windows (PowerShell):

```powershell
.\.venv\Scripts\Activate.ps1
```

Windows (cmd.exe):

```cmd
.\.venv\Scripts\activate.bat
```

3. Install backend dependencies

```bash
pip install -r requirements.txt
```

4. Configure environment variables

Create a `.env` file in the repository root with the following values:

```env
NEO4J_URI=bolt://<host>:7687
NEO4J_USERNAME=<username>
NEO4J_PASSWORD=<password>
NEO4J_DATABASE=<database>
PINECONE_API_KEY=<pinecone_api_key>
PINECONE_INDEX_NAME=<pinecone_index_name>
GROQ_API_KEY=<groq_api_key>
OPENAI_API_KEY=<openai_api_key>
```

> Replace the placeholder values with your actual credentials.

5. Run the backend

```bash
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

## Frontend Setup

1. Change into the frontend folder

```bash
cd frontend
```

2. Install npm dependencies

```bash
npm install
```

3. Start the frontend development server

```bash
npm run dev
```

4. Open the app in your browser

The default Vite URL will be shown in the terminal, typically `http://localhost:5173`.

## Running the Full Application

- Start the backend first from the repository root
- Start the frontend from `frontend/`
- Ask questions in the UI and download generated Excel/PDF outputs from the right-side Output panel

## Environment Variables

The backend depends on these variables:

- `NEO4J_URI`
- `NEO4J_USERNAME`
- `NEO4J_PASSWORD`
- `NEO4J_DATABASE`
- `PINECONE_API_KEY`
- `PINECONE_INDEX_NAME`
- `GROQ_API_KEY`
- `OPENAI_API_KEY`

## Notes and Dependency Check

The backend requirements have been updated to include packages used by the code:

- `langchain-core`
- `langchain-openai`

If your environment needs different package names for Pinecone or other providers, adjust `requirements.txt` accordingly.

## Useful Commands

```bash
# Backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

## Troubleshooting

- If the backend fails due to missing imports, verify `pip install -r requirements.txt` completed successfully.
- If the frontend fails, remove `node_modules` and reinstall with `npm install`.
- Ensure the `.env` file is present in the repo root and contains valid credentials.

## License

Add your license details here.
