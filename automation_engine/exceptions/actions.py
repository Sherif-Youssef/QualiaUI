class RequestFinishedException(Exception):
    def __init__(self, message: str = "The request has already been finished."):
        super().__init__(message)
        self.message = message