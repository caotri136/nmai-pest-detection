# nmai-pest-detection

Rice pest detection demo with:
- A **Next.js** UI for uploading an image and viewing predictions
- A **FastAPI** backend that loads a **ResNet50** model and returns predicted class + confidence

## Project structure
- `app/`: Next.js App Router UI
- `backend/`: FastAPI service (`backend/main.py`)
- `share.bat` / `scripts/share.ps1`: helper for exposing local ports via `localhost.run` (writes logs to `.tunnels/`)
- `requirements.txt`: Python dependencies for the backend

## Labels (classes)
- `pest-big`
- `round-pest`
- `thin_pest`

## Quick start (local)
Frontend (Next.js):

```bash
npm install
npm run dev
```

Backend (FastAPI):

```bash
python -m pip install -r requirements.txt
cd backend
python main.py
```

Or run both (two processes):

```bash
npm run dev:all
```

## Configuration
Frontend calls the backend using `NEXT_PUBLIC_API_BASE_URL`:

- Create `.env.local` in the repo root:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Backend CORS:
- `FRONTEND_ORIGIN`: comma-separated origins (default: `http://localhost:3000`)
- `FRONTEND_ORIGIN_REGEX`: regex allowlist (default allows `https://*.lhr.life`)

## API
- `POST /predict`
  - form field: `file` (JPG/PNG)
  - returns `status` + `data` including `id`, `name_vi`, `confidence`, and details from `backend/pest_data.py`

## Model file
Backend expects the model weights at:
- `backend/pest_resnet50.pth`

If the file is missing, the backend still starts but will print a warning and cannot predict correctly.

## Sharing (optional)
Run `share.bat` to start backend + frontend and create `localhost.run` tunnels. Logs and links are written under `.tunnels/`.
