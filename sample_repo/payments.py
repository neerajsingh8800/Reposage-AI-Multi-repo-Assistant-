"""Payment processing utilities for the checkout service."""
import logging
from decimal import Decimal
from utils import validate_amount

logger = logging.getLogger(__name__)

class PaymentError(Exception):
    """Raised when a payment cannot be processed."""
    pass

class PaymentProcessor:
    """Handles charging customers and issuing refunds."""
    def __init__(self, gateway_client):
        self.gateway_client = gateway_client

    def process_payment(self, amount: Decimal, customer_id: str) -> dict:
        """Charge a customer for the given amount."""
        validate_amount(amount)
        result = self.gateway_client.charge(customer_id, amount)
        logger.info("Charged %s to customer %s", amount, customer_id)
        return {"status": "success", "transaction_id": result.id}

    def refund_payment(self, transaction_id: str) -> dict:
        """Refund a previously processed payment."""
        result = self.gateway_client.refund(transaction_id)
        return {"status": "refunded", "transaction_id": transaction_id}
