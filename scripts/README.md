# 読み物サイトの更新方法

記事本文のマスター原稿は `articles/*.md` です。ブラウザで読むためのHTMLは `docs/` に生成します。

```bash
pip install -r requirements.txt
python scripts/build_site.py
```

記事を加える場合は、記事のMarkdownファイルを作成し、`scripts/build_site.py` の `CHAPTERS` にファイル名・話数・タイトルを追記してから再生成してください。 `docs/style.css` はデザインのマスターファイルです。

HTMLは静的なファイルです。GitHub Pagesで表示する場合、公開時にPythonを動かす必要はありません。
