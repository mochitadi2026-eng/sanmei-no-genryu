# 暦境界の再現性試験（未接続）

このフォルダーは算命学の命式エンジン本体ではない。試験用に「立春の瞬間を年柱の境界、12節の瞬間を月柱の境界」と仮定した、検算のためのデータと実行器。

- 一次資料：国立天文台 [2026年暦要項](https://eco.mtk.nao.ac.jp/koyomi/yoko/2026/rekiyou262.html)
- 背景・流派差・留保：[干支と時刻の境界仕様](../research/sexagenary-time-calendar-boundary-spec-2026-10-31.md)
- 24節気の前後2分（各2件）、計48件。節12では月柱切替、中気12では切替なしを検査する。
- 公式の時刻は分単位のため、公表時刻そのものや±1分内の厳密な秒判定は行わない。
- 年柱・月柱の期待値は六十干支と五虎遁に基づく試験用導出値。既存エンジンとの照合は未実施。日柱・時柱・蔵干・十大主星・十二大従星の合否を含まない。

## 使い方

```sh
# 参照JSONの構造・一貫性のみをチェック（実エンジン試験ではない）
node qa/check-pillar-engine.mjs --verify-fixture

# 実エンジンのアダプターが入手できてから48件の照合
node qa/check-pillar-engine.mjs --adapter ./qa/local-engine-adapter.mjs
```

アダプターは`resolvePillars({localDateTime, timezone, calendarProfile})`をexportし、`{yearPillar, monthPillar, status: "ok"}`を返す。引数はJSTのISO 8601日時、`Asia/Tokyo`、`risshun-sekki-instant-jst`。**本来の関数の引数を決め打ちせず、既存実装を確認後にアダプターを作ること。** 失敗・例外・判定保留は合格に数えない。アダプター未指定時はexit 2（テスト未実施）、不一致はexit 1。

## 現状・制限（2026-11-01）

- 確認済み：国立天文台の2026年24節気・公表分時刻と照合。JSON生成時、全24件の前後連続性・節／中の分類を検査。
- 未確認：Workers上の命式エンジン本体のソース取得、計算試験48件の実行、既存仕様との関数接続、出生地・歴史的時刻対応。
- `tadi-sanmei-desk`は応募受付Phase 1であり、命式計算モジュールではない。既存受付、本番サイト、配信HTMLは変更しない。
- この試験用プロファイルと高尾系のすべての流派設定が一致するとは断定しない。占断の科学的な有効性検証ではない。
