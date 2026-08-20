#!/usr/bin/env python3
import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path
from urllib.parse import urljoin, urlparse

DEFAULT_UPLOAD_ENDPOINT = "https://mediaclaw.app/api/storage/upload-image"


def run(command):
    result = subprocess.run(command, text=True, capture_output=True)
    if result.returncode:
        message = result.stderr.strip() or result.stdout.strip()
        raise RuntimeError(message or f"Command failed: {' '.join(command)}")
    return result.stdout.strip()


def convert_to_webp(source, output, quality):
    cwebp = shutil.which("cwebp")
    if not cwebp:
        raise RuntimeError("cwebp is required to publish a WebP cover")
    run([cwebp, "-quiet", "-q", str(quality), str(source), "-o", str(output)])
    if not output.exists() or output.stat().st_size == 0:
        raise RuntimeError("WebP conversion produced no output")


def upload(webp, endpoint, cookie):
    curl = shutil.which("curl")
    if not curl:
        raise RuntimeError("curl is required to upload the cover")
    command = [
        curl,
        "--fail-with-body",
        "--silent",
        "--show-error",
        "-X",
        "POST",
        endpoint,
        "-F",
        f"files=@{webp};type=image/webp",
    ]
    if cookie:
        command.extend(["-H", f"Cookie: {cookie}"])
    raw = run(command)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise RuntimeError(f"Upload returned invalid JSON: {raw[:300]}") from error
    if payload.get("code") != 0:
        raise RuntimeError(payload.get("message") or "Upload failed")
    urls = ((payload.get("data") or {}).get("urls") or [])
    if not urls:
        raise RuntimeError("Upload succeeded without a returned URL")
    return str(urls[0])


def verify(url, endpoint):
    absolute = urljoin(endpoint, url)
    parsed = urlparse(absolute)
    if parsed.scheme not in {"http", "https"}:
        raise RuntimeError(f"Returned URL is not remotely accessible: {url}")
    curl = shutil.which("curl")
    output = run(
        [
            curl,
            "--silent",
            "--show-error",
            "--location",
            "--head",
            "--output",
            "/dev/null",
            "--write-out",
            "%{http_code}\\n%{content_type}",
            absolute,
        ]
    )
    status, _, content_type = output.partition("\n")
    if status != "200" or not content_type.startswith("image/"):
        # Some object stores do not allow HEAD; verify with a ranged GET.
        output = run(
            [
                curl,
                "--silent",
                "--show-error",
                "--location",
                "--range",
                "0-0",
                "--output",
                "/dev/null",
                "--write-out",
                "%{http_code}\\n%{content_type}",
                absolute,
            ]
        )
        status, _, content_type = output.partition("\n")
        if status not in {"200", "206"} or not content_type.startswith("image/"):
            raise RuntimeError(
                f"Remote cover verification failed: HTTP {status}, {content_type}"
            )
    return absolute


def readiness(source, endpoint, cookie):
    missing = []
    if not endpoint:
        missing.append("upload_endpoint")
    else:
        parsed = urlparse(endpoint)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            missing.append("valid_http_upload_endpoint")
    if not cookie:
        missing.append("better_auth_session_cookie")
    if not shutil.which("cwebp"):
        missing.append("cwebp")
    if not shutil.which("curl"):
        missing.append("curl")

    if "better_auth_session_cookie" in missing:
        status = "blocked_authentication"
    elif missing:
        status = "blocked_preflight"
    else:
        status = "ready"

    return {
        "status": status,
        "source": str(source),
        "endpoint": endpoint or None,
        "cookie_present": bool(cookie),
        "cookie_value_recorded": False,
        "missing": missing,
        "outward_action_attempted": False,
    }


def main():
    parser = argparse.ArgumentParser(
        description="Convert a rendered MediaClaw cover to WebP, upload it to R2, and print its URL."
    )
    parser.add_argument("source", help="Rendered PNG/JPEG cover")
    parser.add_argument("--output", help="WebP output path; defaults beside source")
    parser.add_argument("--quality", type=int, default=90)
    parser.add_argument(
        "--endpoint",
        default=os.environ.get("MEDIACLAW_UPLOAD_ENDPOINT", DEFAULT_UPLOAD_ENDPOINT),
        help="MediaClaw image API endpoint; defaults to production or MEDIACLAW_UPLOAD_ENDPOINT",
    )
    parser.add_argument(
        "--cookie",
        default=os.environ.get("MEDIACLAW_UPLOAD_COOKIE", ""),
        help="Authenticated Cookie header; prefer MEDIACLAW_UPLOAD_COOKIE so it is not exposed in the process list",
    )
    parser.add_argument(
        "--check-only",
        action="store_true",
        help="Validate source, endpoint, dependencies, and auth presence without conversion or upload",
    )
    args = parser.parse_args()

    source = Path(args.source).resolve()
    if not source.exists():
        raise RuntimeError(f"Source image not found: {source}")
    check = readiness(source, args.endpoint, args.cookie)
    if args.check_only:
        print(json.dumps(check, ensure_ascii=False))
        return 0 if check["status"] == "ready" else 2
    if check["status"] != "ready":
        raise RuntimeError(
            "Publish preflight failed: " + ", ".join(check["missing"])
        )
    output = (
        Path(args.output).resolve()
        if args.output
        else source.with_suffix(".webp")
    )
    output.parent.mkdir(parents=True, exist_ok=True)
    convert_to_webp(source, output, args.quality)
    returned_url = upload(output, args.endpoint, args.cookie)
    if returned_url.startswith("/"):
        raise RuntimeError(
            "Upload fell back to local storage instead of R2. Configure R2 and retry."
        )
    remote_url = verify(returned_url, args.endpoint)
    print(
        json.dumps(
            {
                "webp": str(output),
                "url": remote_url,
                "bytes": output.stat().st_size,
                "transport": "authenticated_project_api",
                "endpoint": args.endpoint,
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    try:
        sys.exit(main() or 0)
    except Exception as error:
        print(f"publish_cover: {error}", file=sys.stderr)
        sys.exit(1)
