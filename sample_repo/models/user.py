"""User model."""

class User:
    """Represents a customer."""
    def __init__(self, user_id: str, email: str):
        self.user_id = user_id
        self.email = email

    def display_name(self) -> str:
        return self.email.split("@")[0]
