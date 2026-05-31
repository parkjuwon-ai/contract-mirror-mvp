from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
app = FastAPI(title="Contract Mirror UI v5")
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))


def render(request: Request, *, device: str = "host", step: str = "start", mode: str = "user"):
    return templates.TemplateResponse(
        request,
        "index.html",
        {
            "request": request,
            "initial_device": device,
            "initial_step": step,
            "initial_mode": mode,
        },
    )


@app.get("/", response_class=HTMLResponse)
def index(request: Request):
    return render(request, mode="user")


@app.get("/judge", response_class=HTMLResponse)
def judge(request: Request):
    return render(request, mode="judge")


@app.get("/participant/contractor", response_class=HTMLResponse)
def participant_contractor(request: Request):
    return render(request, device="contractor", step="identity", mode="user")


@app.get("/participant/explainer", response_class=HTMLResponse)
def participant_explainer(request: Request):
    return render(request, device="explainer", step="identity", mode="user")


# 이전 버전 URL fallback: 기존 주소로 접속해도 새 UI가 뜨도록 유지
@app.get("/auth", response_class=HTMLResponse)
def legacy_auth(request: Request):
    return render(request, mode="user")


@app.get("/consent", response_class=HTMLResponse)
def legacy_consent(request: Request):
    return render(request, step="waiting", mode="user")


@app.get("/session", response_class=HTMLResponse)
def legacy_session(request: Request):
    return render(request, step="waiting", mode="user")


@app.get("/sessions/{session_id}", response_class=HTMLResponse)
def legacy_session_detail(request: Request, session_id: str):
    return render(request, step="waiting", mode="user")


@app.get("/verify/{report_id}", response_class=HTMLResponse)
def verify_report(request: Request, report_id: str):
    return render(request, step="verify", mode="user")
