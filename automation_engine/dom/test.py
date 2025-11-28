from playwright.sync_api import sync_playwright
from automation_engine.dom.utils import get_js_serializer_file_path
from automation_engine.models import DOMElement


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        # print(get_js_serializer_file_path())
        context.add_init_script(path=get_js_serializer_file_path())
        page = context.new_page()
        page.goto("https://www.saucedemo.com/")
        # for _ in range(10):
        # print(_)
        # page.evaluate("window.getSimplifiedDOMInJSON()")
        result: dict = page.evaluate("window.getSimplifiedDOMInJSON()")
        # print(result)
        print(DOMElement(**result).to_llm_string(verbosity="full"))


if __name__ == "__main__":
    main()