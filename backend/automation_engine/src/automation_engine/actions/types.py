from enum import StrEnum


class Termination(StrEnum):
    COMPLETE = "complete"
    FAIL = "fail"


class Interaction(StrEnum):
    WAIT = "wait"
    CLICK = "click"
    FILL = "fill"
    HOVER = "hover"
    SELECT = "select_option"
    PRESS = "press"
    RELOAD = "reload_page"
    NAVIGATE = "navigate"
    DRAG_DROP = "drag_drop"
    UPLOAD = "upload_file"
    EXECUTE_JS = "execute_js_code"


class Misc(StrEnum):
    VALIDATE = "validate"
