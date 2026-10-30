#!/usr/bin/env python3
"""Negative regression tests for the research-site validator."""

from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
import shutil
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SPEC = spec_from_file_location("research_validator", ROOT / "scripts" / "validate_research.py")
validator = module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(validator)


class ResearchValidatorTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        for name in ("articles", "docs", "sources", "research", "scripts"):
            shutil.copytree(ROOT / name, self.root / name)
        shutil.copy2(ROOT / "README.md", self.root / "README.md")
        self.saved = {
            key: getattr(validator, key)
            for key in ("ROOT", "ARTICLES", "DOCS", "SOURCES", "CLAIMS", "BUILDER")
        }
        validator.ROOT = self.root
        validator.ARTICLES = self.root / "articles"
        validator.DOCS = self.root / "docs"
        validator.SOURCES = self.root / "sources" / "registry.md"
        validator.CLAIMS = self.root / "research" / "claims.md"
        validator.BUILDER = self.root / "scripts" / "build_site.py"

    def tearDown(self) -> None:
        for key, value in self.saved.items():
            setattr(validator, key, value)
        self.tmp.cleanup()

    def rewrite(self, filename: str, before: str, after: str) -> None:
        file = self.root / filename
        original = file.read_text(encoding="utf-8")
        self.assertIn(before, original, f"Fixture text missing from {filename}")
        file.write_text(original.replace(before, after, 1), encoding="utf-8")

    def test_unmodified_repository_passes(self) -> None:
        self.assertEqual([], validator.check())

    def test_stale_published_html_is_rejected(self) -> None:
        self.rewrite(
            "docs/articles/00-introduction.html",
            "それぞれは、同じものではない。",
            "それぞれは、まったく同じものだった。",
        )
        self.assertTrue(any("body text differs" in x for x in validator.check()))

    def test_changed_markdown_without_updated_html_is_rejected(self) -> None:
        self.rewrite(
            "articles/00-introduction.md",
            "それぞれは、同じものではない。",
            "それぞれは、異なるものでもなかった。",
        )
        self.assertTrue(any("body text differs" in x for x in validator.check()))

    def test_unknown_source_is_rejected(self) -> None:
        self.rewrite("articles/02-five-elements.md", "[S02]", "[S999]")
        self.assertTrue(any("unknown source S999" in x for x in validator.check()))

    def test_duplicate_claim_id_is_rejected(self) -> None:
        self.rewrite(
            "research/claims.md",
            "| C02 |",
            "| C01 |",
        )
        errors = validator.check()
        self.assertTrue(any("duplicate C IDs" in x for x in errors))

    def test_broken_hash_anchor_is_rejected(self) -> None:
        self.rewrite(
            "docs/articles/00-introduction.html",
            'href="../index.html"',
            'href="../index.html#does-not-exist"',
        )
        self.assertTrue(any("missing anchor" in x for x in validator.check()))

    def test_missing_source_row_anchor_is_rejected(self) -> None:
        self.rewrite(
            "docs/sources.html",
            'id="S01"',
            'id="missing-S01"',
        )
        self.assertTrue(
            any("missing/mismatched anchor for S01" in x for x in validator.check())
        )

    def test_missing_source_row_causes_broken_citation_link(self) -> None:
        self.rewrite(
            "docs/sources.html",
            'id="S02"',
            'id="unrelated-source"',
        )
        self.assertTrue(any("missing anchor" in x for x in validator.check()))

    def test_wrong_source_url_is_rejected(self) -> None:
        self.rewrite(
            "docs/sources.html",
            "https://www.unesco.org/en/memory-world/chinese-oracle-bone-inscriptions",
            "https://example.invalid/not-the-source",
        )
        self.assertTrue(any("link mismatch for S01" in x for x in validator.check()))


if __name__ == "__main__":
    unittest.main()
