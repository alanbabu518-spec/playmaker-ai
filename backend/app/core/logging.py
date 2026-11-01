import contextvars
import json
import logging
import sys
from datetime import datetime, timezone

# Holds the id of the request being handled, so every log line can carry it.
request_id_var: contextvars.ContextVar[str] = contextvars.ContextVar("request_id", default="-")

_RESERVED = set(logging.makeLogRecord({}).__dict__) | {"message", "asctime"}
# Extra fields we never print: request_id is shown separately, color_message is uvicorn terminal noise.
_HIDDEN_EXTRAS = {"request_id", "color_message"}


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "ts": datetime.fromtimestamp(record.created, timezone.utc).isoformat(timespec="milliseconds"),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": request_id_var.get(),
        }
        for key, value in record.__dict__.items():  # fields passed with extra={...}
            if key not in _RESERVED and key not in _HIDDEN_EXTRAS and not key.startswith("_"):
                payload[key] = value
        if record.exc_info:
            payload["exc"] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=False, default=str)


class RequestIdFilter(logging.Filter):
    """Adds the request id to the plain-text format too."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_var.get()
        return True


class PlainFormatter(logging.Formatter):
    """Readable text lines that still show extra fields, like path=/ask status=200."""

    def formatMessage(self, record: logging.LogRecord) -> str:
        line = super().formatMessage(record)
        extras = {
            k: v
            for k, v in record.__dict__.items()
            if k not in _RESERVED and k not in _HIDDEN_EXTRAS and not k.startswith("_")
        }
        if extras:
            line += " " + " ".join(f"{k}={v}" for k, v in extras.items())
        return line


def setup_logging(level: str = "INFO", json_logs: bool = True) -> None:
    handler = logging.StreamHandler(sys.stdout)
    if json_logs:
        handler.setFormatter(JsonFormatter())
    else:
        handler.addFilter(RequestIdFilter())
        handler.setFormatter(PlainFormatter("%(asctime)s %(levelname)s [%(request_id)s] %(name)s: %(message)s"))

    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(level.upper())

    logging.getLogger("httpx").setLevel(logging.WARNING)  # one line per outgoing API call is noise
    # Use our handler for uvicorn's own messages, and drop its access log (our middleware logs requests).
    for name in ("uvicorn", "uvicorn.error"):
        lg = logging.getLogger(name)
        lg.handlers = []
        lg.propagate = True
    logging.getLogger("uvicorn.access").disabled = True