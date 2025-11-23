from pathlib import Path

INTERACTIVE_TAGS = {
    "a",
    "button",
    "input",
    "select",
    "textarea",
    "summary",
    "optgroup",
    "details",
    "option",
    "form",
}
SEMANTIC_TAGS = {
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "nav",
    "main",
    "header",
    "footer",
    "article",
    "section",
    "p",
    "span",
    "div",
    "ul",
    "ol",
    "li",
    "label",
    "img",
}
IMPORTANT_EVENTS = {
    "click",
    "mousedown",
    "mouseup",
    "change", 
    "input",
    "keydown",
    "keyup",
    "keypress"
}
INTERACTIVE_ROLES = {
    "button",
    "link",
    "menuitem",
    "option",
    "radio",
    "checkbox",
    "tab",
    "textbox",
    "combobox",
    "slider",
    "spinbutton",
    "listbox",
    "search",
    "searchbox",
}
KEY_ATTRIBUTES = {
    "id",
    "name",
    "type",
    "href",
    "src",
    "placeholder",
    "aria-label",
    "aria-describedby",
    "value",
    "alt",
    "disabled",
    "required",
    "checked"
}
    

def get_js_serializer_file_path() -> str:
    return str(Path(__file__).parent.resolve() / "dom_serializer.js")