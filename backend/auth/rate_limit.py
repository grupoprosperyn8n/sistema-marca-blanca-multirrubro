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

# ── Generic rate-limit helpers ────────────────
def _check_limit(ip: str, bucket: str, max_attempts: int, window_seconds: int) -> int:
    """Generic rate limit check. Returns remaining attempts."""
    key = f"{bucket}:{ip}"
    now = time.monotonic()

    with _lock:
        # Clean expired
        expired = [k for k, v in _attempts.items()
                   if now - v["window_start"] > window_seconds]
        for k in expired:
            del _attempts[k]

        entry = _attempts.get(key)
        if entry is None:
            _attempts[key] = {"count": 1, "window_start": now}
            return max_attempts - 1

        elapsed = now - entry["window_start"]
        if elapsed > window_seconds:
            _attempts[key] = {"count": 1, "window_start": now}
            return max_attempts - 1

        if entry["count"] >= max_attempts:
            return 0

        entry["count"] += 1
        return max(max_attempts - entry["count"], 0)


def check_register_limit(ip: str) -> int:
    """Rate limit for registration: 3 per 15 min per IP."""
    return _check_limit(ip, "register", max_attempts=3, window_seconds=15*60)


def check_forgot_password_limit(ip: str) -> int:
    """Rate limit for forgot-password: 3 per 15 min per IP."""
    return _check_limit(ip, "forgot-pw", max_attempts=3, window_seconds=15*60)


def check_reset_password_limit(ip: str) -> int:
    """Rate limit for reset-password: 5 per 15 min per IP."""
    return _check_limit(ip, "reset-pw", max_attempts=5, window_seconds=15*60)
