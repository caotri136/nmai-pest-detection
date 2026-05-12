# Rice Pest Detection System (Web Demo)

## Overview
- Frontend demo for rice pest detection using image upload.
- Labels: pest-big (Sau lon), round-pest (Sau tron), thin_pest (Sau dai).
- Sends the image to backend endpoint POST /predict and shows label + confidence.

## Setup (One Command)
- Install frontend deps: `npm install`
- Install backend deps: `python -m pip install -r backend/requirements.txt`
- Start both services: `npm run dev:all`

If PowerShell blocks npm scripts, use:
- `d:\nodejs\npm.cmd install`
- `d:\nodejs\npm.cmd run dev:all`

If Python is not on PATH, install Python 3.10+ and reopen your terminal.

## Scripts
- Frontend only: `npm run dev`
- Backend only: `npm run dev:backend`
- Both: `npm run dev:all`

## Environment
- Create `.env.local` at the project root and set:
  - `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`

## Backend
- Location: `backend/`
- Default port: `8000`

## API Contract
- Endpoint: `POST /predict`
- Form field: `file`
- Response example:
  - `{ "label": "round-pest", "confidence": 0.98 }`

## CORS (Backend)
The backend allows `http://localhost:3000` by default.
Override via env var `FRONTEND_ORIGIN` when needed.

FastAPI:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Flask:
```python
from flask_cors import CORS

CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})
```

Express:
```js
import cors from "cors";

app.use(cors({ origin: "http://localhost:3000" }));
```
