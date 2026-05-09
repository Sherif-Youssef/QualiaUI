import asyncio
from pathlib import Path
from playwright.async_api import Page


async def wait_for_network_idle(
    page: Page,
    poll_interval: float = 0.3,
    loop_until_idle: bool = False,
    timeout: float = 15.0
) -> None:
    """
    Waits for page stability
    """
    js_code = (Path(__file__).parent / "js" / "network_idle.js").read_text()
    start_time = asyncio.get_event_loop().time()
    
    try:
        client = await page.context.new_cdp_session(page)
    except Exception as e:
        print(f"Could not create CDP session: {e}")
        return

    try:
        while True:
            elapsed = asyncio.get_event_loop().time() - start_time
            if elapsed > timeout:
                break

            try:
                result = await asyncio.wait_for(
                    client.send("Runtime.evaluate", {
                        "expression": js_code,
                        "returnByValue": True
                    }), 
                    timeout=2.0
                )

                # CDP returns values nested in result.value
                data = result.get("result", {}).get("value", {})
                if not data:
                    break

                pending_requests = data.get("pending_requests", [])
                is_loading = data.get("document_loading", False)
                
                if not pending_requests and not is_loading:
                    break
                    
                await asyncio.sleep(poll_interval)
                
                if not loop_until_idle:
                    break
                
            except TimeoutError:
                break
            except Exception as e:
                break
    finally:
        try:
            await client.detach()
        except:
            pass
