# tokens

def TokenError(Exception):
    pass

def ExpiredTokenError(TokenError):
    pass

def InvalidTokenError(TokenError):
    pass

def InvalidTokenTypeError(TokenError):
    pass