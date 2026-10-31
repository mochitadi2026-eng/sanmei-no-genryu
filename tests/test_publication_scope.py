"""Regression tests for the research-to-reader release contract."""
import unittest

from scripts.check_publication_scope import publication_errors


class PublicationScopeTests(unittest.TestCase):
    def test_research_only_is_rejected(self):
        self.assertEqual(
            len(publication_errors(["research/new-investigation.md", "sources/registry.md"])),
            2,
        )

    def test_sources_only_is_rejected(self):
        self.assertEqual(len(publication_errors(["sources/registry.md"])), 2)

    def test_markdown_without_html_is_rejected(self):
        self.assertEqual(
            len(publication_errors(["research/findings.md", "articles/08-update.md"])), 1
        )

    def test_html_without_markdown_is_rejected(self):
        self.assertEqual(
            len(publication_errors(["research/findings.md", "docs/articles/08-update.html"])), 1
        )

    def test_complete_research_to_reader_update_passes(self):
        self.assertEqual(
            publication_errors(
                [
                    "research/findings.md",
                    "sources/registry.md",
                    "articles/08-update.md",
                    "docs/articles/08-update.html",
                    "docs/index.html",
                ]
            ),
            [],
        )

    def test_nonresearch_rule_updates_are_allowed(self):
        self.assertEqual(
            publication_errors(["AGENTS.md", "RULES.md", "scripts/check_publication_scope.py"]),
            [],
        )

    def test_main_site_edit_without_research_is_allowed(self):
        self.assertEqual(
            publication_errors(["articles/07-existing.md", "docs/articles/07-existing.html"]),
            [],
        )


if __name__ == "__main__":
    unittest.main()
