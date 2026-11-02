# M09｜鑑定結果の文章・表示エンジン v0.1

作成・検証日：2026-11-02  
判定：**独立開発版を実装し、M08を含む23件のNodeテスト（全件成功）を確認。表示文・12タイプの名前は試用前の仮案。UI接続・利用者テスト・公開は未完了。**

## 1. 目的と設計の境界

M08の5問分類結果を、答えた本人が自分の言葉に引き寄せて考えられる短い日本語に変える。タイプを当てることより、**判定されなかった場合にも、今回の選択を振り返る材料を残す**ことを優先する。

- **もち質**：出生日から得る算命学の伝統記号の層。M06の本番検証が未完なので、今回は**未接続・保留の表示だけ**。命式、主星、従星、運気は一切作らない。
- **もち具合**：5問の現在の回答。M08の`mochi_type_id`、`candidate_themes`、`phase_id`を、その版に一致するJSONで文にする。性格・能力・医療の検査ではない。
- **もち道**：押しつけない小さな問いかけ。本人の選択を尊重し、予言や改善保証をしない。

独自創作（O）の表現であり、史実・現代算命学の伝承として説明しない。

## 2. 成果物

| ファイル | 内容 |
| --- | --- |
| [M09文章カタログ](m09-result-copy-v0.1.json) | 12タイプ分の短い振り返り＋問い、5フェーズ分の振り返り＋問い、6テーマの紹介、判定保留・未回答・入力エラー時の文章。ラベルはM03/M04を参照し重複管理しない |
| [M09表示関数](m09-result-presenter-v0.1.mjs) | `presentAnswers()`でM08分類→M09文面化。既存M08結果には`presentClassification()`。両方とも純粋関数で通信・保存なし |
| [M09自動テスト](tests/m09-result-presenter.test.mjs) | 12個の`node:test`、M03/M04のラベル・ID整合、完全回答・未判定・不正入力・不正な結果・全6,174通り |
| [GitHub Actions](https://github.com/mochitadi2026-eng/sanmei-no-genryu/blob/main/.github/workflows/mochimochi-m09-tests.yml) | Node 22で構文検査＋M08/M09テストを同時実行。変更時の回帰検証 |

開発用ファイルを親リポジトリの`projects/mochimochi-jutsu/`に配置。受付本番`tadi-sanmei-desk`、Cloudflare Workers、GAS、一般ユーザーの回答処理には接続していない。

## 3. 関数と戻り値

### 3.1 M08とM09を連続実行

```js
import { presentAnswers } from './m09-result-presenter-v0.1.mjs';

const result = presentAnswers({
  question_set_id: 'mochimochi-five-v0.1',
  question_version: 'm07-questions-v0.1',
  tag_mapping_version: 'm07-tags-v0.1',
  type_catalog_version: '0.1',
  algorithm_version: 'mochimochi-classifier-v0.1',
  answers: { Q1:'a', Q2:'x', Q3:'c', Q4:'a', Q5:'a' }
}, { questionBank, typeCatalog, indicatorCatalog, copyCatalog });
```

4つのJSONカタログは呼出元から渡す。M08とM09で質問文やタイプ名を複製しない。`presentClassification()`はM08から来た結果の構造・分類・版・カタログ整合性を検査してから表示する。将来のUIでは、可能なら`presentAnswers()`から連続実行する。

### 3.2 返す表示契約

| `status` | 画面表示 | 禁止事項 |
| --- | --- | --- |
| `ready` | `title`・`intro`・`sections`（もち質／もち具合／もち道）・`footer` | 未監査の命式を表示しない |
| `incomplete` | 回答途中の案内と`missing_questions`。**sectionsなし** | 未回答に基づくタイプ・フェーズの推測をしない |
| `input_error` | 入力形式や版を確認できない説明。**sectionsなし** | 破損したデータを強引に鑑定文へ変えない |

`ready`の`mochi_guai.type`は、M08が`classified`なら`{id,label,reflection,caution}`、`undetermined`なら`null`。型がない場合は保留理由に応じた文章を返す。

`selected_themes`はM08の`candidate_themes`をM03の名称・M09の紹介文で順序よく表示。**選択回数・得点・能力順位は表示しない**。

`phase`がある場合はM04の`FP01`〜`FP05`名称とM09の文章を返す。`null`なら今の気分について答えなかったことを穏やかに表示。

`mochi_michi.optional_question`は、まず本人が選んだ現在フェーズに関する問い、フェーズがなければタイプに関する問い、どちらもない場合は共通の問いをひとつ返す。行動を強制しない。

## 4. 文面の例

### 4.1 MT01とFP03

- タイプ候補：`MT01`「のびのびもち」（仮名称）
- 解説：考え方をひとつに決めず、別の道にも目を向ける選択が重なりました。
- フェーズ：`FP03`「ふくらみ期」＝少し試したい気分を選んだ。
- もち道：試すなら、どのくらいの小ささが心地よい？
- もち質：伝統的な記号の算出・表示は保留。

### 4.2 タイプがつかず、複数のテーマだけ残る

- タイプ名は出さない。
- 例：MOCHIとKETSUの選択があれば、その二つのテーマを「気になった選択」として表示。
- 「今回の回答では、ひとつのテーマにしぼりませんでした。」と伝え、別の行動や能力が欠けているという意味づけはしない。
- Q3で本人が選んだフェーズは独立表示できる。

### 4.3 全問で「決めない」を選んだ

- 本人の回答は**有効な完了回答**。エラーではない。
- タイプなし、テーマなし、フェーズなし。
- 共通の問い「今日の自分に、ひとつだけ問いかけてみたいことは？」を表示できる。

### 4.4 欠損・入力破損

- Q4未回答：`incomplete`。タイプやフェーズを途中まで推測しない。
- 不明ID、想定外プロパティ、バージョン不一致：`input_error`の一般向け案内。診断文章は表示しない。
- データ台帳自体の不整合やM08結果の改ざん：内部エラーとして明示的に例外。偽の正常結果を生成しない。

## 5. 実行した検証

自動検証用の[GitHub Actions Run 41450614181](https://github.com/mochitadi2026-eng/sanmei-no-genryu/actions/runs/41450614181)を取得し、実行コミット `2f3b1544a30be4c335ddaebdf6bad67c05215ba3` とNode実行ログを確認。

- 実行コマンド：`node --test projects/mochimochi-jutsu/tests/m08-classifier.test.mjs projects/mochimochi-jutsu/tests/m09-result-presenter.test.mjs`
- テスト：**23件（M08の11件＋M09の12件）／成功23／失敗0**。
- M09の全6,174通りについて、`status=ready`、3層の表示、M08と一致するタイプとフェーズ、未判定時の説明・問い、出生情報や数値評価の不出力を点検。
- 12タイプすべて到達、5フェーズすべて到達、タイプ候補936通り、保留5,238通りを再確認。
- 最初のActions実行 [Run 41450488367](https://github.com/mochitadi2026-eng/sanmei-no-genryu/actions/runs/41450488367)では、**全問「決めない」の文章に対するテストの期待語句**が実際のカタログ文言と一致せず、22成功・1失敗。テスト文言を修正して再実行し、23件成功。実際の表示内容とM08分類ロジックは変更していない。
- Nodeテストの成功は、ブラウザー画面、利用者の納得度、健康・心理・運勢の有効性の証明ではない。

## 6. 引き続き保留

- [ ] 12タイプの解説文・5フェーズの表示名は仮案。編集レビューと利用者試用が必要。
- [ ] Q1・Q2の共通画像のアクセシビリティ、回答誘導、回答偏りはM11/M12で調査。
- [ ] ユーザー同意・保存・共有・プライバシー・公開条件はM12で確認。
- [ ] M06出生計算の流派一次資料・時刻境界・長期暦の本番利用は保留。
- [ ] 既存キャラ22体はこの結果に**機械的・自動的に割り当てていない**（M10で役割整理）。
- [ ] 今回は文字データと表示用オブジェクトだけ。実際のWeb UIはM11で実装。

## 7. 次に行うこと（M10）

**十大主星10キャラ・十二大従星12式神を、伝統の象徴の案内役としてどう見せるかを整理する。** 12という数が同じという理由で独自の12もちタイプへ一対一に割り当てない。算命の伝統計算が必要な場合、M06の本番検証を通らないものを確定結果として表示しない。

参照：[AGENTS.md](AGENTS.md)／[開発原則](DEVELOPMENT_RULES.md)／[TASKS.md](TASKS.md)／[基本理論書](04-basic-theory-v0.1.md)。
