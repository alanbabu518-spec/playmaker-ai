import logging
import re
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.core.config import settings
from app.core.db import pool
from app.core.logging import request_id_var, setup_logging

setup_logging(settings.log_level, settings.log_json)
log = logging.getLogger("app.request")

SAFE_REQUEST_ID = re.compile(r"^[A-Za-z0-9._-]{8,64}$")


@asynccontextmanager
async def lifespan(app: FastAPI):
    pool.open(wait=True, timeout=15)  # fail at startup if the database is unreachable
    yield
    pool.close()


app = FastAPI(
    title="Playmaker AI",
    description="Football questions answered from Wikipedia, with cited sources.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
    expose_headers=["X-Request-ID", "Retry-After"],  # lets the browser frontend read these
)


# Added after CORS, so it is the outermost layer and sees every request.
@app.middleware("http")
async def request_context(request: Request, call_next):
    incoming = request.headers.get("x-request-id", "")
    rid = incoming if SAFE_REQUEST_ID.match(incoming) else uuid.uuid4().hex
    token = request_id_var.set(rid)
    start = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        log.exception("request_crashed", extra={"method": request.method, "path": request.url.path})
        raise
    else:
        response.headers["X-Request-ID"] = rid
        log.info(
            "request",
            extra={
                "method": request.method,
                "path": request.url.path,  # no query string, no headers, no body
                "status": response.status_code,
                "duration_ms": int((time.perf_counter() - start) * 1000),
            },
        )
        return response
    finally:
        request_id_var.reset(token)


app.include_router(router)