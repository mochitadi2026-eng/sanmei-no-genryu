#!/usr/bin/env python3
"""Update GitHub Pages HTML from the Markdown master files.

Usage: pip install -r requirements.txt && python scripts/build_site.py
No network access is required for rendering.
"""

from pathlib import Path
import html
import re

try:
    import mistune
except ImportError as exc:
    raise SystemExit("mistune is required: pip install -r requirements.txt") from exc

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
ARTICLES = ROOT / "articles"
CHAPTERS = [
    ("00-introduction", "はじめに", "算命学より前の世界を訪ねて"),
    ("01-oracle-bones", "第1話", "人は、亀の甲羅に何を尋ねたのか"),
    ("02-five-elements", "第2話", "木は、ただの木ではなかった"),
    ("03-ten-stems", "第3話", "甲は、昔から大樹だったのか"),
    ("04-birth-records", "第4話", "生まれた日の記号が、運命を語り始めるまで"),
    ("05-ten-major-stars", "第5話", "十大主星は、どこから来たのか"),
    ("06-twelve-stages", "第6話", "十二大従星の前に、十二の循環があった"),
    ("07-four-pillars-history", "第7話", "命式は、いつ今の形になったのか"),
]

md = mistune.create_markdown(escape=True, plugins=["table", "strikethrough"])

def layout(title, content, prefix="", eyebrow="原典をたどる読み物"):
    title = html.escape(title)
    eyebrow = html.escape(eyebrow)
    return f'''<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="算命の源流。中国古典に何が書かれているかを確かめる歴史と思想の読み物。"><title>{title}｜算命の源流</title><link rel="stylesheet" href="{prefix}style.css"></head><body><a class="skip" href="#main">本文に移動</a><header><div class="inner"><div class="eyebrow">{eyebrow}</div><div class="site-title">算命の源流</div><div class="subtitle">自然を読み、時を数え、人の命を考えた歴史。</div></div></header><nav><a href="{prefix}index.html">連載の目次</a><a href="{prefix}sources.html">出典と検証</a><a href="{prefix}about.html">この連載について</a></nav><main id="main"><article>{content}</article></main><footer class="foot">算命の源流 — 記されたことと、考えたことを分けて読む。<br>研究原稿 v0.4.0 / 2026-10-30</footer></body></html>'''

def article_content(raw):
    raw = raw.replace("../sources/registry.md", "../sources.html")
    raw = raw.replace("../README.md", "../index.html")
    raw = re.sub(r"\]\((\d\d-[\w-]+)\.md\)", r"](\1.html)", raw)
    output = md(raw)
    output = re.sub(r"\[(S\d\d)\]", r'<a class="source-link" href="../sources.html#\1">[\1]</a>', output)
    return output

def write(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text.rstrip() + "\n", encoding="utf-8")

for slug, number, title in CHAPTERS:
    source = ARTICLES / f"{slug}.md"
    page = f'<div class="meta">{html.escape(number)} / 2026年10月30日</div>' + article_content(source.read_text("utf-8"))
    write(DOCS / "articles" / f"{slug}.html", layout(title, page, prefix="../", eyebrow="読み物 / 算命の源流"))

home = '''<div class="meta">連載｜第1部・自然と時を読む</div><h1>星の名前が生まれる前、<br>人は何を見ていたのだろう。</h1><p>生年月日から命運を読む方法が現れる前、人々は天候や季節、ひび割れや暦に何を尋ねていたのか。古典の本文と研究資料を確かめながら、ゆっくりたどっていく連載です。</p><p>現代の算命学にそのまま続く、という物語を最初から決めつけることはしません。章の順番は理解のための構成で、文献の成立順でも直系の系譜でもありません。分かっていることと、まだ分からないことを分けて書きます。</p><h2>連載を読む</h2><ol class="series">'''
for slug, number, title in CHAPTERS:
    home += f'<li><a href="articles/{slug}.html"><small>{html.escape(number)}</small><strong>{html.escape(title)}</strong></a></li>'
home += '''</ol><h2>研究記録について</h2><p>各章には典拠を付けています。<a href="sources.html">出典と検証</a>では原典へのリンク、閲覧した範囲、未確認事項を一覧できます。</p>'''
write(DOCS / "index.html", layout("目次", home))

sources = md((ROOT / "sources" / "registry.md").read_text("utf-8"))
# Each source ID is a stable in-page anchor target for chapter citations.
sources = re.sub(r'<tr>\s*<td>(S\d+)</td>', lambda m: f'<tr id="{m.group(1)}">\n  <td>{m.group(1)}</td>', sources)
sources += '<p>原稿の検証台帳はリポジトリ内 <code>research/claims.md</code> を参照してください。</p>'
write(DOCS / "sources.html", layout("出典と検証", sources))

errors = []
for page in DOCS.rglob("*.html"):
    for link in re.findall(r'href="([^"]+)"', page.read_text("utf-8")):
        target = html.unescape(link).split("#")[0]
        if not target or target.startswith(("http://", "https://", "mailto:")):
            continue
        if not (page.parent / target).resolve().is_file():
            errors.append(f"{page.relative_to(ROOT)} -> {target}")
if errors:
    raise SystemExit("Broken local links:\n" + "\n".join(errors))
print(f"Generated {len(CHAPTERS)} chapters + index + source register; local links OK")
