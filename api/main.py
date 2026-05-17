import uuid
from fastapi import FastAPI, WebSocket
from fastapi.responses import FileResponse
from pydantic import BaseModel
from langchain_core.runnables import RunnableConfig
import os
from fastapi import HTTPException

from agent.graph import agent

app = FastAPI(title="Financial Analyst Chatbot")

class ChatRequest(BaseModel):
    session_id: str | None = None
    message:    str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/chat")
async def chat(req: ChatRequest):
    sid    = req.session_id or str(uuid.uuid4())
    config: RunnableConfig = {"configurable": {"thread_id": sid}}

    initial_state = {
        "messages":      [{"role": "user", "content": req.message}],
        "tool_results":  [],
        "sources":       [],
        "output_format": "",
        "_route":        "",
        "download_path": "",
        "download_type": "",
    }

    result = agent.invoke(initial_state, config=config)
    answer = result["messages"][-1]["content"]

    if result.get("download_path"):
        ext   = result["download_type"]
        media = (
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            if ext == "excel" else "application/pdf"
        )
        filename = os.path.basename(result["download_path"])
        if ext == "excel" and not filename.lower().endswith(".xlsx"):
            filename = "financial_report.xlsx"
        elif ext == "pdf" and not filename.lower().endswith(".pdf"):
            filename = "financial_report.pdf"
        return FileResponse(
            result["download_path"],
            media_type=media,
            filename=filename
        )

    return {
        "session_id": sid,
        "answer":     answer,
        "sources":    result.get("sources", []),
        "format":     result.get("output_format", "text")
    }


@app.delete("/session/{session_id}")
def clear_session(session_id: str):
    return {
        "cleared": session_id,
        "note": "Start a new session_id to begin fresh"
    }


@app.websocket("/chat/stream")
async def chat_stream(ws: WebSocket):
    await ws.accept()
    data   = await ws.receive_json()
    sid    = data.get("session_id", str(uuid.uuid4()))
    config: RunnableConfig = {"configurable": {"thread_id": sid}}

    async for chunk in agent.astream(
        {
            "messages":      [{"role": "user", "content": data["message"]}],
            "tool_results":  [],
            "sources":       [],
            "output_format": "",
            "_route":        "",
            "download_path": "",
            "download_type": "",
        },
        config=config
    ):
        if "synthesiser" in chunk:
            text = chunk["synthesiser"]["messages"][-1]["content"]
            await ws.send_text(text)

    await ws.close()