#!/usr/bin/env python3
import argparse
import base64
import html
import json
import re
from pathlib import Path
from urllib.parse import urlparse


def parse_frontmatter(text):
    if not text.startswith("---"):
        return {}, text
    end = text.find("\n---", 3)
    if end < 0:
        return {}, text
    raw = text[3:end]
    body = text[end + 4 :]
    data = {}
    for line in raw.splitlines():
        match = re.match(r"\s*([A-Za-z_][\w-]*)\s*:\s*(.*)", line)
        if not match:
            continue
        key, value = match.groups()
        value = value.strip().rstrip(",")
        if value.startswith(('"', "'")) and value.endswith(('"', "'")):
            value = value[1:-1]
        elif value.startswith("[") and value.endswith("]"):
            try:
                value = json.loads(value.replace("'", '"'))
            except json.JSONDecodeError:
                value = [item.strip(" '\"") for item in value[1:-1].split(",")]
        data[key] = value
    return data, body


def image_sources(text):
    values = re.findall(r"""(?:src\s*=\s*|!\[[^\]]*\]\()(["']?)([^"')\s>]+)\1""", text)
    return [value for _, value in values]


def as_uri(value, base):
    if re.match(r"^(https?:|data:|file:)", value):
        return value
    path = (base / value).resolve()
    return path.as_uri()


def data_uri(path):
    path = Path(path)
    if not path.exists():
        return ""
    suffix = path.suffix.lower().lstrip(".")
    mime = "image/jpeg" if suffix in {"jpg", "jpeg"} else f"image/{suffix or 'png'}"
    return f"data:{mime};base64,{base64.b64encode(path.read_bytes()).decode()}"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--article", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--title")
    parser.add_argument("--accent")
    parser.add_argument("--eyebrow")
    parser.add_argument("--description")
    parser.add_argument("--tags", nargs="*")
    parser.add_argument("--images", nargs="*")
    parser.add_argument("--logo")
    args = parser.parse_args()

    article_path = Path(args.article).resolve()
    text = article_path.read_text(encoding="utf-8")
    meta, body = parse_frontmatter(text)
    title = args.title or str(meta.get("title", "把内容变成可执行的下一步"))
    description = args.description or str(meta.get("description", "")).strip()
    tags = args.tags or meta.get("tags", []) or ["采集", "拆解", "创作"]
    if isinstance(tags, str):
        tags = [item.strip() for item in tags.split(",") if item.strip()]
    eyebrow = args.eyebrow or (tags[0] if tags else "MediaClaw 工作流")
    accent = args.accent or ""
    images = args.images or image_sources(body)
    images = [as_uri(item, article_path.parent) for item in images[:3]]

    logo_path = args.logo
    if not logo_path:
        candidate = Path.cwd() / "public" / "logo.png"
        logo_path = str(candidate) if candidate.exists() else ""
    logo = data_uri(logo_path) if logo_path else ""

    def esc(value):
        return html.escape(str(value), quote=True)

    title_html = esc(title)
    if accent and accent in title:
        title_html = title_html.replace(esc(accent), f"<em>{esc(accent)}</em>", 1)
    tag_html = "".join(f"<span>{esc(tag)}</span>" for tag in tags[:3])
    shot_html = "".join(
        f'<div class="shot shot-{index + 1}"><div class="bar"><i></i><i></i><i></i></div>'
        f'<img src="{esc(src)}" alt=""></div>'
        for index, src in enumerate(images)
    )
    if not shot_html:
        shot_html = '<div class="shot shot-1 placeholder">ARTICLE<br>VISUAL</div>'
    brand = (
        f'<img src="{logo}" alt="">' if logo else '<b class="logo-fallback">M</b>'
    )

    template = f"""<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)}</title>
<style>
:root{{--paper:#fbfafc;--ink:#0f172a;--muted:#64748b;--card:#fff;--line:#dbe2ea;
--accent:#ec4899;--accent-soft:#67e8f9;--radius:34px;--shadow:0 34px 90px rgba(15,23,42,.16)}}
*{{box-sizing:border-box}}html,body{{margin:0;width:100%;height:100%;overflow:hidden}}
body{{font-family:Inter,"PingFang SC","Microsoft YaHei",system-ui,sans-serif;background:var(--paper);color:var(--ink)}}
.cover{{position:relative;width:1600px;height:900px;padding:64px 80px 60px;overflow:hidden;background:
radial-gradient(circle at 89% 10%,rgba(103,232,249,.24),transparent 27%),
radial-gradient(circle at 70% 91%,rgba(236,72,153,.14),transparent 30%),var(--paper)}}
.grain{{position:absolute;inset:0;opacity:.18;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.08'/%3E%3C/svg%3E")}}
.brand{{position:relative;z-index:3;display:flex;align-items:center;gap:15px;font-size:25px;font-weight:800;letter-spacing:-.02em}}
.brand img,.logo-fallback{{width:48px;height:48px;border-radius:17px;object-fit:cover;box-shadow:0 8px 20px rgba(15,23,42,.15)}}
.logo-fallback{{display:grid;place-items:center;background:#0f172a;color:#fff}}
.copy{{position:relative;z-index:3;width:650px;padding-top:118px}}
.eyebrow{{display:inline-flex;align-items:center;gap:10px;padding:9px 15px;border:1px solid rgba(15,23,42,.1);border-radius:999px;background:rgba(255,255,255,.72);font-size:18px;font-weight:700}}
.eyebrow i{{width:9px;height:9px;border-radius:50%;background:linear-gradient(135deg,var(--accent-soft),#8b5cf6,var(--accent));box-shadow:0 0 0 5px rgba(236,72,153,.08)}}
h1{{margin:26px 0 20px;max-width:650px;font-size:72px;line-height:1.08;letter-spacing:-.055em;font-weight:850}}
h1 em{{font-family:"Noto Serif SC",Georgia,serif;font-weight:700;color:var(--accent);text-decoration:none}}
.desc{{max-width:590px;margin:0;color:var(--muted);font-size:23px;line-height:1.62;font-weight:500}}
.tags{{display:flex;gap:10px;margin-top:34px}}.tags span{{padding:9px 14px;border-radius:999px;background:#fff;border:1px solid var(--line);font-size:16px;font-weight:700;box-shadow:0 6px 18px rgba(15,23,42,.05)}}
.visual-stage{{position:absolute;z-index:2;right:45px;top:92px;width:825px;height:730px;border-radius:48px;background:linear-gradient(145deg,#eefbff 0%,#f4f0ff 49%,#fff2f8 100%);border:1px solid rgba(15,23,42,.08);box-shadow:inset 0 1px rgba(255,255,255,.9)}}
.visual-stage:before{{content:"";position:absolute;inset:28px;border:1px dashed rgba(15,23,42,.1);border-radius:32px}}
.shot{{position:absolute;overflow:hidden;border:1px solid rgba(15,23,42,.16);border-radius:22px;background:#fff;box-shadow:var(--shadow)}}
.shot .bar{{height:32px;display:flex;align-items:center;gap:7px;padding:0 13px;background:#f8fafc;border-bottom:1px solid #e2e8f0}}
.shot .bar i{{display:block;width:8px;height:8px;border-radius:50%;background:#cbd5e1}}.shot .bar i:first-child{{background:#fb7185}}.shot .bar i:nth-child(2){{background:#fbbf24}}.shot .bar i:nth-child(3){{background:#34d399}}
.shot img{{display:block;width:100%;height:calc(100% - 32px);object-fit:cover;object-position:top}}
.shot-1{{left:52px;top:84px;width:540px;height:390px;transform:rotate(-2deg)}}
.shot-2{{right:35px;bottom:56px;width:510px;height:350px;transform:rotate(2.2deg)}}
.shot-3{{left:34px;bottom:58px;width:300px;height:230px;transform:rotate(-4deg)}}
.placeholder{{display:grid;place-items:center;font-size:46px;line-height:1.1;font-weight:900;color:#94a3b8;text-align:center}}
.badge{{position:absolute;z-index:5;right:66px;top:105px;padding:13px 18px;border-radius:999px;background:#0f172a;color:#fff;font-size:16px;font-weight:800;box-shadow:0 14px 30px rgba(15,23,42,.22)}}
.footer{{position:absolute;z-index:3;left:80px;bottom:55px;color:#94a3b8;font-size:15px;font-weight:650;letter-spacing:.05em}}
</style></head><body><main class="cover"><div class="grain"></div>
<div class="brand">{brand}<span>MediaClaw</span></div>
<section class="copy"><div class="eyebrow"><i></i>{esc(eyebrow)}</div>
<h1>{title_html}</h1><p class="desc">{esc(description)}</p><div class="tags">{tag_html}</div></section>
<section class="visual-stage">{shot_html}<div class="badge">真实产品工作流 ✓</div></section>
<div class="footer">MEDIACLAW · CONTENT INTELLIGENCE</div></main></body></html>"""
    output = Path(args.output).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(template, encoding="utf-8")
    print(output)


if __name__ == "__main__":
    main()
