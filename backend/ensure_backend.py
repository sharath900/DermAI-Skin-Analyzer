import http.client
import socket
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
VENV_DIR = ROOT / ".venv"
PYTHON_EXE = VENV_DIR / "Scripts" / "python.exe"
REQUIREMENTS = ROOT / "requirements.txt"
HOST = "127.0.0.1"
PORT = 8000


def port_is_listening(host: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.5)
        try:
            sock.connect((host, port))
            return True
        except OSError:
            return False


def backend_is_healthy(host: str, port: int) -> bool:
    conn = http.client.HTTPConnection(host, port, timeout=2)
    try:
        conn.request("GET", "/")
        response = conn.getresponse()
        payload = response.read(2000).decode("utf-8", errors="ignore")
        return response.status == 200 and "Derm AI API" in payload
    except Exception:
        return False
    finally:
        conn.close()


def ensure_virtualenv() -> None:
    if not PYTHON_EXE.exists():
        subprocess.run([sys.executable, "-m", "venv", str(VENV_DIR)], check=True)
    subprocess.run([str(PYTHON_EXE), "-m", "pip", "install", "--upgrade", "pip"], check=False)
    subprocess.run([str(PYTHON_EXE), "-m", "pip", "install", "-r", str(REQUIREMENTS)], check=False)


def main() -> int:
    if port_is_listening(HOST, PORT):
        if backend_is_healthy(HOST, PORT):
            print(f"Backend is already running at http://{HOST}:{PORT}")
            return 0
        print(f"Port {PORT} is already in use, but it is not the DermAI API. Exiting without starting a duplicate server.")
        return 0

    ensure_virtualenv()
    subprocess.run(
        [
            str(PYTHON_EXE),
            "-m",
            "uvicorn",
            "app.main:app",
            "--host",
            HOST,
            "--port",
            str(PORT),
            "--reload",
        ],
        cwd=str(ROOT),
        check=False,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
