# tokens

class TokenError(Exception):
    pass

class ExpiredTokenError(TokenError):
    pass

class InvalidTokenError(TokenError):
    pass

class InvalidTokenTypeError(TokenError):
    pass
