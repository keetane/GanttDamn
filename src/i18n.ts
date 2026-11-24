import { create } from "zustand";
export type Language = "ja" | "en";
const entries = `閉じる|Close
読み込み中|Loading
保存済み|Saved
保存エラー|Save failed
保存中…|Saving…
操作に失敗しました|Operation failed
チャートを読み込んでいます…|Loading project…
チャートタイトル|Chart title
＋ 新規作成|＋ New project
開く|Open
保存|Save
エクスポート|Export
プロジェクトと時間軸|Projects and timeline
プロジェクト|Project
プロジェクトを切り替え|Switch project
無題のプロジェクト|Untitled project
プロジェクト管理|Manage projects
時間軸の切り替え|Timeline scale
元に戻す|Undo
やり直す|Redo
元に戻す (⌘/Ctrl Z)|Undo (⌘/Ctrl Z)
やり直す (⌘/Ctrl Shift Z)|Redo (⌘/Ctrl Shift Z)
＋ 行を追加|＋ Add row
塗りつぶし|Fill
ブルー|Blue
グリーン|Green
オレンジ|Orange
レッド|Red
パープル|Purple
イエロー|Yellow
グレー|Gray
ティール|Teal
任意のHEXカラー|Custom HEX color
カスタムカラー|Custom color
塗りつぶしを解除|Clear fill
開始位置が同じか後ろの全行のバーをまとめて移動|Move this bar and all later bars in the displayed projects
日付線|Date line
日付線の位置へジャンプ|Jump to date line
今日へ|Today
バーの表示スタイル|Bar appearance
▦ セル|▦ Cell
▬ バー|▬ Bar
⚙ 表示設定|⚙ View settings
編集パネルを切り替え|Toggle properties
プロジェクトタイトル|Project title
クリックしてプロジェクトタイトルを編集|Click to edit project title
タイムライン|Timeline
単位|scale
項目|items
期間 / 画面|periods / screen
ドラッグで選択|Drag to select
パレットで色をつける|Choose a fill color
ダブルクリックで文字を編集|Double-click to edit
すべての変更は自動保存|All changes are saved automatically
◈ ローカルで保存。アイデアは、あなたの手元に。|◈ Saved locally. Your ideas stay with you.
出力プレビュー|Export preview
セルを選択して編集をはじめましょう|Select cells to start editing
⌘ / Ctrl + Z 元に戻す|⌘ / Ctrl + Z Undo
Delete 消去|Delete Clear
通知を閉じる|Dismiss notification
JSONファイルは10MBまでです|JSON files must be 10 MB or smaller
JSONからチャートを復元しました|Project restored from JSON
新しいタイムライン|New project
開始日を確認してください|Check the start date
PJ終了日は開始日以降を指定してください|Project end must be on or after the start date
無題のタイムライン|Untitled project
時間の単位を選んで、計画を描きはじめましょう。|Choose a timeline scale to start planning.
例：2027年 プロジェクト計画|Example: 2027 project plan
時間軸の単位|Timeline scale
PJ開始日|Project start
表示期間|Visible periods
PJ終了日（未設定は3年間）|Project end (default: 3 years)
キャンセル|Cancel
作成する|Create
表示設定|View settings
完了|Done
このブラウザに保存されているプロジェクト|Projects saved in this browser
＋ プロジェクトを作成|＋ Create project
JSONを読み込む|Import JSON
単位 ·|scale ·
項目 ·|items ·
編集中|Current
のコピー|copy
複製|Duplicate
プロジェクト名を入力してください|Enter a project name
プロジェクトが見つかりません|Project not found
新しいプロジェクト名|New project name
変更する|Rename
取消|Cancel
名前変更|Rename
削除しますか？|Delete this project?
削除する|Delete project
戻る|Back
編集中のチャートは削除できません|Switch projects before deleting this project
チャートを削除|Delete project
削除|Delete
プロジェクトは個別に自動保存されます。JSONでバックアップや別のブラウザへの移動ができます。|Projects are saved separately. Use JSON to back up or transfer your data.
プレビューとエクスポート|Preview and export
表示期間：|Visible range:
稼働日なし|No working days
（終了位置を含まず）|(end exclusive)
表示期間の出力プレビュー|Visible range export preview
16:9に配置|Fit to 16:9
余白|Margin
PNG解像度|PNG resolution
現在の表示期間・全行を書き出します。横スクロール位置を反映し、期間の両端をまたぐバーは範囲内だけ出力します。XLSXは編集可能なセルです。|Exports all rows within the visible range. Bars are clipped to that range. XLSX cells remain editable.
PJ全データをバックアップしました|All project data backed up
全データをバックアップ|Back up all data
を保存|Save
補足|Notes
ダブルクリックで編集|Double-click to edit
移動できません|Cannot move here
編集内容が変更されたため移動を中止しました|Move cancelled because the data changed
バーを移動しました|Moved the bar
マイルストーンを移動しました|Moved the milestone
以降のバーをまとめて移動しました|Moved this bar and all later bars
タイムライングリッド|Timeline grid
milestone列の見出し|Milestone column heading
action item列の見出し|Action item column heading
ドラッグで項目列幅を変更|Drag to resize the milestone column
現在の日付線|Current date line
年|
ドラッグして行を移動|Drag to reorder row
バーを選択して編集|Select a bar to edit
マイルストーン|Milestone
ドラッグで行の高さを変更|Drag to resize row height
新しい項目|New item
編集パネル|Properties
編集パネルを閉じる|Close properties
セルやバーを選択すると、|Select a cell or bar
ここで編集できます。|to edit its properties here.
項目名|Item name
補足テキスト|Notes
行の高さ|Row height
上へ移動|Move up
下へ移動|Move down
行を複製|Duplicate row
空行を挿入|Insert blank row
行を削除|Delete row
バー|Bar
選択範囲|Selection
バー内テキスト|Bar label
色|Color
文字色|Text color
HEXカラー|HEX color
バーのHEXカラー|Bar HEX color
文字の配置|Text alignment
左寄せ|Left
中央寄せ|Center
開始位置|Start position
終了位置|End position
バーの両端をドラッグして伸縮できます。|Drag either edge to resize the bar.
バーを削除|Delete bar
ラベル|Label
位置|Position
マイルストーンを削除|Delete milestone
パレットの色をクリックすると、選択範囲が1本のバーになります。|Choose a palette color to create a bar from the selection.
◆ マイルストーンを追加|◆ Add milestone
選択範囲を消去|Clear selection
ヒント|Tip
項目名・補足はダブルクリックで直接編集。Excelの行をコピーして貼り付けることもできます。|Double-click names and notes to edit. You can also paste rows from Excel.
表示する要素|Visibility
補足列|Notes column
グリッド線|Grid lines
年ヘッダー|Year / date header
バーの角丸|Rounded bars
レイアウト|Layout
文字サイズ|Font size
すべての行の高さ|All row heights
項目列の幅|Milestone column width
補足列の幅|Action item column width
背景色|Background color
時間軸|Timeline
PJ終了日|Project end
未設定：|Default:
（開始日から3年間）|(3 years from project start)
稼働カレンダー|Working calendar
稼働開始|Work starts
稼働終了|Work ends
稼働日|Working days
日|Day
月|Month
火|Tue
水|Wed
木|Thu
金|Fri
土|Sat
週|Week
1時間|Hour
1時間・日表示は稼働時間・稼働日のセルを表示します。週・月・Qは暦ベースです。非稼働時間のデータも保持します。|Hour and Day show working periods. Week, Month and Q use calendar periods. Hidden data is preserved.
表示範囲を変えても、バーに保存されている日付は変わりません。|Changing the view does not change the dates stored in bars.
このブラウザに保存しました|Saved in this browser
移動先の稼働日時がPJ期間外のため、ジャンプできません。|The next working time is outside the project range.
先にセルをドラッグして範囲を選択してください|Drag to select cells first
行数は500行までです|A project can have up to 500 rows
貼り付けるデータが大きすぎます|The pasted data is too large
操作に失敗しました|Operation failed
ローカル保存を利用できません。JSONに書き出してデータを保管してください。|Local storage is unavailable. Back up your data as JSON.
自動保存できませんでした。JSONでバックアップできます。|Autosave failed. Back up your data as JSON.
PJ期間を超える移動はできません|The move would exceed the project range
前のバーと重なるため、この位置には移動できません|The move would overlap an earlier bar
セル単位で移動してください|Move in whole cells
移動するバーが見つかりません|Bar not found
all表示では行構成を変更できません|Change rows in a single project
元の項目が見つかりません|Original row not found`;
const dictionary = Object.fromEntries(
  entries.split("\n").map((line) => {
    const i = line.indexOf("|");
    return [line.slice(0, i), line.slice(i + 1)];
  }),
);
let initial: Language = "ja";
try {
  if (localStorage.getItem("gantt-language") === "en") initial = "en";
} catch {}
if (typeof document !== "undefined") document.documentElement.lang = initial;
export const useLanguage = create<{
  language: Language;
  setLanguage: (language: Language) => void;
}>((set) => ({
  language: initial,
  setLanguage: (language) => {
    try {
      localStorage.setItem("gantt-language", language);
    } catch {}
    document.documentElement.lang = language;
    set({ language });
  },
}));
const days: Record<string, string> = {
  日: "Sun",
  月: "Mon",
  火: "Tue",
  水: "Wed",
  木: "Thu",
  金: "Fri",
  土: "Sat",
};
export const weekdayLabels = (language: Language) =>
  language === "en"
    ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    : ["日", "月", "火", "水", "木", "金", "土"];
export function translate(
  value: string,
  language: Language = useLanguage.getState().language,
): string {
  if (language === "ja") return value;
  if (dictionary[value] !== undefined) return dictionary[value];
  if (/^\d{4}年\d{1,2}月$/.test(value)) {
    const [y, m] = value.match(/\d+/g)!;
    return `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Number(m) - 1]} ${y}`;
  }
  if (/^\d{1,2}月$/.test(value))
    return [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ][Number(value.slice(0, -1)) - 1];
  if (/\([日月火水木金土]\)/.test(value))
    return value.replace(/\(([日月火水木金土])\)/g, (_, d) => `(${days[d]})`);
  if (/^行\d+/.test(value))
    return value
      .replace(/^行(\d+)の項目名/, "Row $1 item name")
      .replace(/^行(\d+)の補足/, "Row $1 notes")
      .replace(/^行(\d+)を移動/, "Move row $1");
  if (value.endsWith("曜日"))
    return days[value[0]] ?? value.replace("曜日", "");
  if (value.includes("次の稼働開始"))
    return value
      .replace("次の稼働開始", "Next working time:")
      .replace("へ移動しました", "");
  if (value.includes("で塗りつぶす"))
    return "Fill " + translate(value.replace("で塗りつぶす", ""), language);
  if (value.includes("を書き出しました"))
    return value.replace("を書き出しました", " exported");
  if (value.includes("セルを選択中"))
    return value.replace("セルを選択中", "cells selected");
  if (value.includes("行をコピーしました"))
    return value.replace("行をコピーしました", "rows copied");
  if (value.includes("行を貼り付けました"))
    return value.replace("行を貼り付けました", "rows pasted");
  if (value.endsWith("日") && /\d/.test(value))
    return value.replace("日", "").replace("〜", "–");
  if (value.startsWith("JSONの形式が正しくありません"))
    return "Invalid JSON. Select a GanttDamn file.";
  return value.replaceAll("〜", "–");
}
export function useI18n() {
  const { language, setLanguage } = useLanguage();
  return {
    language,
    setLanguage,
    t: (value: string) => translate(value, language),
  };
}
