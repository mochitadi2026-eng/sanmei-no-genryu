# もちもち占術｜開発資料の入口

更新日：2026-11-04

このフォルダには、伝統の陰陽五行・干支の象徴と本人の回答を分け、自己理解のための独自の占術を設計する資料を置く。

## B04｜2026-11-04に確定したビジュアル方針

- **[もちキャラ・ビジュアル設計 v0.1（決定事項の正本）](19-b04-mochi-visual-system-2026-11-04.md)** — **五行＝餅の素材／十二支＝餅の種類・本体／十大主星＝メイン具材／十二大従星＝器・食器**。右側の白い点目もち素体、12支の識別、不要装飾を混ぜないルール、未確定部分を区分。
- **[12支画像アセット台帳 JSON](b04-visual-asset-ledger-v0.1.json)** — BC01〜BC12の制作対象と、会話上の画像試作・GitHub未登録／未承認の区別。**画像ファイルはまだリポジトリに追加していない**。
- これはB03の暦による12×5分類規則を変更しない。5問のMT01〜12、教育用の22体とも自動的に同一視しない。B04の正式画像承認・B05・本番公開は引き続き未完。

## まず読む

1. **[基本理論書 v0.1（M05統合版）](04-basic-theory-v0.1.md)** — 理念、伝統から採用するもの、6指標、12タイプ・5フェーズ、鑑定出力、倫理、未検証事項の総合仕様
2. **[タスクボード](TASKS.md)** — 完了・保留・次回やること。次はB04（出生キャラ12体の名称・核・矛盾・モチーフ設計）／並行でN01大運検証
3. **[M01の基本理念初稿](00-foundation-v0.1.md)** — 統合前の変更経緯

- **[M06｜既存命式エンジン一次監査](05-engine-audit-2026-11-02.md)** — 実装の所在、Actionsで確認できた既存テスト、暦の検算と本番利用までの残件

- **[M07｜5問の質問と選択肢](06-five-question-design-v0.1.md)** — 読みやすい質問仕様、保留・同意・偏りの検討／[質問バンクJSON](m07-question-bank-v0.1.json)

## 商品化の実制作（2026-11-03）

- **[商品化タスクボード PK01〜PK15](PRODUCTIZATION_TASKS.md)** — 既存MK03のFREE-01／PAID-01を実物にする制作順。最初はPK01正式scene_v01画像→PK02無料Web実装→PK03商品文章、並行してPK07架空有料見本とPK13（B04）出生12キャラ。設計と実装・品質審査を分離。**現物・公開・販売の完了ではなく、G1/G2はNO-GO。**

## マーケティング・商品化監査（2026-11-03）

- [マーケティング・販売体制 総合監査 v1.0](marketing/2026-11-03-marketing-business-audit-v1.md) — 市場・ペルソナ・商品・集客・リード・CRM・販売・継続・収益・法務など14領域の不足、MK01〜MK12の継続タスクを記録。
- **[MK01｜主力顧客と提供価値提案 v1.0](marketing/MK01-customer-value-proposition-v1.md)（設計完了・市場未検証）** — P-A自己理解型を初期主力仮説に採用。5つのペインと無料／有料の価値境界を記録。
- **[MK02｜競合比較とポジショニング v1.0](marketing/MK02-competitor-positioning-2026-11-03.md)（初期設計完了・顧客検証待ち）** — しいたけ占い／動物占い／16Personalities／cocoloni／ウラナイア／おつげの公式情報を確認。物語型の自己理解と解釈の透明性を差別化仮説に。
- **[MK03｜無料MVP・有料物語鑑定 商品仕様 v1.0](marketing/MK03-product-spec-v1.md)（仕様設計完了／実装・販売は未完）** — 無料F00〜F08、有料P00〜P07、納品候補、除外範囲、公開・販売ゲートG0〜G2、受け入れ条件AC-F/Pを規定。
- **[MK04｜価格・原価・収益シナリオ v1.0](marketing/MK04-price-unit-economics-v1.md)（初期試算完了・実売上／原価未検証）**／[試算前提・シナリオJSON](marketing/MK04-cost-model-v1.json) — 無料MVPの費用配賦、買い切り鑑定の3価格帯・損益分岐、決済手数料・税の注意、変動費と工数の感度分析を整理。
- **[MK05｜法務・信頼性監査 v1.0](marketing/MK05-legal-trust-release-audit-2026-11-03.md)（設計完了・実装／公開／販売NO-GO）**／[受け入れテスト15件JSON](marketing/MK05-release-acceptance-v1.json) — 特商法、景表法、利用規約、プライバシー、同意、決済、PDF納品、返金、問い合わせ、STOP条件を公式出典と設計判断に分けて管理。
- **[MK06｜無料診断LP・CTA・画面導線 v1.0](marketing/MK06-free-lp-cta-design-v1.md)（仕様設計完了／本番・実測・G1未承認）**／[画面・CTA契約JSON](marketing/MK06-lp-flow-contract-v1.json) — ヒーローコピー、F00〜F08、CTA10件、匿名イベント候補5件、LP受け入れ12件、未公開機能の表示禁止とMK05安全条件を記録。
- **[MK07｜任意リード獲得・オプトイン・CRM v1.0](marketing/MK07-lead-optin-crm-data-lifecycle-v1.md)（設計完了／実装・配信・法務審査未実施）**／[同意・CRM・受け入れテストJSON](marketing/MK07-crm-consent-contract-v1.json) — 登録任意、本人メール確認、CRM8テーブル、自己選択テーマ、ウェルカム、停止・保存削除、LD01〜LD15を定義。無料診断の5問回答をCRMに送らない。
- **[MK08｜イベント・UTM・KPI・ファネル／ダッシュボード v1.0](marketing/MK08-measurement-funnel-dashboard-v1.md)（仕様設計完了／本番計測・実績なし）**／[イベント契約JSON](marketing/MK08-analytics-contract-v1.json) — 15イベント、17KPI、D01〜D06の運営画面、ME01〜ME16、個人IDを使わない集計案と外部送信規律の未判定事項を記録。
- **[MK09｜有料販売LP・決済・本人限定PDF・E2E試験 v1.0](marketing/MK09-paid-sales-checkout-delivery-spec-v1.md)（仕様設計完了／本番・E2E・法務審査未実施）**／[状態機械・画面・受け入れ22件JSON](marketing/MK09-sales-delivery-contract-v1.json) — P00〜P07、販売見本、注文最終確認、決済Webhook署名・冪等、PDF所有者認可・再取得、キャンセル・返金・問い合わせ、G2販売停止条件を規定。
- **[MK10｜無料診断・有料物語見本の体験レビュー設計 v1.0](marketing/MK10-user-research-review-plan-v1.md)（研究計画作成済み／募集・実測なし）**／[同意・評価票・観察・改善・受け入れテストJSON](marketing/MK10-research-review-contract-v1.json) — M09既存パケットを再利用。A群5〜8人／B群4〜6人は計画人数、A9問・B8問、P0〜P3改善ゲート、UR01〜UR16。実人生情報や個人鑑定の実検証はしない。
- **[MK11｜初期販売実験・仮価格・G2着手審査 v1.0](marketing/MK11-initial-sales-experiment-plan-v1.md)（設計完了／販売前調査・実売上なし）**／[実験・価格・KPI・停止・受け入れテストJSON](marketing/MK11-experiment-contract-v1.json) — 非取引EXP1とG2後のEXP2を分離。1,980／2,980／3,980円は仮価格、実売パイロット2,980円・上限10件・14日間は未承認の候補。KPI17、停止8、SE01〜SE16を仕様化。
- **マーケティング次の一件：MK12** 継続利用・任意共有・紹介施策の設計。MK11の価格・販売実験や利用者募集、G1/G2一般公開は未承認。
- 開発上の次の一件B04およびN01の検証は引き続き[開発タスクボード](TASKS.md)が正本。**監査記録は本番公開・課金・募集再開の承認ではない**。

## 開発ルール（次回以降も必読）

- **[AGENTS.md](AGENTS.md)** — Codex／AIがこのフォルダで作業するときの入口。既存仕様の参照順、禁止事項、M08の作業、完了報告の方法
- **[DEVELOPMENT_RULES.md](DEVELOPMENT_RULES.md)** — 事実・計算・創作の分離、変更・バージョン管理、入力検証、欠損・保留、テスト、同意・個人情報、公開判定の詳細

質問・タイプ・暦の整合性が確認できないときは結果を捏造しない。GitHub Actionsの成功と本番公開、プログラムの再現性と占いの実証的な妥当性は別。**M08とM09は開発版のコードと自動テストが成功。M10は学習用22体の連携仕様と7件の自動テストまで完了。M09.5の人間評価とM11の正式画面は未完。**

- **[M08｜判定器実装](m08-classifier-v0.1.mjs)**／[11件のNodeテスト](tests/m08-classifier.test.mjs)／[成功したCIと限界の報告](07-classifier-implementation-report-2026-11-02.md)

- **[M09｜12タイプ・5フェーズの結果文](m09-result-copy-v0.1.json)**／[表示関数](m09-result-presenter-v0.1.mjs)／[12件のテスト](tests/m09-result-presenter.test.mjs)／[M08との総合CI・23件成功の報告](08-result-presentation-2026-11-02.md)

- **[M09.5｜5問の開発プレビュー](m09-preview.html)**／[Chromiumブラウザテスト](tests/m09-preview.browser-test.mjs)／[文章評価・試用手順](M09-USER-REVIEW.md) — ブラウザ25確認項目合格。**正式画像・実利用者の文章評価は未実施**。本番公開なし

- **[M09.5｜試用パッケージ](M09-REVIEW-PACKET.md)** — 同意と質問、匿名の所見、実レビューの実施手順。実参加者の評価は未実施

- **[M10｜既存22キャラのデータ](m10-character-catalog-v0.1.json)**／[学習用の表示関数](m10-character-gallery-v0.1.mjs)／[7テスト成功の実装報告](09-character-integration-2026-11-03.md)

## 最優先｜固定の12もちキャラ／60分類（B01〜B05）

- [B01設計・研究](16-b01-birth-character-60-to-12-design-2026-11-03.md)：暦日60周期→日支で12キャラ枠→日干の五行で5属性。**構造案・正式採用前**。M08の現在の12タイプ（MT群）とは別。
- [B01日干支の独立暦日検算・60→12×5の候補関数](b01-day-cycle-and-character-study-v0.1.mjs)／[Nodeテスト](tests/b01-day-cycle-and-character-study.test.mjs)／[GitHub Actions 8件全成功](https://github.com/mochitadi2026-eng/sanmei-no-genryu/actions/runs/41576002672)
- 独立の公開暦4日と照合。既存M06の`day-pillar.js`の計算方式もコードで確認したが、**別リポジトリの実コードとの差分テストは未実施**。
- **次はB02**：日干支の多年代照合、M06日界（0時／23時）の採用判断、出生時刻不明や海外出生への保留処理。キャラの名前・画像や個人への本番適用は未着手。

## 起運方式の比較（N01）

- [現代2方式の計算差と採用判断](15-ritsun-method-comparison-2026-11-03.md)／[実装した比較器](n01-ritsun-policy-comparison-v0.1.mjs)／[追加テスト9件](tests/n01-ritsun-policy-comparison.test.mjs)
- 開発元の公表例で、**7日→四捨五入2歳運／8日→切り上げ3歳運**という差分を検算。[CI24件成功](https://github.com/mochitadi2026-eng/sanmei-no-genryu/actions/runs/41572690974)。現代流派の公式承認や実出生からの起運年齢ではない。
- 次は、順行の独立例・節入り時分・出生時刻不明の規則、採用方式を固定。**現時点で過去の転機年を個人へ割り当てない。**

## N01部分実装（暦の記号だけ）

- [史料と実装の検証報告](14-n01-daiun-nenun-sources-and-implementation-2026-11-03.md)：『三命通会』『淵海子平』、朱学院、国立天文台を区別して確認。**大運起運は未承認**。
- [国立天文台2024〜2027年立春時刻JSON](n01-naoj-risshun-2024-2027-v0.1.json)／[年干支判定関数](n01-annual-ganzhi-v0.1.mjs)／[古典起運の架空研究モデル](n01-classical-daiun-study-v0.1.mjs)／[CI 15件成功](https://github.com/mochitadi2026-eng/sanmei-no-genryu/actions/runs/41571388089)
- 本番用に計算できるのは**暦上の年の干支だけ**。古典の大運は架空数値からの研究用算術であって、現代日本の採用法・個人の起運年齢を計算したという意味ではない。2024年より前の節入りや2028年以降も対象外。

## 新規：過去の伏線を読む鑑定文

- **[N01〜N06｜年運・大運からの物語生成設計](13-annual-story-engine-design-v0.1.md)** — 暦計算→年ごとのシグナル→年の選定→独自の執筆辞書→本文→事実チェック
- **[N02｜架空年表だけを選定する関数](n02-story-anchor-selector-v0.1.mjs)**／[テスト](tests/n02-story-anchor-selector.test.mjs)
- **[N04｜架空年表から文章を組み立てる関数](n04-synthetic-story-renderer-v0.1.mjs)**／[テスト](tests/n04-synthetic-story-renderer.test.mjs)／[CI13件成功](https://github.com/mochitadi2026-eng/sanmei-no-genryu/actions/runs/41559241222)

**最重要の未解決：N01の大運の採用規則・起運境界・命式と年干支の関係の独立確認。** 試作は架空の年だけを扱い、出生情報や実個人の過去を鑑定できない。M11本番UI・M12公開ゲートも未完。

## 仕様の詳細

- [M02｜五行・干支・星の採否](01-adoption-rules-v0.1.md)／[固定記号 JSON](m02-core-symbols-v0.1.json)
- [M03｜6つのもち指標](02-six-indicators-v0.1.md)／[指標 JSON](m03-indicators-v0.1.json)
- [M04｜12タイプと5フェーズ](03-twelve-types-five-phases-v0.1.md)／[分類案 JSON](m04-types-phases-v0.1.json)

## 進捗の意味

- M01理念初稿、M02採用範囲、M03指標概念、M04分類の構造案、M05統合：**設計資料として作成済み**
- M01の3層名・M04の12タイプ／5フェーズ名：**仮称（最終承認前）**
- M06は既存コードの**一次監査記録を作成済み、ただし本番利用の判定は保留**。M07質問選択肢とタグ定義：**設計作成済み、偏り・妥当性未検証**。M08判定ロジック：**開発版として実装・自動テスト成功、本番未接続**。M09鑑定文：**表示関数・文章データと開発用HTMLに接続し、Node23件＋ブラウザ25項目成功／本番Web UI未接続**。M09.5開発プレビュー：**実ブラウザで25項目成功、ただし人間の評価・正式画像の検証は未完了**。M10キャラ連携：**学習用データ・表示関数・CI7件成功、実画像未紐付け**。M11全体試作品、M12品質・公開：**未完了**

## 境界

古典の記述、現行算命学の計算方法、もちもち独自の創作を区別する。命式計算の検証が終わるまで、生年月日による結果を正しいと保証しない。自己理解の演出と心理学的な特性測定は別。画像質問は医療・心理検査ではない。

このリポジトリは公開されている。実際の相談・生年月日・回答など個人データをコミットしない。

原典研究：[算命の源流](../../README.md)／[研究ルール](../../RULES.md)／[関連する第15話](../../articles/15-building-an-original-reading.md)

## B02の後続検証（2026-11-03）

[B02報告](17-b02-real-day-engine-and-boundary-audit-2026-11-03.md)・[監査Draft PR #33](https://github.com/mochitadi2026-eng/tadi-sanmei-desk/pull/33)に、既存M06での公開暦11日および独立JDN算式73,049日との照合を記録。[CIではB02 19件・全体622件成功](https://github.com/mochitadi2026-eng/tadi-sanmei-desk/actions/runs/41578987575)。学校の日界の正式採用はB03で検討。既存のB02未実施という記述は作成当時の履歴。

## B03正式方針｜独自もちキャラは民用日0時区切り（2026-11-03）

- [採用した独自ルールと学校資料の区別](18-b03-civil-day-adoption-and-evidence-2026-11-03.md)：**日本で登録されたグレゴリオ暦の出生日・午前0時で日を切り替え**、日支12キャラ×日干の五行5属性＝60分類。算命学の全流派で共通する公式規則と主張しない。
- [B03採用ルールコード](b03-adopted-birth-character-rule-v1.mjs)／[単体テスト](tests/b03-adopted-birth-character-rule.test.mjs)／[CI全16件成功](https://github.com/mochitadi2026-eng/sanmei-no-genryu/actions/runs/41600762465)。
- 既存M06の23時台保留と節入り判定は**変更していない**。学校認証・性格妥当性・本番公開の承認とは別。**次はB04で12キャラを設計する**。上部の古いB02・B03表現は当時の履歴。
