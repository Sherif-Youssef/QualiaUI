import pathlib
from dataclasses import dataclass
from typing import Callable, Awaitable
from playwright.async_api import Page

@dataclass
class EvalTask:
    id: str
    url: str
    instruction: str
    oracle: Callable[[Page], Awaitable[bool]]


# --- Todo Oracles ---
async def check_todo_added(page: Page) -> bool:
    items = await page.locator('.todo-text').all_text_contents()
    return "Buy milk" in items

async def check_todo_deleted(page: Page) -> bool:
    items = await page.locator('.todo-text').all_text_contents()
    return "Learn Playwright" not in items

# --- Form Oracles ---
async def check_text_submitted(page: Page) -> bool:
    text = await page.locator('#text-result').text_content()
    return text == "Username: AgentSmith"

async def check_select_submitted(page: Page) -> bool:
    text = await page.locator('#select-result').text_content()
    return text == "Country: CA"

async def check_radio_submitted(page: Page) -> bool:
    text = await page.locator('#radio-result').text_content()
    return text == "Contact: phone"

async def check_checkbox_submitted(page: Page) -> bool:
    text = await page.locator('#checkbox-result').text_content()
    return text == "Features: A B"

async def check_hover_submitted(page: Page) -> bool:
    text = await page.locator('#hover-result').text_content()
    return text == "Action 2 Clicked"

# --- Advanced Oracles ---
async def check_drag_dropped(page: Page) -> bool:
    text = await page.locator('#drag-result').text_content()
    return text == "Item Dropped Successfully"

async def check_keyboard_pressed(page: Page) -> bool:
    text = await page.locator('#keyboard-result').text_content()
    return text == "Searched: Hello"

async def check_delayed_clicked(page: Page) -> bool:
    text = await page.locator('#delay-result').text_content()
    return text == "Delayed Button Clicked"


# Resolve local paths to absolute file:// URLs
APPS_DIR = pathlib.Path(__file__).parent / "apps"
TODO_APP_URL = f"file://{APPS_DIR / 'todo.html'}"
FORM_APP_URL = f"file://{APPS_DIR / 'form.html'}"
ADVANCED_APP_URL = f"file://{APPS_DIR / 'advanced.html'}"


# Registry of tasks
EVAL_TASKS = [
    EvalTask(
        id="todo_add_01",
        url=TODO_APP_URL,
        instruction="Add a new todo item saying 'Buy milk'.",
        oracle=check_todo_added
    ),
    EvalTask(
        id="todo_delete_01",
        url=TODO_APP_URL,
        instruction="Delete the todo item 'Learn Playwright'.",
        oracle=check_todo_deleted
    ),
    EvalTask(
        id="form_fill_text",
        url=FORM_APP_URL,
        instruction="Enter 'AgentSmith' into the username field and click 'Submit Name'.",
        oracle=check_text_submitted
    ),
    EvalTask(
        id="form_select_dropdown",
        url=FORM_APP_URL,
        instruction="Select 'Canada' from the country dropdown and click 'Submit Country'.",
        oracle=check_select_submitted
    ),
    EvalTask(
        id="form_radio_button",
        url=FORM_APP_URL,
        instruction="Select the 'Phone' contact radio button and click 'Submit Preference'.",
        oracle=check_radio_submitted
    ),
    EvalTask(
        id="form_checkboxes",
        url=FORM_APP_URL,
        instruction="Check both 'Feature A' and 'Feature B' checkboxes, then click 'Submit Features'.",
        oracle=check_checkbox_submitted
    ),
    EvalTask(
        id="form_hover_menu",
        url=FORM_APP_URL,
        instruction="Hover over the 'Hover Me!' button to reveal the dropdown, then click 'Action 2'.",
        oracle=check_hover_submitted
    ),
    EvalTask(
        id="adv_drag_drop",
        url=ADVANCED_APP_URL,
        instruction="Drag the 'Drag Me!' item and drop it into the 'Drop Here' zone.",
        oracle=check_drag_dropped
    ),
    EvalTask(
        id="adv_keyboard_enter",
        url=ADVANCED_APP_URL,
        instruction="Type 'Hello' into the search input and press the Enter key.",
        oracle=check_keyboard_pressed
    ),
    EvalTask(
        id="adv_delayed_element",
        url=ADVANCED_APP_URL,
        instruction="Wait for the 'Click Me Now' button to appear, then click it.",
        oracle=check_delayed_clicked
    ),
]
