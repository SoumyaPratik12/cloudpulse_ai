import base64
import requests
import logging
from urllib.parse import urlparse
from config import settings

logger = logging.getLogger(__name__)

# Keys required in the signature verification process depending on message type
SIGNING_KEYS_NOTIFICATION = [
    "Message",
    "MessageId",
    "Subject",
    "SubscribeURL",
    "Timestamp",
    "TopicArn",
    "Type"
]

def check_cert_url(url: str) -> bool:
    """Ensure the certificate URL is a valid, secure AWS Amazon domain."""
    try:
        parsed = urlparse(url)
        if parsed.scheme != "https":
            return False
        # Host name must end with .amazonaws.com
        if not parsed.netloc.endswith(".amazonaws.com"):
            return False
        return True
    except Exception:
        return False

def get_canonical_string(data: dict) -> bytes:
    """Build the canonical string to sign from the SNS message payload."""
    msg_type = data.get("Type")
    canonical = []
    
    # Selection of fields in the canonical string changes depending on message type
    if msg_type in ["SubscriptionConfirmation", "UnsubscribeConfirmation"]:
        keys = ["Message", "MessageId", "SubscribeURL", "Timestamp", "Token", "TopicArn", "Type"]
    else:
        keys = ["Message", "MessageId", "Subject", "Timestamp", "TopicArn", "Type"]
        
    for k in keys:
        if k in data:
            canonical.append(f"{k}\n{data[k]}\n")
            
    return "".join(canonical).encode("utf-8")

def verify_sns_signature(payload: dict) -> bool:
    """Verify Amazon SNS message signature authenticity."""
    if settings.environment == "development":
        logger.info("Development Mode active: Bypassing real SNS certificate signature verification.")
        return True

    # 1. Basic validation of cert URL
    cert_url = payload.get("SigningCertURL")
    if not cert_url or not check_cert_url(cert_url):
        logger.error(f"Rejected insecure or invalid SigningCertURL: {cert_url}")
        return False

    # 2. Extract signature and verify keys
    signature_b64 = payload.get("Signature")
    if not signature_b64:
        logger.error("Signature missing from SNS payload")
        return False

    try:
        # Retrieve certificate from secure AWS URL cache/endpoint
        res = requests.get(cert_url, timeout=5)
        if res.status_code != 200:
            logger.error("Failed to retrieve SNS signing certificate")
            return False
            
        cert_pem = res.text
        
        # Load cryptography library
        from cryptography import x509
        from cryptography.hazmat.backends import default_backend
        from cryptography.hazmat.primitives.asymmetric import padding
        from cryptography.hazmat.primitives import hashes
        
        # Load certificate public key
        cert = x509.load_pem_x509_certificate(cert_pem.encode("utf-8"), default_backend())
        public_key = cert.public_key()
        
        # Build canonical bytes
        canonical_bytes = get_canonical_string(payload)
        signature_bytes = base64.b64decode(signature_b64)
        
        # Verify signature using SHA1 (SNS uses SHA1withRSA signature)
        public_key.verify(
            signature_bytes,
            canonical_bytes,
            padding.PKCS1v15(),
            hashes.SHA1()
        )
        return True
    except Exception as e:
        logger.error(f"SNS message signature verification failed: {str(e)}")
        return False
