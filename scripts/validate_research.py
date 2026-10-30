#!/usr/bin/env python3
"""Validate repository structure and article/source consistency.

These checks cannot determine whether historical claims are true.
Run with: python scripts/validate_research.py
"""

from __future__ import annotations

from html import unescape
from html.parser import HTMLParser
from pathlib import Path
import re
import sys
from urllib.parse import unquote

import mistune

ROOT = Path(__file__).resolve().parents[1]
ARTICLES = ROOT / "articles"
DOCS = ROOT / "docs"
SOURCES = ROOT / "sources" / "registry.md"
CLAIMS = ROOT / "research" / "claims.md"
BUILDER = ROOT / "scripts" / "build_site.py"


class PageParser(HTMLParser):
    def __init__(self, article_only: bool = False) -> None:
        super().__init__(convert_charrefs=True)
        self.hrefs: list[str] = []
        self.ids: set[str] = set()
        self.text: list[str] = []
        self.article_only = article_only
        self.in_article = not article_only
        self.article_depth = 0
        self.skip_depth = 0
        self.script_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        data = dict(attrs)
        href = data.get("href")
        if tag in ("a", "link") and href:
            self.hrefs.append(href)
        if data.get("id"):
            self.ids.add(data["id"])

        if self.article_only and tag == "article":
            self.in_article = True
            self.article_depth += 1
        elif tag == "article" and self.article_depth:
            self.article_depth += 1

        if tag in ("script", "style"):
            self.script_depth += 1
        if self.in_article and tag == "div" and "meta" in data.get("class", "").split():
            self.skip_depth += 1
        elif self.skip_depth and tag == "div":
            self.skip_depth += 1

    def handle_endtag(self, tag: str) -> None:
        if tag == "article" and self.article_depth:
            self.article_depth -= 1
            if self.article_depth == 0:
                self.in_article = False
        if tag in ("script", "style") and self.script_depth:
            self.script_depth -= 1
        if tag == "div" and self.skip_depth:
            self.skip_depth -= 1

    def handle_data(self, data: str) -> None:
        if self.in_article and not self.skip_depth and not self.script_depth:
            self.text.append(data)


def visible_text(fragment: str, *, article_only: bool = False) -> str:
    parser = PageParser(article_only=article_only)
    parser.feed(fragment)
    return re.sub(r"\s+", "", "".join(parser.text))


def registry_ids(markdown: str, marker: str) -> list[str]:
    return re.findall(rf"^\| ({marker}\d+) \|", markdown, flags=re.M)


def check() -> list[str]:
    errors: list[str] = []
    registry = SOURCES.read_text(encoding="utf-8")
    claims = CLAIMS.read_text(encoding="utf-8")

    for path, source, prefix in [(SOURCES, registry, "S"), (CLAIMS, claims, "C")]:
        ids = registry_ids(source, prefix)
        if not ids:
            errors.append(f"{path.relative_to(ROOT)}: no {prefix} IDs")
        if len(ids) != len(set(ids)):
            errors.append(f"{path.relative_to(ROOT)}: duplicate {prefix} IDs")
        expected_numbers = list(range(1, len(ids) + 1))
        seen_numbers = [int(x[1:]) for x in ids]
        if seen_numbers != expected_numbers:
            errors.append(f"{path.relative_to(ROOT)}: IDs must be consecutive and ordered")
        if re.search(rf"\n\s*\n(?=\| {prefix}\d+ \|)", source):
            errors.append(f"{path.relative_to(ROOT)}: blank line splits Markdown table")

    known_sources = set(registry_ids(registry, "S"))
    for match in re.finditer(r"^\| (C\d+) \|(.+)$", claims, flags=re.M):
        claim_id, row = match.groups()
        for source_id in re.findall(r"\bS\d+\b", row):
            if source_id not in known_sources:
                errors.append(f"{claim_id}: unknown source {source_id}")

    script = BUILDER.read_text(encoding="utf-8")
    chapters = re.findall(
        r'^\s*\("(\d\d-[\w-]+)",\s*"([^"]+)",\s*"([^"]+)"\),',
        script, flags=re.M,
    )
    if not chapters:
        errors.append("No article chapters found in scripts/build_site.py")

    index = (DOCS / "index.html").read_text(encoding="utf-8")
    renderer = mistune.create_markdown(escape=True, plugins=["table", "strikethrough"])
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
        if f"articles/{slug}.html" not in index or f"<strong>{title}</strong>" not in index:
            errors.append(f"{slug}: missing or incorrect website index entry")

        for source_id in re.findall(r"\bS\d+\b", markdown):
            if source_id not in known_sources:
                errors.append(f"{slug}: unknown source {source_id}")

        for href in re.findall(r"\]\(([^)]+)\)", markdown):
            target = unescape(href).split("#", 1)[0]
            if target and not target.startswith(("http://", "https://", "mailto:")):
                if not (md_file.parent / target).resolve().is_file():
                    errors.append(f"{slug}: missing Markdown link {target}")

        # Compare *all visible body text*, not just the heading; otherwise
        # a stale published HTML article could pass validation.
        expected_text = visible_text(renderer(markdown))
        actual_text = visible_text(rendered, article_only=True)
        if expected_text != actual_text:
            errors.append(f"{slug}: published HTML body text differs from Markdown")

    # Compare the rendered evidence table with the registry.
    html_sources = (DOCS / "sources.html").read_text(encoding="utf-8")
    rows = list(re.finditer(r'<tr(?:\s+id="([^"]+)")?>\s*<td>\s*(S\d+)\s*</td>(.*?)</tr>', html_sources, re.S))
    site_ids = [m.group(2) for m in rows]
    if site_ids != registry_ids(registry, "S"):
        errors.append("docs/sources.html: IDs do not match registry")
    for row in rows:
        anchor_id, source_id, cells = row.groups()
        if anchor_id != source_id:
            errors.append(f"docs/sources.html: missing/mismatched anchor for {source_id}")
        match = re.search(r'href="([^"]+)"', cells)
        url_in_site = unescape(match.group(1)) if match else ""
        source_line = next(
            (line for line in registry.splitlines() if line.startswith(f"| {source_id} |")), ""
        )
        url_in_registry_match = re.search(r"\]\((https?://[^)]+)\)", source_line)
        url_in_registry = url_in_registry_match.group(1) if url_in_registry_match else ""
        if unquote(url_in_site) != unquote(url_in_registry):
            errors.append(f"docs/sources.html: link mismatch for {source_id}")

    # Check relative paths and in-page hash targets for every published page.
    for page in DOCS.rglob("*.html"):
        parser = PageParser()
        parser.feed(page.read_text(encoding="utf-8"))
        for href in parser.hrefs:
            if href.startswith(("http://", "https://", "mailto:")):
                continue
            target, _, fragment = unescape(href).partition("#")
            dest = (page.parent / target).resolve() if target else page
            if not dest.is_file():
                errors.append(f"{page.relative_to(ROOT)}: missing HTML link {href}")
            elif fragment:
                destination = PageParser()
                destination.feed(dest.read_text(encoding="utf-8"))
                if fragment not in destination.ids:
                    errors.append(f"{page.relative_to(ROOT)}: missing anchor {href}")

    if len(chapters) != len(list(ARTICLES.glob("[0-9][0-9]-*.md"))):
        errors.append("Chapter manifest differs from articles directory")
    return errors


if __name__ == "__main__":
    issues = check()
    if issues:
        for issue in issues:
            print("ERROR:", issue, file=sys.stderr)
        raise SystemExit(1)
    print("Research consistency OK. Historical truth and external links require human verification.")
