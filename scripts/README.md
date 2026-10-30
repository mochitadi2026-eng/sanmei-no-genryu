# 読み物サイトの更新方法

記事本文のマスター原稿は `articles/*.md` です。ブラウザで読むためのHTMLは `docs/` に生成します。

```bash
pip install -r requirements.txt
python scripts/build_site.py
python scripts/validate_research.py
python -m unittest discover -s tests -p 'test_*.py' -v
```

記事を加える場合は、記事のMarkdownファイルを作成し、`scripts/build_site.py` の `CHAPTERS` にファイル名・話数・タイトルを追記してから再生成してください。 `docs/style.css` はデザインのマスターファイルです。

検証スクリプトは、S番号・C番号の重複、記事タイトルの一致、Markdown表の行分断、配信HTMLの内部リンク、本文の出典参照を確認します。**史料の真偽や外部URLの有効性は自動判定しません。** GitHub Actionsでは再生成後の `git diff --exit-code -- docs/` によって、公開HTMLのコミット更新漏れも不合格にします。

HTMLは静的なファイルです。GitHub Pagesで表示する場合、公開時にPythonを動かす必要はありません。
