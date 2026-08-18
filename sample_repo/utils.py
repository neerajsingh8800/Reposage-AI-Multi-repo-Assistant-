"""Shared validation helpers."""
from decimal import Decimal

def validate_amount(amount: Decimal) -> None:
    """Raise ValueError if amount is not positive."""
    if amount <= 0:
        raise ValueError("Amount must be positive")

def format_currency(amount: Decimal, currency: str = "USD") -> str:
    """Format an amount as a currency string."""
    return f"{currency} {amount:.2f}"
