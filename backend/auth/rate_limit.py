"""
backend/auth/rate_limit.py — Simple in-memory rate limiter for login.
No external dependencies. 5 attempts per 15 minutes per IP+email.
"""
import time
import threading

_WINDOW_SECONDS = 15 * 60  # 15 minutes
_MAX_ATTEMPTS = 5
_lock = threading.Lock()
_attempts: dict[str, dict] = {}  # {"ip:email": {"count": int, "window_start": float}}

def check_rate_limit(ip: str, email: str) -> int:
    """
    Check rate limit for ip + email.
    Returns remaining attempts (>0 = ok, 0 = limit reached).
    Side effect: increments counter if limit not reached.
    """
    key = f"{ip}:{email.lower().strip()}"
    now = time.monotonic()

    with _lock:
        # Clean expired entries (lazy cleanup)
        expired = [k for k, v in _attempts.items()
                   if now - v["window_start"] > _WINDOW_SECONDS]
        for k in expired:
            del _attempts[k]

        entry = _attempts.get(key)
        if entry is None:
            # First attempt in window
            _attempts[key] = {"count": 1, "window_start": now}
            return _MAX_ATTEMPTS - 1

        elapsed = now - entry["window_start"]
        if elapsed > _WINDOW_SECONDS:
            # Window expired, reset
            _attempts[key] = {"count": 1, "window_start": now}
            return _MAX_ATTEMPTS - 1

        if entry["count"] >= _MAX_ATTEMPTS:
            return 0  # Rate limited

        entry["count"] += 1
        remaining = _MAX_ATTEMPTS - entry["count"]
        return max(remaining, 0)

def get_remaining(ip: str, email: str) -> int:
    """Get remaining attempts without incrementing (diagnostic)."""
    key = f"{ip}:{email.lower().strip()}"
    now = time.monotonic()
    with _lock:
        entry = _attempts.get(key)
        if entry is None:
            return _MAX_ATTEMPTS
        if now - entry["window_start"] > _WINDOW_SECONDS:
            return _MAX_ATTEMPTS
        return max(_MAX_ATTEMPTS - entry["count"], 0)
