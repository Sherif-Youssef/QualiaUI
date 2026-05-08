import logging

from automation_engine.pipeline.context import IterationContext, IterationStatus
from automation_engine.planning import PageSnapshot
from automation_engine.serialization import get_js_serializer_api_code, PageState, DOMElement, DOMIndex

logger = logging.getLogger(__name__)


class ObserveStep:
    name = "observe"

    def __init__(self, use_screenshot: bool = False):
        self.use_screenshot = use_screenshot

    async def run(self, ctx: IterationContext) -> IterationContext:
        browser = ctx.browser

        await ctx.browser.page.wait_for_load_state("domcontentloaded")
        await ctx.browser.page.wait_for_load_state("load")
        await ctx.browser.page.wait_for_timeout(500)

        raw: dict = await browser.evaluate_js(code=get_js_serializer_api_code())
        root = DOMElement(**raw)
        index = DOMIndex(root)

        state = PageState(
            current_url=browser.url,
            page_title=await browser.title(),
            viewport_width=browser.viewport_width,
            viewport_height=browser.viewport_height,
            root=root,
            screenshot=(
                await browser.screenshot() if self.use_screenshot else None
            ),
        )

        ctx.snapshot = PageSnapshot(state=state, index=index)

        logger.debug(
            f"Snapshot: url={state.current_url} "
            f"elements={len(index)} "
            f"interactive={len(index.interactive_elements)}"
        )
        return ctx
