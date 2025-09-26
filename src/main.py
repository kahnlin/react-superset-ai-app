# main.py — FastAPI 伺服器，用來簽發 Superset guest token

from fastapi import FastAPI
from pydantic import BaseModel
import time, jwt
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS 設定 — 允許 React 網站從 localhost:5173 呼叫
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 機密設定 — 必須與 superset_config.py 一致
JWT_SECRET = "your-very-strong-secret"
JWT_AUDIENCE = "superset"

class TokenRequest(BaseModel):
    dashboard_id: str
    username: str

@app.post("/superset/guest_token")
def get_token(req: TokenRequest):
    now = int(time.time())
    payload = {
        "iat": now,
        "exp": now + 3600,
        "aud": JWT_AUDIENCE,
        "type": "guest",
        "user": {
            "username": req.username,
            "first_name": req.username,
            "last_name": "",
        },
        "resources": [
            {"type": "dashboard", "id": req.dashboard_id}
        ],
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    return {"token": token}
