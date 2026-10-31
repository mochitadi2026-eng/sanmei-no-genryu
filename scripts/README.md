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

## 研究の完了は読み物の公開まで

史料調査や出典台帳の更新だけでは公開完了ではありません。今回の成果を `articles/*.md` の既存章・新章に読者向けの文章で反映し、`docs/articles/*.html` と必要な目次・前後リンクまで同時に更新します。新たな資料がなく、根拠のある記事にできない場合は「調査中・未公開」と明記します。

PR／本番コミットでは、研究と公開本文の取りこぼしを次のコマンドで形式的に検出します。

```bash
python scripts/check_publication_scope.py <base-commit-sha>
```

この仕組みは「研究・出典変更なのに、記事MarkdownとHTMLが一緒に更新されていない」ことを検出します。記事と根拠の内容上の対応、出典の真正性、実際のブラウザー表示は別途点検してください。

HTMLは静的なファイルです。GitHub Pagesで表示する場合、公開時にPythonを動かす必要はありません。
