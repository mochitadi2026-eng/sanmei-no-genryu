# 2026年11月23日｜Horizonsの計算条件をそろえる前に

## 今回の対象
2026年夏至の国立天文台17:25とUSNO17:24（JST）の差について、11月16日のMoshier独立計算の次に必要なJPL Horizons照合の前提を点検した。

## 確認できた公式仕様
- NASA/JPL「Horizons API」v1.3（2025年6月版）：https://ssd-api.jpl.nasa.gov/doc/horizons.html
- NASA/JPL「Horizons System Manual」Observer Table：https://ssd.jpl.nasa.gov/horizons/manual.html
- 観測者表では太陽を対象、地心を観測地点として選択でき、時刻・座標・出力数量を指定する。
- UTC/TT、地心/地表、黄道座標の基準と見かけ位置の補正を同一条件にする必要がある。

## 今回試みたが未完了のこと
- 公式APIへの夏至前後の直接アクセスはこの実行環境でエラーとなり、**Horizonsの数値出力は取得できなかった**。
- Swiss .se1ファイルによる独立計算も未実施。前回のMoshier値17:24:30.8 JSTとの秒差を計算したとは言えない。
- NAOJとUSNOの丸め方式・内部秒値は未確認。1分差の原因は確定していない。

## 読者向け反映
- 第12話に、公式APIの仕様確認と数値計算実行の違い、比較条件、未実施範囲を短い解説として追加。
- 出典S122〜S123、主張C180〜C181、未解決課題を追加。
- 記事Markdownと配信用HTML、出典Markdownと配信用HTMLを同期する。

## 次回
Horizonsで太陽の地心視黄経を2026-06-21 08:24 UTC前後に出力し、列ヘッダ・時刻尺度・補正条件を記録。90度通過を補間・二分法で推定し、Moshierと同じ定義かを検証する。取得に失敗したら結果を創作しない。
