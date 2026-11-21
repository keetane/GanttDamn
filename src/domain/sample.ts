import { createChart, createRow, palette, uid } from "./model";
import { periodsFor } from "./timeline";
export function sampleChart() {
  const c = createChart();
  c.title = "新サービス ローンチロードマップ";
  const data: [string, string, number, number, number, string][] = [
    ["リサーチ・企画", "市場調査 / コンセプト", 0, 2, 0, "アイデアをかたちに"],
    ["要件定義", "仕様・体験の設計", 1, 3, 0, "要件の整理"],
    ["デザイン", "UI / UXデザイン", 2, 5, 4, "プロトタイプ・デザイン"],
    ["開発", "プロダクトの実装", 3, 8, 1, "開発・イテレーション"],
    ["テスト・改善", "品質確認 / ブラッシュアップ", 7, 10, 2, "検証と改善"],
    ["ローンチ", "リリース / 広報", 10, 11, 5, "公開準備"],
    ["運用・グロース", "フィードバックと改善", 11, 12, 7, "運用開始"],
  ];
  const p = periodsFor(c);
  c.rows = data.map(([title, note, s, e, color, label], i) => ({
    ...createRow(title, note),
    sortOrder: i,
    bars: [
      {
        id: uid(),
        startDate: p[s].startDate,
        endDateExclusive: p[e - 1].endDateExclusive,
        label,
        color: palette[color],
        style: "cell",
        textColor: "#ffffff",
        align: "left",
      },
    ],
  }));
  c.rows[5].milestones.push({
    id: uid(),
    date: p[11].startDate,
    label: "正式リリース",
    color: palette[3],
  });
  return c;
}
