# NEXUS — Multimodal AI Research Platform

NEXUS is a cinematic, production-grade AI platform that orchestrates multiple autonomous agents to search the web, scrape sources, and synthesize highly structured research reports in real-time.

## Features
- **Real-time SSE Streaming:** Token-by-token streaming and workflow visualization via Server-Sent Events.
- **Multimodal Uploads:** Extract text from PDFs, TXT, and Markdown files to use as research context.
- **Parallel Execution:** Concurrent web scraping using Python's `asyncio.gather`.
- **Vanilla UI Excellence:** High-performance, no-framework glassmorphism interface with an interactive noodlemagazine-style constellation mesh background.
- **Graceful Cancellation:** Instantly halt async tasks to free server resources.

## Architecture
- **Backend:** FastAPI (Modular Architecture: Routes, Services, Tasks)
- **Frontend:** Vanilla HTML5, CSS3, JavaScript (app.js)
- **Agents:** LangChain + Groq (Llama-3.3-70b-versatile)
- **Tooling:** Tavily Search, BeautifulSoup Web Scraping, PyPDF2 Document Parsing

## Local Development

### 1. Install Dependencies
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Environment Variables
Create a `.env` file in the root directory:
```env
GROQ_API_KEY=your_groq_api_key
TAVILY_API_KEY=your_tavily_api_key
PORT=8000
```

### 3. Run the Application
```bash
python run.py
```
Visit `http://localhost:8000` in your browser.

## Deployment

### Backend (Render)
1. Push this repository to GitHub.
2. Go to [Render](https://render.com/), create a new **Web Service**, and connect your repository.
3. Render will automatically detect the `render.yaml` configuration.
4. Add your Environment Variables (`GROQ_API_KEY`, `TAVILY_API_KEY`).

### Frontend (Vercel)
1. Go to [Vercel](https://vercel.com/), create a new Project, and import your GitHub repository.
2. Vercel will use the `vercel.json` routing configuration to serve the static frontend.
3. In `frontend/app.js`, ensure the `API_BASE` connects to your deployed Render URL.
