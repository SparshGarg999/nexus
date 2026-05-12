import asyncio
import re
from backend.agents.agents import build_search_agent, writer_chain, critic_chain
from backend.tools.tools import scrape_url
from backend.tasks.manager import task_manager

def extract_urls(text: str):
    return re.findall(r'https?://[^\s)]+', text)

async def _scrape_url_safe(url: str):
    try:
        # Use a wrapper if scrape_url doesn't support async, or run in thread
        # scrape_url is a LangChain tool. It has `.ainvoke` if async is enabled.
        # Otherwise, we use asyncio.to_thread
        result = await asyncio.to_thread(scrape_url.invoke, url)
        return {"url": url, "content": result, "status": "success"}
    except Exception as e:
        return {"url": url, "content": f"Failed to scrape: {e}", "status": "error"}

async def run_research_pipeline(task_id: str, topic: str, context: str = ""):
    state = {}
    
    try:
        # STEP 1: Search
        await task_manager.put_event(task_id, {
            "type": "workflow",
            "stage": "Planning research"
        })
        
        await asyncio.sleep(0.5)
        
        await task_manager.put_event(task_id, {
            "type": "workflow",
            "stage": "Searching web"
        })
        
        search_agent = build_search_agent()
        search_query = f"""
Find 3 recent, reliable, detailed sources about:

{topic}

Context provided by user:
{context}

For EACH source provide:

TITLE:
URL:
SUMMARY:
"""
        search_result = await asyncio.to_thread(
            search_agent.invoke,
            {"messages": [("user", search_query)]}
        )
        
        content = search_result['messages'][-1].content
        if isinstance(content, list):
            search_text = "\n".join(item.get("text", "") for item in content if isinstance(item, dict))
        else:
            search_text = str(content)
            
        state["search_results"] = search_text
        urls = extract_urls(search_text)
        urls = list(dict.fromkeys(urls))[:3]
        
        # STEP 2: Scraping
        await task_manager.put_event(task_id, {
            "type": "workflow",
            "stage": "Scraping sources"
        })
        
        await task_manager.put_event(task_id, {
            "type": "workflow",
            "stage": "Running parallel agents"
        })
        
        scrape_tasks = [_scrape_url_safe(u) for u in urls]
        scraped_results = await asyncio.gather(*scrape_tasks)
        
        all_scraped_content = []
        sources_list = []
        for res in scraped_results:
            url = res["url"]
            text = res["content"]
            all_scraped_content.append(f"\n\nSOURCE: {url}\n\n{text}")
            if res["status"] == "success":
                # snippet could be first 100 chars
                snippet = str(text)[:150].replace('\n', ' ') + "..."
                sources_list.append({
                    "title": url.split("//")[-1].split("/")[0], # Very rough title
                    "url": url,
                    "snippet": snippet
                })
                
        state["scraped_content"] = "\n".join(all_scraped_content)
        
        # Send sources event to UI
        if sources_list:
            await task_manager.put_event(task_id, {
                "type": "sources",
                "data": sources_list
            })
            
        # STEP 3: Writer (Streaming)
        await task_manager.put_event(task_id, {
            "type": "workflow",
            "stage": "Synthesizing report"
        })
        
        research_combined = (
            f"SEARCH RESULTS:\n{state['search_results']}\n\n"
            f"SCRAPED CONTENT:\n{state['scraped_content']}"
        )
        
        full_report = ""
        # Use .astream for streaming
        async for chunk in writer_chain.astream({
            "topic": topic,
            "context": context,
            "research": research_combined
        }):
            full_report += chunk
            await task_manager.put_event(task_id, {
                "type": "token",
                "content": chunk
            })
            
        state["report"] = full_report
        
        # STEP 4: Critic
        await task_manager.put_event(task_id, {
            "type": "workflow",
            "stage": "Critiquing findings"
        })
        
        feedback = await asyncio.to_thread(
            critic_chain.invoke,
            {"report": state["report"]}
        )
        
        await task_manager.put_event(task_id, {
            "type": "workflow",
            "stage": "Finalizing output"
        })
        
        # Send feedback token? Or just as a complete feedback event. The user didn't ask to stream feedback but we can send it.
        await task_manager.put_event(task_id, {
            "type": "feedback",
            "data": feedback
        })
        
        # COMPLETE
        await task_manager.put_event(task_id, {
            "type": "complete"
        })
        
    except asyncio.CancelledError:
        pass # Handle cancellation gracefully
    except Exception as e:
        import traceback
        traceback.print_exc()
        await task_manager.put_event(task_id, {
            "type": "error",
            "message": str(e)
        })
        await task_manager.put_event(task_id, {
            "type": "complete"
        })
