#!/usr/bin/env python3
"""Publish one static asset to this project's Cloudflare R2 bucket, safely.

Encodes the two things that are easy to get wrong against an R2 custom domain:

1. Existence checks go through `wrangler`, never through `curl`. A GET for a
   missing key returns a 404 that Cloudflare's edge caches for 4 hours, so
   probing a key with curl *before* uploading poisons the URL you are about to
   publish.
2. Verification is a real GET with a byte comparison, never `curl -I`. A HEAD
   request against a poisoned URL happily returns `200 image/webp` while the
   GET every browser makes still serves the cached 404.

If the bare URL turns out to be poisoned anyway, the script re-fetches it with a
throwaway query string. That is a different cache key, so it reaches origin and
proves whether the object itself is correct — but it does NOT reliably clear the
entry on the bare URL (measured 2026-09-11: the bare URL kept serving the cached
404 straight after a successful cachebust GET). Clearing it needs a Cloudflare
dashboard purge of that URL, or waiting out the 4-hour TTL.

Usage:
    publish_r2_media.py --file <local path> --key <r2 key> [--webp] [--check-only]
"""

import argparse
import hashlib
import json
import mimetypes
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path

DEFAULT_BUCKET = "mediaclaw-media"
DEFAULT_DOMAIN = "https://media.mediaclaw.app"
IMMUTABLE_CACHE_CONTROL = "public, max-age=31536000, immutable"
NEGATIVE_CACHE_SECONDS = 14400  # Cloudflare's default TTL for an R2 404.
BROWSER_UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/140.0 Safari/537.36"
)

EXTRA_TYPES = {
    ".webp": "image/webp",
    ".avif": "image/avif",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".svg": "image/svg+xml",
}


class Failure(RuntimeError):
    """An expected, reportable failure — printed as JSON, not a traceback."""


def run(command, check=True):
    result = subprocess.run(command, text=True, capture_output=True)
    if check and result.returncode:
        message = result.stderr.strip() or result.stdout.strip()
        raise Failure(message or f"command failed: {' '.join(command)}")
    return result


def sha256(path):
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def content_type_for(path):
    suffix = Path(path).suffix.lower()
    if suffix in EXTRA_TYPES:
        return EXTRA_TYPES[suffix]
    guessed, _ = mimetypes.guess_type(str(path))
    if not guessed:
        raise Failure(f"cannot infer a content type for {path}; pass --content-type")
    return guessed


def convert_to_webp(source, quality):
    cwebp = shutil.which("cwebp")
    if not cwebp:
        raise Failure("cwebp not found on PATH; install it or drop --webp")
    output = Path(tempfile.mkdtemp(prefix="r2-webp-")) / (Path(source).stem + ".webp")
    run([cwebp, "-q", str(quality), "-quiet", str(source), "-o", str(output)])
    return output


def object_exists(bucket, key):
    """Check R2 directly. Never curl the public URL — that caches a 404."""
    result = run(
        [
            "npx", "wrangler", "r2", "object", "get",
            f"{bucket}/{key}", "--file", "/dev/null", "--remote",
        ],
        check=False,
    )
    if result.returncode == 0:
        return True
    blob = (result.stderr + result.stdout).lower()
    if "not found" in blob or "does not exist" in blob or "10007" in blob:
        return False
    raise Failure(
        "could not determine whether the key already exists "
        f"(wrangler exited {result.returncode}): {result.stderr.strip()[:400]}"
    )


def fetch(url, timeout=60):
    """Real GET. Returns (status, body, headers); never raises on 4xx/5xx."""
    # Cloudflare blocks the default Python-urllib agent with `error code: 1010`,
    # which would masquerade as a publishing failure. Ask as a browser would.
    request = urllib.request.Request(url, method="GET", headers={"User-Agent": BROWSER_UA})
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            # Keep the Message object — it looks headers up case-insensitively,
            # which dict() would throw away.
            return response.status, response.read(), response.headers
    except urllib.error.HTTPError as error:
        return error.code, error.read(), error.headers


def verify(url, expected_digest, probe_origin=True):
    """GET the bare URL and compare bytes.

    Returns (outcome, attempts) where outcome is one of:
      "ok"           — the public URL serves the right bytes
      "stale_cache"  — origin has the right bytes, the bare URL serves a stale 404
      "bad"          — origin does not serve the expected bytes either
    """
    attempts = []

    def attempt(target, label):
        status, body, headers = fetch(target)
        record = {
            "step": label,
            "status": status,
            "content_type": headers.get("Content-Type"),
            "bytes": len(body),
            "cf_cache_status": headers.get("Cf-Cache-Status"),
            "cf_colo": (headers.get("Cf-Ray") or "").rsplit("-", 1)[-1] or None,
            "sha256_matches": hashlib.sha256(body).hexdigest() == expected_digest,
        }
        attempts.append(record)
        return record

    report = attempt(url, "get")
    if report["status"] == 200 and report["sha256_matches"]:
        return "ok", attempts

    if not probe_origin:
        return "bad", attempts

    # A throwaway query is a different cache key, so this reaches origin and
    # tells us whether the object itself is right. It does NOT dependably clear
    # the entry sitting on the bare URL.
    origin = attempt(f"{url}?cachebust={int(time.time())}", "origin_probe")
    time.sleep(1.5)
    report = attempt(url, "recheck")
    if report["status"] == 200 and report["sha256_matches"]:
        return "ok", attempts
    if origin["status"] == 200 and origin["sha256_matches"]:
        return "stale_cache", attempts
    return "bad", attempts


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--file", required=True, help="local file to publish")
    parser.add_argument(
        "--key",
        required=True,
        help="R2 object key, e.g. testimonials/2026/29-solo-built-consulting.webp",
    )
    parser.add_argument("--bucket", default=DEFAULT_BUCKET)
    parser.add_argument("--domain", default=DEFAULT_DOMAIN)
    parser.add_argument("--content-type", help="override the inferred content type")
    parser.add_argument("--cache-control", default=IMMUTABLE_CACHE_CONTROL)
    parser.add_argument(
        "--webp",
        action="store_true",
        help="convert the source to WebP before upload (key must end in .webp)",
    )
    parser.add_argument("--quality", type=int, default=88, help="cwebp quality")
    parser.add_argument(
        "--check-only",
        action="store_true",
        help="report readiness and whether the key is free; upload nothing",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="overwrite an existing object at this key",
    )
    parser.add_argument(
        "--no-origin-probe",
        dest="probe_origin",
        action="store_false",
        help="skip the ?cachebust= origin probe used to tell a stale edge cache "
             "apart from a genuinely bad upload",
    )
    args = parser.parse_args()

    source = Path(args.file).expanduser().resolve()
    if not source.is_file():
        raise Failure(f"no such file: {source}")

    key = args.key.lstrip("/")
    url = f"{args.domain.rstrip('/')}/{key}"

    if args.webp and not key.endswith(".webp"):
        raise Failure("--webp given but the key does not end in .webp")

    exists = object_exists(args.bucket, key)

    if args.check_only:
        print(json.dumps({
            "status": "ready",
            "bucket": args.bucket,
            "key": key,
            "url": url,
            "key_already_used": exists,
            "source": str(source),
            "source_bytes": source.stat().st_size,
            "outward_action_attempted": False,
        }, indent=2, ensure_ascii=False))
        return

    if exists and not args.force:
        raise Failure(
            f"{args.bucket}/{key} already exists — pick another key, or pass "
            "--force to overwrite it deliberately"
        )

    payload = convert_to_webp(source, args.quality) if args.webp else source
    content_type = args.content_type or content_type_for(payload)
    digest = sha256(payload)

    run([
        "npx", "wrangler", "r2", "object", "put", f"{args.bucket}/{key}",
        "--file", str(payload), "--remote",
        "--content-type", content_type,
        "--content-disposition", "inline",
        "--cache-control", args.cache_control,
    ])

    outcome, attempts = verify(url, digest, probe_origin=args.probe_origin)

    status = {
        "ok": "published",
        "stale_cache": "published_edge_cache_stale",
        "bad": "uploaded_but_unverified",
    }[outcome]

    result = {
        "status": status,
        "bucket": args.bucket,
        "key": key,
        "url": url,
        "content_type": content_type,
        "bytes": Path(payload).stat().st_size,
        "sha256": digest,
        "overwrote_existing": exists,
        "verification": attempts,
    }
    if outcome == "stale_cache":
        hours = NEGATIVE_CACHE_SECONDS // 3600
        result["hint"] = (
            "The object in R2 is correct (origin returned matching bytes), but "
            "the public URL is still serving a cached 404 — someone GET this key "
            "before it existed. Do NOT re-upload; that changes nothing. Either "
            f"wait it out (up to {hours}h, per Cloudflare edge colo), or ask the "
            "user to purge this exact URL in the Cloudflare dashboard → Caching → "
            "Configuration → Purge Custom Purge by URL. Tell the user which it is "
            "instead of reporting the publish as done."
        )
    elif outcome == "bad":
        result["hint"] = (
            "Origin did not return the expected bytes. Check the key, the bucket, "
            "and that `npx wrangler whoami` is the account owning this bucket."
        )
    print(json.dumps(result, indent=2, ensure_ascii=False))
    if outcome != "ok":
        sys.exit(1)


if __name__ == "__main__":
    try:
        main()
    except Failure as failure:
        print(json.dumps({"status": "blocked", "error": str(failure)},
                         indent=2, ensure_ascii=False))
        sys.exit(1)
