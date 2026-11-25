# DermAI

DermAI is a research prototype for skin-lesion image classification. It is not
a medical diagnostic tool.

## Requirements

- Python 3.10 or newer
- Node.js and npm
- The trained model at `backend/ml_models/best_model.pth`

## Start both services in VS Code

Open the `DEARMAISKIN` project folder in VS Code. The **Run DermAI app** task
starts the frontend and backend when the folder opens. On first use, allow
automatic tasks when VS Code prompts you. You can also start it manually using
**Terminal > Run Task > Run DermAI app**. Keep both task terminals running
while using the app; if the API is unavailable, account creation cannot reach
the server.

## Run the backend (Windows PowerShell)

The project now auto-creates the backend virtual environment and installs its
requirements the first time it starts. It also refuses to launch a duplicate
server if the API port is already in use.

```powershell
cd backend
python ensure_backend.py
```

If you prefer a manual setup, the equivalent commands are:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

In VS Code, select `backend/.venv/Scripts/python.exe` as the Python
interpreter after creating the environment.

The API is available at <http://127.0.0.1:8000>; interactive API docs are at
<http://127.0.0.1:8000/docs>.

## Run the frontend

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal (normally
<http://localhost:5173>). The frontend uses `http://127.0.0.1:8000` by default;
set `VITE_API_URL` if the backend is hosted elsewhere.
