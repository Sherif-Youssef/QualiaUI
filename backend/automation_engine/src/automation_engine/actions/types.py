from enum import StrEnum


class Termination(StrEnum):
    COMPLETE = "complete"
    FAIL = "fail"


class Interaction(StrEnum):
    WAITING = "wait"
    CLICK = "click"
    FILL = "fill"
    HOVER = "hover"
    SELECT = "select_option"
    PRESS = "press"
    NAVIGATE = "navigate"
    SCROLL = "scroll"
    DRAG_DROP = "drag_drop"
    UPLOAD = "upload_file"
    EXECUTE_JS = "execute_js_code"


class Assertion(StrEnum):
    STATE = "assert_state"
    TEXT = "assert_text"
    TEXT_REGEX = "assert_text_regex"
    CHECKED = "assert_checked"
    URL = "assert_url"
    ELEMENT_COUNT = "assert_element_count"
    JS_EVAL = "assert_js_eval"
