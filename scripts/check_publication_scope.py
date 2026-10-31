#!/usr/bin/env python3
"""Prevent merging research-only updates as a completed reader-facing release.

Usage: python scripts/check_publication_scope.py <base-commit-sha>
Checks filenames, not whether prose accurately reflects historical sources.
"""
from __future__ import annotations

import subprocess
import sys


def publication_errors(paths: list[str]) -> list[str]:
    changed = set(paths)
    research_updated = any(
        (p.startswith("research/") and p.endswith(".md")) or p == "sources/registry.md"
        for p in changed
    )
    if not research_updated:
        return []

    errors: list[str] = []
    if not any(p.startswith("articles/") and p.endswith(".md") for p in changed):
        errors.append(
            "Research/source changes have no reader-facing articles/*.md change. "
            "Revise an article or add a chapter before declaring the research published."
        )
    if not any(p.startswith("docs/articles/") and p.endswith(".html") for p in changed):
        errors.append(
            "Research/source changes have no rendered docs/articles/*.html change. "
            "Regenerate and commit the public site content."
        )
    return errors


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print("Usage: python scripts/check_publication_scope.py <base-sha>", file=sys.stderr)
        return 2

    base = argv[1]
    if set(base) == {"0"}:
        print("Initial-branch push: no prior commit for comparison; publication check skipped.")
        return 0

    try:
        subprocess.run(
            ["git", "cat-file", "-e", f"{base}^{{commit}}"],
            check=True, capture_output=True, text=True
        )
        result = subprocess.run(
            ["git", "diff", "--name-only", "--diff-filter=ACMRT", f"{base}...HEAD"],
            check=True, capture_output=True, text=True
        )
    except subprocess.CalledProcessError as exc:
        print(f"Unable to compare against {base}: {exc.stderr.strip()}", file=sys.stderr)
        return 2

    paths = [p for p in result.stdout.splitlines() if p]
    errors = publication_errors(paths)
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1

    print("Research-to-publication scope OK (filename co-update; factual accuracy checked separately).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
