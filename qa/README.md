# 暦境界の再現性試験（既存エンジン未接続）

このフォルダーは算命学の命式計算エンジン本体ではない。既存エンジンの年柱・月柱の暦上の再現性を検証するための**基準値と照合スクリプト**。

## 確認できた資料と検査対象

- 一次資料：国立天文台・2024年 [暦要項](https://eco.mtk.nao.ac.jp/koyomi/yoko/2024/rekiyou242.html)、2025年 [暦要項](https://eco.mtk.nao.ac.jp/koyomi/yoko/2025/rekiyou252.html)、2026年 [暦要項](https://eco.mtk.nao.ac.jp/koyomi/yoko/2026/rekiyou262.html)。
- 背景・流派差・留保：[干支と時刻の境界仕様](../research/sexagenary-time-calendar-boundary-spec-2026-10-31.md)。
- 2024〜2026年の毎年24節気、計72の発表日時。それぞれ前後2分の2ケースを作り、**合計144ケース**。
- 初期の試験プロファイル：立春の瞬間で年柱切替、12節の瞬間で月柱切替、12中気では月柱不変。
- 公式の公表日時は分精度。公表時刻そのものと±1分以内の厳密な秒単位判定はせず、±2分のみ検査。
- 年柱・月柱の期待値は六十干支と五虎遁による**試験用導出値**であり、現代算命学・高尾系のすべての計算仕様を確定するものではない。具体的な原典命式との独立照合も未実施。

## 実行手順

```sh
# 3年分の参照JSON内部検査（既存エンジンは実行しない）
node qa/check-pillar-engine.mjs --verify-fixture

# 元コード取得後：既存計算コードを橋渡しするアダプターを指定
node qa/check-pillar-engine.mjs --adapter ./qa/local-engine-adapter.mjs
```

アダプターの契約は`resolvePillars({localDateTime, timezone, calendarProfile})`をexportし、結果として`{yearPillar, monthPillar, status: "ok"}`を返す。入力日時はJSTのISO8601形式、タイムゾーンは`Asia/Tokyo`、試験プロファイルは`risshun-sekki-instant-jst`。

実際のv0.7エンジンの関数名・引数を推測して書き換えてはならない。既存コードを読んでから独立アダプターを作る。判定保留／例外／未定義の戻り値は成功に数えない。

実行結果：
- `--verify-fixture`成功：72節気・144件の内部整合性チェック成功。**実エンジン試験未実施。**
- GitHub Actions: 参照JSONの検査、Node構文検査、エンジン未接続（exit2）と意図した誤答（exit1）のネガティブコントロール成功。
- `--adapter`での実エンジン検証：**未実施（元ソース未取得）**。

## 未解決と次にやること

1. 公開診断サイト [sanmeigaku-character-stories](https://sanmeigaku-character-stories.mochilabo.workers.dev/diagnosis/) の既存Workers計算コード（v0.7）の元リポジトリまたは開発時エクスポートを特定する。サイトURLの閲覧可否とソースへのアクセス可否は異なる。HTMLだけではサーバー内部のソースを証明できない。
2. 元コードの版と、年柱・月柱・日柱の関数・節入り参照値・日界規則を監査する。既存の算出法を無断で変更しない。
3. 該当関数に接続するアダプターを作成し、144件の実検証を実行する。合否・未判定・具体的な不一致ケースを記録する。
4. 日柱（うるう日2024-02-29を含む60日連続）、境界時刻不明、2024/2025/2026以外の年代、二十八元、十大主星、十二大従星は**別試験が必要**。

### 履歴／所在

- `tadi-sanmei-desk`はPhase 1の応募受付機能であり、計算エンジン本体ではない。
- このPRでは受付・本番Workers・公開HTML・研究本文を変更しない。mainへの統合はレビュー後。
- この暦上の再現性試験は占いの的中や科学的な有効性の検証ではない。
