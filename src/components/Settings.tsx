import { useI18n, weekdayLabels } from "../i18n";
import { useChartStore } from "../store/chartStore";
import { defaultWorkCalendar, type DisplaySettings } from "../domain/model";
import { projectRange } from "../domain/timeline";
import { validDate } from "../domain/validation";
export default function Settings() {
  const { t, language, setLanguage } = useI18n();

  const { chart, edit } = useChartStore(),
    d = chart.displaySettings;
  const work = chart.workCalendar ?? defaultWorkCalendar;
  const set = <K extends keyof DisplaySettings>(
    key: K,
    value: DisplaySettings[K],
  ) =>
    edit((c) => {
      c.displaySettings[key] = value;
      if (key === "rowHeight")
        c.rows.forEach((r) => (r.height = value as number));
    });
  return (
    <div className="settings-grid">
      <section>
        <h3> {t("表示する要素")} </h3>
        {(
          [
            ["showTitle", t("チャートタイトル")],
            ["showNote", t("補足列")],
            ["showGrid", t("グリッド線")],
            ["showYear", t("年ヘッダー")],
            ["rounded", t("バーの角丸")],
          ] as const
        ).map(([key, label]) => (
          <label className="check-label" key={key}>
            <input
              type="checkbox"
              checked={
                key === "showNote" && chart.overviewMode === "projects"
                  ? false
                  : d[key]
              }
              disabled={key === "showNote" && chart.overviewMode === "projects"}
              onChange={(e) => set(key, e.target.checked)}
            />
            {label}
          </label>
        ))}
      </section>
      <section>
        <h3> {t("レイアウト")} </h3>
        {(
          [
            ["fontSize", t("文字サイズ"), 10, 28],

            ["rowHeight", t("すべての行の高さ"), 32, 120],
            ["titleWidth", t("項目列の幅"), 100, 500],
            ["noteWidth", t("補足列の幅"), 80, 400],
          ] as const
        ).map(([key, label, min, max]) => (
          <label key={key}>
            {label} <span>{d[key]}px</span>
            <input
              type="range"
              min={min}
              max={max}
              value={d[key]}
              onChange={(e) => set(key, Number(e.target.value))}
            />
          </label>
        ))}
        <label>
          {t("背景色")}{" "}
          <input
            type="color"
            value={d.background}
            onChange={(e) => set("background", e.target.value)}
          />
        </label>
      </section>
      <section>
        <h3> {t("時間軸")} </h3>
        <label>
          {t("PJ開始日")}{" "}
          <input
            type="date"
            min="1900-01-01"
            max="2190-01-01"
            value={chart.visibleStartDate}
            onChange={(e) => {
              if (
                validDate(e.target.value) &&
                (!chart.projectEndDate ||
                  e.target.value <= chart.projectEndDate)
              )
                edit((c) => {
                  c.visibleStartDate = e.target.value;
                });
            }}
          />
        </label>
        <label>
          {t("PJ終了日")}{" "}
          <input
            type="date"
            min={chart.visibleStartDate}
            max="2199-12-31"
            aria-label={t("PJ終了日")}
            value={chart.projectEndDate ?? ""}
            onChange={(e) => {
              if (
                !e.target.value ||
                (validDate(e.target.value) &&
                  e.target.value >= chart.visibleStartDate)
              )
                edit((c) => {
                  c.projectEndDate = e.target.value || undefined;
                });
            }}
          />
          <small>
            {t("未設定：")} {projectRange(chart).endDate}{" "}
            {t("（開始日から3年間）")}{" "}
          </small>
        </label>
        <label>
          {t("表示期間")}{" "}
          <input
            type="number"
            min="1"
            max="240"
            value={chart.visiblePeriodCount}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (Number.isInteger(n) && n >= 1 && n <= 240)
                edit((c) => (c.visiblePeriodCount = n));
            }}
          />
        </label>
        <h3> {t("稼働カレンダー")} </h3>
        <div className="button-pair">
          <label>
            {t("稼働開始")}{" "}
            <select
              aria-label={t("稼働開始")}
              value={work.startHour}
              onChange={(e) =>
                edit((c) => {
                  c.workCalendar = {
                    ...work,
                    startHour: Number(e.target.value),
                  };
                })
              }
            >
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h} disabled={h >= work.endHour}>
                  {h}:00
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("稼働終了")}{" "}
            <select
              aria-label={t("稼働終了")}
              value={work.endHour}
              onChange={(e) =>
                edit((c) => {
                  c.workCalendar = { ...work, endHour: Number(e.target.value) };
                })
              }
            >
              {Array.from({ length: 24 }, (_, h) => h + 1).map((h) => (
                <option key={h} value={h} disabled={h <= work.startHour}>
                  {h}:00
                </option>
              ))}
            </select>
          </label>
        </div>
        <label> {t("稼働日")} </label>
        <div className="weekday-options">
          {[1, 2, 3, 4, 5, 6, 0].map((day) => (
            <label className="check-label" key={day}>
              <input
                type="checkbox"
                aria-label={
                  language === "en"
                    ? weekdayLabels(language)[day]
                    : `${weekdayLabels(language)[day]}曜日`
                }
                checked={work.weekdays.includes(day)}
                disabled={
                  work.weekdays.length === 1 && work.weekdays.includes(day)
                }
                onChange={(e) =>
                  edit((c) => {
                    c.workCalendar = {
                      ...work,
                      weekdays: e.target.checked
                        ? [...work.weekdays, day]
                        : work.weekdays.filter((d) => d !== day),
                    };
                  })
                }
              />
              {weekdayLabels(language)[day]}
            </label>
          ))}
        </div>
        <p className="field-help">
          {t(
            "1時間・日表示は稼働時間・稼働日のセルを表示します。週・月・Qは暦ベースです。非稼働時間のデータも保持します。",
          )}{" "}
        </p>
        <p className="field-help">
          {t(
            "表示範囲を変えても、バーに保存されている日付は変わりません。",
          )}{" "}
        </p>
      </section>
    </div>
  );
}
