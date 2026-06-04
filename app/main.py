from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app.api.reports import router as reports_router
from app.api.sessions import router as sessions_router
from app.api.verifications import router as verifications_router

BASE_DIR = Path(__file__).resolve().parent
APP_VERSION = "v39-split-misc-actions"

Device = Literal["host", "contractor", "explainer"]
Step = Literal[
    "start",
    "create",
    "upload",
    "lock",
    "invite",
    "waiting",
    "identity",
    "consent",
    "recording",
    "processing",
    "report",
    "addendum",
    "verify",
    "failure",
    "invite-code",
    "participant-consent",
    "participant-ready",
    "participant-recording",
    "participant-done",
]
Mode = Literal["user", "judge"]

app = FastAPI(title=f"Contract Mirror UI {APP_VERSION}")
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

app.include_router(sessions_router)
app.include_router(reports_router)
app.include_router(verifications_router)


@app.exception_handler(HTTPException)
async def api_http_exception_handler(request: Request, exc: HTTPException):
    if request.url.path.startswith('/api/'):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                'ok': False,
                'error': {
                    'code': 'HTTP_ERROR',
                    'message': str(exc.detail),
                },
            },
        )
    return JSONResponse(status_code=exc.status_code, content={'detail': exc.detail})


def render(
    request: Request,
    *,
    device: Device = "host",
    step: Step = "start",
    mode: Mode = "user",
) -> HTMLResponse:
    """Render the single-page UI with route-specific boot state."""
    return templates.TemplateResponse(
        request,
        "index.html",
        {
            "request": request,
            "app_version": APP_VERSION,
            "initial_device": device,
            "initial_step": step,
            "initial_mode": mode,
        },
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "version": APP_VERSION}


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


@app.get("/report/{session_id}", response_class=HTMLResponse)
def report_detail(request: Request, session_id: str):
    return render(request, step="report", mode="user")


@app.get("/verify/{report_id}", response_class=HTMLResponse)
def verify_report(request: Request, report_id: str):
    return render(request, step="verify", mode="user")


@app.get("/addendum/{session_id}", response_class=HTMLResponse)
def addendum_detail(request: Request, session_id: str):
    return render(request, step="addendum", mode="user")


# Previous-version URL fallbacks: keep old demo links from breaking.
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
