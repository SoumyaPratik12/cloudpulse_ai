import base64
import logging
from cryptography.fernet import Fernet
from config import settings

logger = logging.getLogger(__name__)

# Fallback encryption key if not provided or invalid
_DEFAULT_KEY = base64.urlsafe_b64encode(b"cloudpulse-fallback-key-32bytes!")

def get_fernet() -> Fernet:
    key_str = getattr(settings, "encryption_key", "")
    if not key_str:
        if settings.environment == "production":
            logger.warning("CRITICAL SECURITY WARNING: Using fallback encryption key in production environment! Set ENCRYPTION_KEY environment variable.")
        key_bytes = _DEFAULT_KEY
    else:
        try:
            # Fernet key must be 32 url-safe base64-encoded bytes
            key_bytes = key_str.encode("utf-8")
            Fernet(key_bytes)
        except Exception:
            logger.error("Invalid ENCRYPTION_KEY format. Falling back to default key.")
            key_bytes = _DEFAULT_KEY
            
    return Fernet(key_bytes)

def encrypt_secret(val: str) -> str:
    """Encrypt a secret string to ciphertext."""
    if not val:
        return val
    f = get_fernet()
    return f.encrypt(val.encode("utf-8")).decode("utf-8")

def decrypt_secret(cipher: str) -> str:
    """Decrypt ciphertext back to a secret string."""
    if not cipher:
        return cipher
    f = get_fernet()
    try:
        return f.decrypt(cipher.encode("utf-8")).decode("utf-8")
    except Exception as e:
        logger.error(f"Failed to decrypt secret: {str(e)}")
        # If decryption fails, return original cipher
        return cipher
