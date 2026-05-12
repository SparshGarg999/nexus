"""
FastAPI server for the Multi Agent Research System.
Streams pipeline progress to the frontend via WebSocket.
"""

import asyncio
import json
import re
import traceback

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from agents import build_search_agent, writer_chain, critic_chain
from tools import scrape_url


app = FastAPI(title="Multi Agent Research System")

# Serve frontend static files
app.mount("/static", StaticFiles(directory="frontend"), name="static")


@app.get("/")
async def root():
    return FileResponse("frontend/index.html")


def extract_urls(text: str):
    """Extract URLs from text."""
    return re.findall(r'https?://[^\s)]+', text)


async def run_pipeline_streaming(topic: str, ws: WebSocket):
    """
    Run the research pipeline and stream updates via WebSocket.
    Each step sends a status update + result.
    """

    state = {}

    # ── STEP 1 — SEARCH AGENT ──────────────────────────────
    await ws.send_json({
        "type": "step",
        "step": 1,
        "name": "Search Agent",
        "description": "Finding reliable sources across the web...",
        "status": "running"
    })

    search_agent = build_search_agent()

    # Run blocking agent in thread pool
    search_result = await asyncio.to_thread(
        search_agent.invoke,
        {"messages": [(
            "user",
            f"""
Find 3 recent, reliable, detailed sources about:

{topic}

For EACH source provide:

TITLE:
URL:
SUMMARY:
"""
        )]}
    )

    content = search_result['messages'][-1].content

    if isinstance(content, list):
        search_text = "\n".join(
            item.get("text", "")
            for item in content
            if isinstance(item, dict)
        )
    else:
        search_text = str(content)

    state["search_results"] = search_text

    # Count found URLs for a clean summary
    found_urls = extract_urls(search_text)
    source_count = len(set(found_urls))

    await ws.send_json({
        "type": "step_result",
        "step": 1,
        "name": "Search Agent",
        "status": "done",
        "content": f"Found {source_count} sources"
    })

    # ── STEP 2 — SCRAPE URLS ──────────────────────────────
    await ws.send_json({
        "type": "step",
        "step": 2,
        "name": "Web Scraper",
        "description": "Extracting content from top sources...",
        "status": "running"
    })

    urls = extract_urls(state["search_results"])
    urls = list(dict.fromkeys(urls))
    top_urls = urls[:3]

    all_scraped = []

    for i, url in enumerate(top_urls):
        await ws.send_json({
            "type": "scrape_progress",
            "step": 2,
            "url": url,
            "index": i + 1,
            "total": len(top_urls)
        })

        try:
            result = await asyncio.to_thread(scrape_url.invoke, url)
            all_scraped.append(f"\n\nSOURCE: {url}\n\n{result}")
        except Exception as e:
            all_scraped.append(f"\n\nSOURCE: {url}\n\n[Failed to scrape: {e}]")

    state["scraped_content"] = "\n".join(all_scraped)

    await ws.send_json({
        "type": "step_result",
        "step": 2,
        "name": "Web Scraper",
        "status": "done",
        "content": f"Scraped {len(all_scraped)} sources successfully.",
        "urls": top_urls
    })

    # ── STEP 3 — WRITER ──────────────────────────────
    await ws.send_json({
        "type": "step",
        "step": 3,
        "name": "Research Writer",
        "description": "Composing a professional research report...",
        "status": "running"
    })

    research_combined = (
        f"SEARCH RESULTS:\n{state['search_results']}\n\n"
        f"SCRAPED CONTENT:\n{state['scraped_content']}"
    )

    report = await asyncio.to_thread(
        writer_chain.invoke,
        {"topic": topic, "research": research_combined}
    )

    state["report"] = report

    await ws.send_json({
        "type": "step_result",
        "step": 3,
        "name": "Research Writer",
        "status": "done",
        "content": "Report generated."
    })

    # Send the report content separately for streaming effect
    await ws.send_json({
        "type": "report",
        "content": report
    })

    # ── STEP 4 — CRITIC ──────────────────────────────
    await ws.send_json({
        "type": "step",
        "step": 4,
        "name": "Research Critic",
        "description": "Evaluating report quality and accuracy...",
        "status": "running"
    })

    feedback = await asyncio.to_thread(
        critic_chain.invoke,
        {"report": state["report"]}
    )

    state["feedback"] = feedback

    await ws.send_json({
        "type": "step_result",
        "step": 4,
        "name": "Research Critic",
        "status": "done",
        "content": "Review complete."
    })

    await ws.send_json({
        "type": "feedback",
        "content": feedback
    })

    # ── DONE ──────────────────────────────
    await ws.send_json({"type": "done"})


@app.websocket("/ws/research")
async def websocket_research(ws: WebSocket):
    await ws.accept()

    try:
        data = await ws.receive_json()
        topic = data.get("topic", "").strip()

        if not topic:
            await ws.send_json({
                "type": "error",
                "content": "No topic provided."
            })
            return

        await run_pipeline_streaming(topic, ws)

    except WebSocketDisconnect:
        print("[WS] Client disconnected")
    except Exception as e:
        traceback.print_exc()
        try:
            await ws.send_json({
                "type": "error",
                "content": f"Pipeline error: {str(e)}"
            })
        except Exception:
            pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
