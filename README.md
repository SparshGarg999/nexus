# 🌌 NEXUS — Multimodal AI Research Platform

NEXUS is an autonomous, multi-agent research system designed to search, analyze, synthesize, and critique information in real-time. By leveraging high-speed inference and a parallelized agentic workflow, NEXUS generates comprehensive research reports with full citations and objective critiques.

![NEXUS UI](https://raw.githubusercontent.com/SparshGarg999/nexus/main/frontend/favicon.png) <!-- Replace with a screenshot later if possible -->

## 🚀 Key Features
- **Real-Time SSE Streaming**: Watch the agents think and write with a "ChatGPT-like" streaming experience.
- **Autonomous Multi-Agent Pipeline**: 
    - **Search Agent**: Finds the most relevant sources via Tavily AI.
    - **Scraper Agent**: Extracts high-quality content from web sources.
    - **Writer Agent**: Synthesizes data into a professional markdown report.
    - **Critic Agent**: Evaluates the report for quality and objectivity.
- **Premium UI/UX**: Modern, glassmorphic design with interactive particle physics and smooth transitions.
- **Multimodal Support**: Upload documents or images for contextualized research.
- **Hybrid Cloud Deployment**: Optimized for speed (Vercel) and persistent streaming (Render).

---

## 🛠️ Technology Stack
- **Frontend**: Vanilla JS, HTML5, CSS3 (Glassmorphism, Canvas API)
- **Backend**: FastAPI (Python 3.9+)
- **LLM Inference**: Groq LPU (Llama-3-70b/8b)
- **Search Engine**: Tavily AI
- **Vision**: Google Gemini 1.5 Pro
- **Hosting**: Vercel (Frontend), Render (Backend)

---

## 💻 Local Setup

### 1. Clone the Repository
```bash
git clone https://github.com/SparshGarg999/nexus.git
cd nexus
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
GROQ_API_KEY=your_groq_key
TAVILY_API_KEY=your_tavily_key
GEMINI_API_KEY=your_google_ai_key
PORT=8000
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the Application
```bash
python run.py
```
Visit `http://localhost:8000` to access the platform.

---

## ☁️ Deployment Guide

### Backend (Render)
1. Push this repo to GitHub.
2. Go to **Render** -> **New** -> **Blueprint**.
3. Connect this repository. Render will use the `render.yaml` to automatically configure the service.
4. Provide your API keys when prompted.
5. Set `FRONTEND_URL` to your Vercel URL (see below).

### Frontend (Vercel)
1. Go to **Vercel** -> **Add New Project**.
2. Select this repository.
3. **Important**: Set the **Root Directory** to `frontend`.
4. Add the following **Rewrite** in `frontend/vercel.json` (already configured in this repo) to point to your Render backend.
5. In `frontend/app.js`, ensure `RENDER_API_URL` points to your deployed Render URL.

---

## 🔗 Live Demo
Check out the live platform here: [nexus-research-ai.vercel.app](https://nexus-research-ai.vercel.app)

---

---

## 🏗️ Architecture Guide
For a deep dive into the system architecture, justifications for technical choices, and interview Q&A, please refer to the [Implementation Plan](./implementation_plan.md).

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
