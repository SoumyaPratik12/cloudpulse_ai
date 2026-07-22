import time
import logging
from functools import wraps
from typing import Any, Dict, Tuple

logger = logging.getLogger(__name__)

# Simple in-memory cache dictionary storing: key -> (value, expire_timestamp)
_cache: Dict[str, Tuple[Any, float]] = {}

def cache_aws_metrics(ttl_seconds: int = 60):
    """Decorator to cache CloudWatch / AWS Config API calls and responses to prevent rate-limit throttling."""
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            # Construct a unique cache key based on function name and args/kwargs
            key_parts = [func.__name__]
            for arg in args:
                key_parts.append(str(arg))
            for k, v in sorted(kwargs.items()):
                # Exclude db Session objects or requests contexts from the cache key
                if k in ["db", "request", "background_tasks"]:
                    continue
                key_parts.append(f"{k}:{v}")
            
            cache_key = ":".join(key_parts)
            now = time.time()
            
            # Check cache hit
            if cache_key in _cache:
                val, expires = _cache[cache_key]
                if now < expires:
                    logger.info(f"Cache Hit: Returning cached AWS telemetry for key '{cache_key}' (expires in {int(expires - now)}s)")
                    return val
                else:
                    logger.info(f"Cache Expired: Evicting cache key '{cache_key}'")
                    del _cache[cache_key]
            
            # Execute original function (awaiting since it is async)
            result = await func(*args, **kwargs)
            
            # Store in cache
            _cache[cache_key] = (result, now + ttl_seconds)
            logger.info(f"Cache Store: Cached new telemetry data for key '{cache_key}' with TTL {ttl_seconds}s")
            return result
            
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            key_parts = [func.__name__]
            for arg in args:
                key_parts.append(str(arg))
            for k, v in sorted(kwargs.items()):
                if k in ["db", "request", "background_tasks"]:
                    continue
                key_parts.append(f"{k}:{v}")
                
            cache_key = ":".join(key_parts)
            now = time.time()
            
            if cache_key in _cache:
                val, expires = _cache[cache_key]
                if now < expires:
                    logger.info(f"Cache Hit (Sync): Returning cached AWS telemetry for key '{cache_key}' (expires in {int(expires - now)}s)")
                    return val
                else:
                    del _cache[cache_key]
            
            result = func(*args, **kwargs)
            _cache[cache_key] = (result, now + ttl_seconds)
            return result

        import inspect
        return async_wrapper if inspect.iscoroutinefunction(func) else sync_wrapper
    return decorator

def clear_metrics_cache():
    """Clear all cached AWS metrics data."""
    global _cache
    _cache.clear()
    logger.info("Cleared all cached AWS telemetry metrics.")
