# M08｜5問判定エンジン v0.1　実装・実行記録

記録日：2026-11-02  
実装状態：**M08の純粋判定関数・11件のNodeテスト・全6,174組の総当たり・GitHub Actionsの実行成功を確認。**  
運用状態：**開発用のみ。Webフォーム未接続、出生計算未接続、正式な個人鑑定・公開診断として未承認。**  
範囲：もちもち占術独自の「今の回答傾向」レイヤーのみ。暦・十二大従星の正確性や性格測定の科学的妥当性は評価対象外。

## 1. 作成したもの

| ファイル | 目的 |
| --- | --- |
| [`m08-classifier-v0.1.mjs`](m08-classifier-v0.1.mjs) | ESM純粋関数。外部アクセスなし。カタログ検証・回答IDの厳密検査・12タイプ候補／現在フェーズ候補・未判定を返す |
| [`tests/m08-classifier.test.mjs`](tests/m08-classifier.test.mjs) | Node標準`node:test`。実際のM07質問バンクとM04タイプJSONを読み込み、11件のテストを実行 |
| [`/.github/workflows/mochimochi-m08-tests.yml`](../../.github/workflows/mochimochi-m08-tests.yml) | node 22で構文確認＋実行。該当ファイルのpush・PRで自動検証 |

注：CIのworkflowはリポジトリルートの `.github/workflows/mochimochi-m08-tests.yml`。上の相対リンクに依存せず、確実に参照する場合は[GitHub上のworkflow](https://github.com/mochitadi2026-eng/sanmei-no-genryu/blob/main/.github/workflows/mochimochi-m08-tests.yml)を利用。

## 2. 固定した入力契約

```js
const input = {
  question_set_id: 'mochimochi-five-v0.1',
  question_version: 'm07-questions-v0.1',
  tag_mapping_version: 'm07-tags-v0.1',
  type_catalog_version: '0.1',
  algorithm_version: 'mochimochi-classifier-v0.1',
  answers: { Q1: 'a', Q2: 'x', Q3: 'c', Q4: 'a', Q5: 'a' }
};
const result = classifyAnswers(input, { questionBank, typeCatalog });
// result.mochi_type_id === 'MT01'
// result.phase_id === 'FP03'
```

- 実装は質問本文を解釈・予測せず、M07の`choice.id`を対応データから参照。
- 欠損した回答がある場合 `status: incomplete` と欠けた設問IDを返すが、部分的なタイプ／フェーズを出さない。
- 実在しない選択肢や不正な型、余分な回答、余分な入力項目は `INVALID_INPUT` の例外。**回答欠損と不正IDが混ざっている場合は不正IDを先に検出**する。
- 質問・タグ・型定義・アルゴリズムの版違いを許さない。質問バンク自体の構造不良やタグの重複もカタログエラー。
- `x`は有効な回答。テーマ・フェーズ・モードは`null`になるが、「未回答」として扱わない。
- Q1／Q2／Q4が示した既知のテーマは、安定した順で`candidate_themes`に表示できる。ただし個人能力の順位ではない。

## 3. 分類の優先条件（M07候補B）

`Q4.value != null && (Q4.value === Q1.value || Q4.value === Q2.value)` を満たす場合だけ`primary_theme`候補を設定する。Q1とQ2だけの一致ではタイプを出さない。

Q5の`open`または`settle`が明確な場合、M04の「6テーマ×2モード」でMT01〜MT12のIDを特定。Q3のフェーズは独立してFP01〜FP05またはnullを返す。

タイプ未判定は`type_status: undetermined`で、理由を`NO_CORROBORATED_THEME`または`MODE_NOT_SELECTED`として記録。本人の性格に問題があるという意味ではない。本文生成時に「今回は判定しきれなかった」と自然に説明するのがM09の課題。

### 実装する際の注意

本方式はM04の「2票一致なら判定」の**旧仮案を置換**した試験用ルール。Q4もQ1/Q2と似た選択文を用いるため心理的な独立性は証明されていない。Q1・Q2の共通画像`scene_v01`は未制作。M12の利用者試験を通るまで、タイプを人格の確定分類として扱わない。

## 4. 実行記録

- 実行環境：GitHub Actions / `actions/setup-node@v4` にて **Node 22**指定、`ubuntu-latest`。
- 実行コマンド：`node --check projects/mochimochi-jutsu/m08-classifier-v0.1.mjs`、`node --check projects/mochimochi-jutsu/tests/m08-classifier.test.mjs`、`node --test projects/mochimochi-jutsu/tests/m08-classifier.test.mjs`。
- ジョブ：[`Run 41427457328`](https://github.com/mochitadi2026-eng/sanmei-no-genryu/actions/runs/41427457328)
- HEAD：`87c47c809ab26db2f5279bad65abb3cab6f53bdb`（M08検証workflow追加時点）。
- **結果：11 tests / 11 passed / 0 failed、実行ログに出力**。
- 実行した11項目：カタログ構造、Q4一致条件、Q1/Q2のみ一致の禁止、全x有効、モード・フェーズ独立、欠損状態、無効入力、版差異、カタログ改変、再現性・非破壊、全組み合わせ総当たり。
- Actionsで観測できたのはこのコミットのテスト成功。ブラウザー表示、実ユーザーの回答、デプロイは今回実施していない。

### 全組み合わせの検算

M07の設問ごとの選択肢は、Q1=7、Q2=7、Q3=6、Q4=7、Q5=3。

| 構造上の結果 | 件数 | 意味 |
| --- | ---: | --- |
| 全組み合わせ | **6,174** | 7×7×6×7×3 |
| 12タイプのいずれかを返す | **936** | 12タイプ×各78 |
| タイプ保留 | **5,238** | 条件を満たさない回答列 |
| うち一致テーマなし | 4,770 | Q4がQ1/Q2と一致しない、またはQ4が`x` |
| うちモードなし | 468 | 一致テーマはあるがQ5が`x` |
| フェーズ | FP01〜FP05すべて到達 | Q3の5つの選択肢が対応 |

**重要**：タイプ候補が出る936/6,174（約15.2%）は、全回答列を機械的に各1回数えただけ。実ユーザーの判定率・妥当性・統計的な出現率とは関係しない。候補Bが実際の体験として保留過多かどうかは未評価。M09では、タイプが出ないユーザーにも意味のある振り返り結果を見せる設計が必要。

## 5. 未解決の課題と公開ゲート

- [x] 元のM07／M04 JSONを直接読み、コードに同じタイプ名・質問文を重複記載しない。
- [x] 不正入力・不完全入力・明示保留を処理。
- [x] 問題だったQ1/Q2だけの一致を排除。
- [x] 12タイプと5フェーズの到達、全6,174通り、決定性・非破壊性の実行テスト。
- [x] GitHub ActionsにNodeの実行経路を追加し、当該コミットの成功を確認。
- [ ] タイプ未判定でも納得できる結果画面と鑑定文章（**M09**）。
- [ ] 既存十大主星10＋十二大従星12のキャラとの役割整理（M10）。
- [ ] 画像・アクセシビリティ・ブラウザ内診断UI（M11）。
- [ ] 画像の注目要素や文面の誘導、実回答の偏り、受け止め方、同意・データ保存の利用者確認（M12）。
- [ ] M06の命式エンジン一次監査残件と、本番への接続判断。**本件では一切触っていない**。

## 6. 次回再開

次は**M09｜鑑定結果の表示テンプレート**。M08の戻り値を入力として、タイプあり／タイプ保留／フェーズあり／フェーズなし／欠損／不正入力にそれぞれ適した自然な日本語を表示し、神話的象徴と本人の回答を分ける。いきなり生年月日や算命学の星を加点しない。M09での言い回しは現在の回答を指すだけで人格・将来・医療を断定しない。

参照：[開発ルール](DEVELOPMENT_RULES.md)／[タスク](TASKS.md)／[M07質問仕様](06-five-question-design-v0.1.md)。
