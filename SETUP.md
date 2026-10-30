# GitHub登録・公開の状況

このリポジトリは **mochitadi2026-eng/sanmei-no-genryu** として作成済みです。

- URL: https://github.com/mochitadi2026-eng/sanmei-no-genryu
- 公開状態: **Public**（2026-10-30確認）
- 既存の診断アプリ `tadi-sanmei-desk` とは独立したリポジトリです。
- `articles/` が原稿の正本、`docs/` がWebページです。

## GitHub Pagesを公開する場合

GitHubリポジトリの **Settings → Pages** から、Deploy from a branch を選び、ブランチ `main`、フォルダ `/docs` を指定します。公開URLはGitHubでのデプロイ成功後に確認してください。現時点でPagesの有効化はしていません。

## 記事の追加方法

1. `articles/` にMarkdown原稿を追加する。
2. 出典と未確認の記述を `sources/registry.md` と `research/claims.md` で照合する。
3. `scripts/build_site.py` の `CHAPTERS` に記事を追加する。
4. `python scripts/build_site.py` で `docs/` を再生成する。
5. 目次・記事・出典リンクを確認してコミットする。

## 公開に際して

Publicリポジトリの原稿は誰でも読むことができます。史料の未確認部分は断定せず、著作権保護対象資料の長文引用や、非公開の個人情報を追加しないでください。
