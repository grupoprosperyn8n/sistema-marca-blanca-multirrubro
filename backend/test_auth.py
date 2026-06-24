"""
backend/test_auth.py — Smoke test local para endpoints auth.
Ejecutar desde raiz del proyecto: cd backend && python test_auth.py
⚠️  NUNCA imprime tokens, passwords ni hashes completos.
"""
import sys, os, json, urllib.request, urllib.error, http.cookiejar
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BACKEND_DIR.parent
sys.path.insert(0, str(BACKEND_DIR))

# ── Load .env (same as main.py) ──
_ENV_DATA = {}
for _EP in [PROJECT_DIR / ".env", BACKEND_DIR / ".env"]:
    if _EP.exists():
        for line in open(_EP):
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                v = v.strip().strip("'").strip('"')
                k = k.strip()
                if v.startswith("***[") and v.endswith("]]"):
                    continue
                os.environ[k] = v

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

class AuthSession:
    def __init__(self):
        self.cj = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(
            urllib.request.HTTPCookieProcessor(self.cj)
        )
    def _req(self, method, path, body=None):
        url = f"{BACKEND_URL}{path}"
        data = None
        if body:
            data = json.dumps(body).encode("utf-8")
        req = urllib.request.Request(url, data=data, method=method)
        req.add_header("Content-Type", "application/json")
        req.add_header("Accept", "application/json")
        try:
            with self.opener.open(req, timeout=10) as resp:
                return resp.status, json.loads(resp.read().decode())
        except urllib.error.HTTPError as e:
            body_text = e.read().decode()
            try:
                return e.code, json.loads(body_text)
            except:
                return e.code, {"detail": body_text[:200]}
    def get(self, path):
        return self._req("GET", path)
    def post(self, path, body=None):
        return self._req("POST", path, body)

def _redact(s, show=2):
    if not s:
        return "[empty]"
    s = str(s)
    if len(s) <= show + 3:
        return "[redacted]"
    return f"{s[:show]}*** ({len(s)} chars)"

def main():
    print("=" * 60)
    print("  SMOKE TEST — Auth Backend Core")
    print("=" * 60)
    failures = 0

    # 0. Import check
    print("\n── 0. Import check ──")
    try:
        from airtable_adapter import AirtableClient
        from auth.security import check_jwt_configured, get_cookie_config
        from auth.routes import router as auth_router
        print("  ✅ All modules import successfully")
    except Exception as e:
        print(f"  ❌ Import failed: {e}")
        sys.exit(1)

    # 1. JWT_SECRET check
    print("\n── 1. JWT_SECRET check ──")
    jwt_ok = check_jwt_configured()
    if jwt_ok:
        print("  ✅ JWT_SECRET configured")
    else:
        print("  ⚠️  JWT_SECRET NOT configured — auth endpoints return 503")
        print("     Add JWT_SECRET to .env to enable login.")

    # 2. Cookie config
    print("\n── 2. Cookie config ──")
    cfg = get_cookie_config()
    print(f"  key={cfg['key']}, httponly={cfg['httponly']}, samesite={cfg['samesite']}")
    print(f"  secure={cfg['secure']}, max_age={cfg['max_age']}s, path={cfg['path']}")
    assert cfg["httponly"] == True
    assert cfg["key"] == "auth_token"
    print("  ✅ Cookie config valid")

    # 3. patch_record
    print("\n── 3. patch_record on AirtableClient ──")
    client = AirtableClient()
    assert hasattr(client, "patch_record"), "patch_record missing"
    assert callable(client.patch_record)
    print("  ✅ patch_record available")

    # 4. Airtable connectivity
    print("\n── 4. Airtable connectivity ──")
    try:
        tables = client.list_tables()
        print(f"  ✅ {len(tables)} tables accessible")
        usuarios = None
        for t in tables:
            if t.name == "USUARIOS":
                usuarios = t
                break
        if usuarios:
            print(f"  ✅ USUARIOS table found ({len(usuarios.fields)} fields)")
            auth_fields = [f.name for f in usuarios.fields if f.name in (
                "CONTRASENA_HASH", "INTENTOS_FALLIDOS", "BLOQUEADO_HASTA",
                "ULTIMO_LOGIN", "EMAIL_VERIFICADO", "CLIENTE", "EMAIL_LOGIN",
                "NOMBRE_USUARIO", "ROL"
            )]
            print(f"  Auth fields: {', '.join(auth_fields)}")
        else:
            print("  ❌ USUARIOS table NOT found")
            failures += 1
    except Exception as e:
        print(f"  ❌ Airtable error: {e}")
        failures += 1

    # 5. Health endpoint
    print("\n── 5. GET /health ──")
    session = AuthSession()
    try:
        status, data = session.get("/health")
        print(f"  Status: {status}")
        if status == 200:
            print(f"  ✅ Backend running: {data.get('status', 'unknown')}")
        else:
            print(f"  ⚠️  Backend may not be running")
    except urllib.error.URLError:
        print("  ⚠️  Cannot connect to backend. Start it with:")
        print("     cd backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000")
        print("  Skipping HTTP auth tests.")
        print(f"\n{'='*60}")
        print(f"  Result: SKIPPED (backend not running)")
        print(f"{'='*60}")
        return

    # 6. /api/auth/me without cookie
    print("\n── 6. GET /api/auth/me (no cookie) ──")
    status, data = session.get("/api/auth/me")
    print(f"  Status: {status}")
    assert status == 401, f"Expected 401, got {status}"
    print(f"  ✅ Returns 401: {data.get('detail', '')[:80]}")

    # 7. /api/auth/login without JWT_SECRET
    if not jwt_ok:
        print("\n── 7. POST /api/auth/login (no JWT_SECRET) ──")
        status, data = session.post("/api/auth/login", {
            "email": "test@example.com",
            "password": "test123",
        })
        print(f"  Status: {status}")
        assert status == 503, f"Expected 503, got {status}"
        print(f"  ✅ Returns 503: {data.get('detail', '')[:80]}")

    # 8. /api/auth/logout
    print("\n── 8. POST /api/auth/logout ──")
    s2 = AuthSession()
    status, data = s2.post("/api/auth/logout")
    print(f"  Status: {status}")
    assert status == 200, f"Expected 200, got {status}"
    print(f"  ✅ Logout works: {data}")

    # 9. Login fail (wrong password) — only if JWT configured
    if jwt_ok:
        print("\n── 9. Login fail test ──")
        try:
            records = client.list_records("USUARIOS", max_records=1,
                fields=["EMAIL_LOGIN", "INTENTOS_FALLIDOS"])
            if records:
                demo_email = records[0]["fields"].get("EMAIL_LOGIN", "")
                intentos_before = records[0]["fields"].get("INTENTOS_FALLIDOS", 0) or 0
                print(f"  Demo email: {_redact(demo_email, 3)}")
                print(f"  INTENTOS_FALLIDOS before: {intentos_before}")

                s3 = AuthSession()
                status, data = s3.post("/api/auth/login", {
                    "email": demo_email,
                    "password": "WRONG_PASSWORD_XYZ_123",
                })
                print(f"  Status: {status}")
                assert status == 401, f"Expected 401, got {status}"
                print("  ✅ Wrong password rejected")

                after = client.get_record("USUARIOS", records[0]["id"])
                intentos_after = after.get("fields", {}).get("INTENTOS_FALLIDOS", 0) or 0
                print(f"  INTENTOS_FALLIDOS after: {intentos_after}")
                if intentos_after == intentos_before + 1:
                    print("  ✅ INTENTOS_FALLIDOS incremented")
                else:
                    print(f"  ⚠️  Expected {intentos_before+1}, got {intentos_after}")
                    failures += 1

                # Reset
                client.patch_record("USUARIOS", records[0]["id"], {"INTENTOS_FALLIDOS": 0})
                print("  INTENTOS_FALLIDOS reset to 0")
            else:
                print("  ⚠️  No demo users found")
        except Exception as e:
            print(f"  ❌ Error: {e}")
            failures += 1

    # Result
    print(f"\n{'='*60}")
    if failures == 0:
        if jwt_ok:
            print("  ✅ ALL CHECKS PASSED")
        else:
            print("  ✅ ALL CHECKS PASSED (JWT_SECRET missing, login blocked)")
    else:
        print(f"  ⚠️  {failures} FAILURES")
    print(f"{'='*60}")
    return failures

if __name__ == "__main__":
    sys.exit(main() or 0)
