#!/usr/bin/env python3
"""Check internal consistency of the Sanmei no Genryu research repository.

This does not fact-check historical claims or check external URLs.
Run after: python scripts/build_site.py
"""

from __future__ import annotations

from html import unescape
from html.parser import HTMLParser
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
ARTICLES = ROOT / "articles"
DOCS = ROOT / "docs"
SOURCES = ROOT / "sources" / "registry.md"
CLAIMS = ROOT / "research" / "claims.md"
BUILDER = ROOT / "scripts" / "build_site.py"


class Hrefs(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.hrefs: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        for key, value in attrs:
            if tag == "a" and key == "href" and value:
                self.hrefs.append(value)
            elif tag == "link" and key == "href" and value:
                self.hrefs.append(value)


def registry_ids(markdown: str, marker: str) -> list[str]:
    return re.findall(rf"^\| ({marker}\d{{2}}) \|", markdown, flags=re.M)


def check() -> list[str]:
    errors: list[str] = []
    registry = SOURCES.read_text(encoding="utf-8")
    claims = CLAIMS.read_text(encoding="utf-8")
    for path, text, marker in [(SOURCES, registry, "S"), (CLAIMS, claims, "C")]:
        ids = registry_ids(text, marker)
        if not ids:
            errors.append(f"{path.relative_to(ROOT)}: no {marker} IDs")
        for ident in sorted(set(ids)):
            if ids.count(ident) > 1:
                errors.append(f"{path.relative_to(ROOT)}: duplicate {ident}")
        if re.search(rf"\n\s*\n(?=\| {marker}\d{{2}} \|)", text):
            errors.append(f"{path.relative_to(ROOT)}: blank line splits a Markdown table")
    known_sources = set(registry_ids(registry, "S"))

    script = BUILDER.read_text(encoding="utf-8")
    chapters = re.findall(
        r'^\s*\("(\d\d-[\w-]+)",\s*"([^"]+)",\s*"([^"]+)"\),',
        script, flags=re.M,
    )
    if not chapters:
        errors.append("No article chapters found in scripts/build_site.py")
    index = (DOCS / "index.html").read_text(encoding="utf-8")

    for slug, number, title in chapters:
        md_file = ARTICLES / f"{slug}.md"
        html_file = DOCS / "articles" / f"{slug}.html"
        if not md_file.is_file() or not html_file.is_file():
            errors.append(f"{slug}: missing Markdown or HTML article")
            continue
        markdown = md_file.read_text(encoding="utf-8")
        rendered = html_file.read_text(encoding="utf-8")
        expected = f"# {number}｜{title}"
        if not markdown.startswith(expected + "\n"):
            errors.append(f"{slug}: Markdown title differs from chapter manifest")
        if f"<h1>{expected[2:]}</h1>" not in rendered:
            errors.append(f"{slug}: HTML heading differs from Markdown")
        if f'articles/{slug}.html' not in index:
            errors.append(f"{slug}: not included in website index")
        if f"<strong>{title}</strong>" not in index:
            errors.append(f"{slug}: index chapter title differs from manifest")

        for source_id in re.findall(r"\bS\d{2}\b", markdown):
            if source_id not in known_sources:
                errors.append(f"{slug}: unknown source {source_id}")
        for match in re.finditer(r"\]\(([^)]+)\)", markdown):
            href = match.group(1).split("#", 1)[0]
            if not href or href.startswith(("http:", "https:", "mailto:")):
                continue
            if not (md_file.parent / unescape(href)).resolve().is_file():
                errors.append(f"{slug}: missing Markdown link {href}")

    for page in DOCS.rglob("*.html"):
        parser = Hrefs()
        parser.feed(page.read_text(encoding="utf-8"))
        for href in parser.hrefs:
            target = href.split("#", 1)[0]
            if not target or target.startswith(("http:", "https:", "mailto:")):
                continue
            if not (page.parent / unescape(target)).resolve().is_file():
                errors.append(f"{page.relative_to(ROOT)}: missing HTML link {href}")

    if len(chapters) != len(list(ARTICLES.glob("[0-9][0-9]-*.md"))):
        errors.append("The chapter manifest and the set of Markdown articles differ")
    return errors


if __name__ == "__main__":
    issues = check()
    if issues:
        for item in issues:
            print("ERROR:", item, file=sys.stderr)
        raise SystemExit(1)
    print("Research site structure OK. Source truth and external links still require human verification.")
