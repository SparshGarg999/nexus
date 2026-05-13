from dotenv import load_dotenv

from langchain.agents import create_agent
from langchain_groq import ChatGroq

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from backend.tools.tools import web_search, scrape_url


# ============================================
# LOAD ENV VARIABLES
# ============================================

load_dotenv()


# ============================================
# MODEL SETUP
# ============================================

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0
)


# ============================================
# SEARCH AGENT
# ============================================

def build_search_agent():
    return create_agent(
        model=llm,
        tools=[web_search]
    )


# ============================================
# READER AGENT
# ============================================

def build_reader_agent():
    return create_agent(
        model=llm,
        tools=[scrape_url]
    )


# ============================================
# WRITER CHAIN
# ============================================

writer_prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        """
You are an expert research writer.

Write:
- factual
- concise
- professional
- well-structured reports

Only use the provided research.
Do not hallucinate or invent information.
"""
    ),

    (
        "human",
        """
Write a professional research report.

TOPIC:
{topic}

PROVIDED CONTEXT (From User Uploads):
{context}

RESEARCH (From Web):
{research}

Use this structure:

# Introduction
Provide a brief overview.

# Key Findings
Include at least 2 major findings with explanations.

# Conclusion
Summarize the insights clearly.

# Sources
List all URLs found in the research.

Keep the report concise, clear, and readable.
"""
    ),
])

writer_chain = writer_prompt | llm | StrOutputParser()


# ============================================
# CRITIC CHAIN
# ============================================

critic_prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        """
You are a strict and constructive research critic.

Evaluate:
- clarity
- factual accuracy
- structure
- depth
- usefulness

Be concise, honest, and actionable.
"""
    ),

    (
        "human",
        """
Review the research report below.

REPORT:
{report}

Respond EXACTLY in this format:

Score: X/10

Strengths:
- Point 1
- Point 2

Areas to Improve:
- Point 1
- Point 2

Verdict:
One concise final opinion.
"""
    ),
])

critic_chain = critic_prompt | llm | StrOutputParser()