import re

from agents import (
    build_search_agent,
    writer_chain,
    critic_chain
)

from tools import scrape_url


def extract_urls(text: str):
    """
    Extract URLs safely from text.
    """
    return re.findall(r'https?://[^\s)]+', text)


def run_research_pipeline(topic: str) -> dict:

    state = {}

    # ============================================
    # STEP 1 — SEARCH AGENT
    # ============================================

    print("\n" + "=" * 60)
    print("STEP 1 — SEARCH AGENT")
    print("=" * 60)

    search_agent = build_search_agent()

    search_result = search_agent.invoke({
        "messages": [(
            "user",
            f"""
Find 3 recent, reliable, detailed sources about:

{topic}

For EACH source provide:

TITLE:
URL:
SUMMARY:
"""
        )]
    })

    content = search_result['messages'][-1].content

    # Handle structured content safely
    if isinstance(content, list):
        search_text = "\n".join(
            item.get("text", "")
            for item in content
            if isinstance(item, dict)
        )
    else:
        search_text = str(content)

    state["search_results"] = search_text

    print("\nSEARCH RESULTS:\n")
    print(state["search_results"])

    # ============================================
    # STEP 2 — SCRAPE URLS DIRECTLY
    # ============================================

    print("\n" + "=" * 60)
    print("STEP 2 — SCRAPING TOP SOURCES")
    print("=" * 60)

    urls = extract_urls(state["search_results"])

    if not urls:
        raise ValueError("No URLs found in search results.")

    # Remove duplicates
    urls = list(dict.fromkeys(urls))

    # Limit scraping
    top_urls = urls[:3]

    all_scraped_content = []

    for url in top_urls:

        try:
            print(f"\nScraping: {url}")

            content = scrape_url.invoke(url)

            all_scraped_content.append(
                f"\n\nSOURCE: {url}\n\n{content}"
            )

        except Exception as e:
            print(f"\nFailed scraping {url}")
            print(f"Reason: {e}")

    state["scraped_content"] = "\n".join(all_scraped_content)

    print("\nSCRAPED CONTENT:\n")
    print(state["scraped_content"][:3000])

    # ============================================
    # STEP 3 — WRITER CHAIN
    # ============================================

    print("\n" + "=" * 60)
    print("STEP 3 — WRITER")
    print("=" * 60)

    research_combined = (
        f"SEARCH RESULTS:\n{state['search_results']}\n\n"
        f"SCRAPED CONTENT:\n{state['scraped_content']}"
    )

    state["report"] = writer_chain.invoke({
        "topic": topic,
        "research": research_combined
    })

    print("\nFINAL REPORT:\n")
    print(state["report"])

    # ============================================
    # STEP 4 — CRITIC
    # ============================================

    print("\n" + "=" * 60)
    print("STEP 4 — CRITIC REVIEW")
    print("=" * 60)

    state["feedback"] = critic_chain.invoke({
        "report": state["report"]
    })

    print("\nCRITIC FEEDBACK:\n")
    print(state["feedback"])

    return state


if __name__ == "__main__":

    topic = input("\nEnter a research topic: ")

    run_research_pipeline(topic)