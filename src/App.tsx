import { useI18n, weekdayLabels } from "./i18n";
import {
  ALL_PROJECTS,
  ALL_PROJECT_NAMES,
  overviewChart,
  splitOverview,
} from "./domain/overview";
import { chartForDisplay, displayPeriods } from "./domain/displayWindow";
import { useEffect, useRef, useState, useCallback } from "react";
import type { ReactNode } from "react";
import {
  createChart,
  createRow,
  palette,
  scaleLabels,
  uid,
  type Chart,
  type TimeScale,
} from "./domain/model";
import { paint } from "./domain/edit";
import {
  changeTimeScale,
  defaultPeriodCounts,
  dateString,
  periodsFor,
  projectRange,
  todayJumpTarget,
} from "./domain/timeline";
import { validateChart, validDate } from "./domain/validation";
import { useChartStore } from "./store/chartStore";
import * as db from "./storage/db";
import {
  chartSvg,
  defaultExportOptions,
  download,
  exportPng,
  exportSvg,
  exportXlsx,
  filename,
} from "./export/chartExport";
import Grid from "./components/Grid";
import Inspector from "./components/Inspector";
import Settings from "./components/Settings";
let saveQueue = Promise.resolve();
const persist = (c: Chart) => {
  const task = saveQueue
    .catch(() => {})
    .then(async () => {
      if (c.overviewProjects) await db.saveCharts(splitOverview(c), true);
      else await db.saveChart(c);
      await db.saveLast(c.id);
    });
  saveQueue = task;
  return task;
};
function Modal({
  title,
  children,
  onClose,
  wide = false,
  message,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  message?: string;
}) {
  const { t, language, setLanguage } = useI18n();

  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current!;
    el.showModal();
    return () => el.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "modal-wide" : ""}`}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-heading">
        <h2>{title}</h2>
        <button
          className="icon-button"
          aria-label={t("閉じる")}
          onClick={onClose}
        >
          ×
        </button>
      </div>
      {children}
      {message && (
        <div className="modal-notice" role="status">
          {t(message)}
        </div>
      )}
    </dialog>
  );
}
export default function App() {
  const { t, language, setLanguage } = useI18n();

  const {
    chart,
    selection,
    selectedBar,
    selectedMilestone,
    past,
    future,
    edit,
    load,
    select,
    undo,
    redo,
  } = useChartStore();
  const [ready, setReady] = useState(false),
    [saveStatus, setSaveStatus] = useState(t("読み込み中")),
    [message, setMessage] = useState(""),
    [panel, setPanel] = useState(true),
    [modal, setModal] = useState<
      "new" | "library" | "settings" | "export" | null
    >(null),
    [charts, setCharts] = useState<Chart[]>([]),
    [activeColor, setActiveColor] = useState(palette[0]),
    [newScale, setNewScale] = useState<TimeScale>("month"),
    [newTitle, setNewTitle] = useState(""),
    [newStart, setNewStart] = useState(dateString(new Date())),
    [newCount, setNewCount] = useState(12),
    [options, setOptions] = useState(defaultExportOptions),
    [busy, setBusy] = useState(false),
    [deleteId, setDeleteId] = useState<string | null>(null);
  const [damnMode, setDamnMode] = useState(false);
  const [viewStartIndex, setViewStartIndex] = useState(0);
  const onViewportChange = useCallback(
    (index: number) => setViewStartIndex(index),
    [],
  );
  const displayOptions = { ...options, startIndex: viewStartIndex };
  const [todayJumpRequest, setTodayJumpRequest] = useState(0);
  const [newEnd, setNewEnd] = useState("");
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const notify = (s: string) => setMessage(s);
  const safe = async (fn: () => Promise<void>) => {
    try {
      await fn();
    } catch (e) {
      notify(e instanceof Error ? e.message : t("操作に失敗しました"));
    }
  };
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [list, last] = await Promise.all([
          db.listCharts(),
          db.readLast(),
        ]);
        if (cancelled) return;
        setCharts(list);
        if (list.length)
          load(
            last === ALL_PROJECTS || last === ALL_PROJECT_NAMES
              ? overviewChart(
                  list,
                  list[0],
                  last === ALL_PROJECT_NAMES ? "projects" : "items",
                )
              : (list.find((c) => c.id === last) ?? list[0]),
          );
        else await persist(useChartStore.getState().chart);
        if (cancelled) return;
        setSaveStatus(t("保存済み"));
      } catch {
        if (cancelled) return;
        notify(
          t(
            "ローカル保存を利用できません。JSONに書き出してデータを保管してください。",
          ),
        );
        setSaveStatus(t("保存エラー"));
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setSaveStatus(t("保存中…"));
    const timer = setTimeout(() => {
      persist(chart)
        .then(() => {
          if (!cancelled) setSaveStatus(t("保存済み"));
        })
        .catch(() => {
          if (!cancelled) {
            setSaveStatus(t("保存エラー"));
            notify(t("自動保存できませんでした。JSONでバックアップできます。"));
          }
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [chart, ready]);
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(""), 5500);
    return () => clearTimeout(t);
  }, [message]);
  useEffect(() => {
    const editing = (el: EventTarget | null) =>
      el instanceof HTMLElement &&
      (["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) ||
        el.isContentEditable);
    const key = (e: KeyboardEvent) => {
      if (editing(e.target) || document.querySelector("dialog[open]")) return;
      const s = useChartStore.getState();
      if (s.chart.overviewProjects && !(e.ctrlKey || e.metaKey)) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? s.redo() : s.undo();
      }
      if (s.chart.overviewProjects) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        if (!s.selection) return;
        e.preventDefault();
        s.edit((c) => {
          if (s.selectedBar)
            c.rows.forEach(
              (r) => (r.bars = r.bars.filter((b) => b.id !== s.selectedBar)),
            );
          else if (s.selectedMilestone)
            c.rows.forEach(
              (r) =>
                (r.milestones = r.milestones.filter(
                  (m) => m.id !== s.selectedMilestone,
                )),
            );
          else paint(c, s.selection!, null);
        });
        s.select(s.selection);
      }
    };
    const copy = (e: ClipboardEvent) => {
      if (editing(e.target) || document.querySelector("dialog[open]")) return;
      const s = useChartStore.getState(),
        sel = s.selection;
      if (!sel) return;
      const rows = s.chart.rows.slice(
        Math.min(sel.rowStart, sel.rowEnd),
        Math.max(sel.rowStart, sel.rowEnd) + 1,
      );
      e.clipboardData?.setData(
        "text/plain",
        rows.map((r) => `${r.title}\t${r.note}`).join("\n"),
      );
      e.preventDefault();
      notify(t(`${rows.length}行をコピーしました`));
    };
    const paste = (e: ClipboardEvent) => {
      if (editing(e.target) || document.querySelector("dialog[open]")) return;
      const text = e.clipboardData?.getData("text/plain");
      if (!text || useChartStore.getState().chart.overviewProjects) return;
      e.preventDefault();
      if (text.length > 1000000) {
        notify(t("貼り付けるデータが大きすぎます"));
        return;
      }
      const lines = text.replace(/\r\n?/g, "\n").replace(/\n$/, "").split("\n");
      const s = useChartStore.getState(),
        start = s.selection
          ? Math.min(s.selection.rowStart, s.selection.rowEnd)
          : s.chart.rows.length;
      if (start + lines.length > 500) {
        notify(t("行数は500行までです"));
        return;
      }
      s.edit((c) => {
        lines.forEach((line, i) => {
          const [title = "", note = ""] = line.split("\t");
          if (!c.rows[start + i]) c.rows.push(createRow());
          c.rows[start + i].title = title.slice(0, 1000);
          c.rows[start + i].note = note.slice(0, 5000);
        });
      });
      notify(t(`${lines.length}行を貼り付けました`));
    };
    window.addEventListener("keydown", key);
    window.addEventListener("copy", copy);
    window.addEventListener("paste", paste);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("copy", copy);
      window.removeEventListener("paste", paste);
    };
  }, []);
  const colorize = (color: string) => {
    setActiveColor(color);
    if (!selection) {
      notify(t("先にセルをドラッグして範囲を選択してください"));
      return;
    }
    edit((c) => {
      if (selectedBar) {
        const b = c.rows
          .flatMap((r) => r.bars)
          .find((b) => b.id === selectedBar);
        if (b) b.color = color;
      } else if (selectedMilestone) {
        const m = c.rows
          .flatMap((r) => r.milestones)
          .find((m) => m.id === selectedMilestone);
        if (m) m.color = color;
      } else paint(c, selection, color);
    });
  };
  const openLibrary = () =>
    safe(async () => {
      await persist(chart);
      setCharts(await db.listCharts());
      setModal("library");
      setDeleteId(null);
    });
  const refreshProjects = async () => {
    const list = await db.listCharts();
    setCharts(list);
    const current = useChartStore.getState().chart;
    if (current.overviewProjects) load(overviewChart(list, current));
  };
  const switchAll = async (mode: "items" | "projects" = "items") => {
    await persist(chart);
    const list = await db.listCharts();
    load(overviewChart(list, chart, mode));
    setCharts(list);
    await db.saveLast(mode === "projects" ? ALL_PROJECT_NAMES : ALL_PROJECTS);
    setModal(null);
  };
  const switchChart = async (c: Chart) => {
    await persist(chart);
    const saved = await db.listCharts();
    const target = saved.find((item) => item.id === c.id) ?? c;
    load(target);
    await persist(target);
    setCharts(await db.listCharts());
    setModal(null);
  };
  const exportFile = (kind: "png" | "svg" | "xlsx" | "json") =>
    safe(async () => {
      setBusy(true);
      try {
        if (kind === "svg") exportSvg(chart, displayOptions);
        if (kind === "png") await exportPng(chart, displayOptions);
        if (kind === "xlsx") await exportXlsx(chart, viewStartIndex);
        if (kind === "json")
          download(
            new Blob(
              [JSON.stringify(chartForDisplay(chart, viewStartIndex), null, 2)],
              {
                type: "application/json",
              },
            ),
            filename(chart) + ".json",
          );
        notify(t(`${kind.toUpperCase()}を書き出しました`));
      } finally {
        setBusy(false);
      }
    });

  const selectedCount = selection
    ? (Math.abs(selection.rowStart - selection.rowEnd) + 1) *
      (Math.abs(selection.colStart - selection.colEnd) + 1)
    : 0;
  return (
    <div className="app-shell" aria-busy={!ready}>
      {!ready && (
        <div className="loading-overlay" role="status">
          {t("チャートを読み込んでいます…")}{" "}
        </div>
      )}
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">
            <i />
            <i />
            <i />
          </span>
          <span>
            Gantt<span className="brand-light">Damn</span>
          </span>
        </div>
        <div className="topbar-divider" />
        <div className="document-title">
          <input
            aria-label={t("チャートタイトル")}
            value={chart.title}
            readOnly={!!chart.overviewProjects}
            maxLength={200}
            onChange={(e) => edit((c) => (c.title = e.target.value))}
          />
          <span
            className={t(
              `save-status ${saveStatus === "保存エラー" ? "save-error" : ""}`,
            )}
          >
            <span /> {t(saveStatus)}
          </span>
        </div>
        <nav className="project-strip" aria-label={t("プロジェクト")}>
          <label>
            {t("プロジェクト")}{" "}
            <select
              aria-label={t("プロジェクトを切り替え")}
              value={chart.id}
              disabled={!ready}
              onChange={(e) => {
                if (
                  e.target.value === ALL_PROJECTS ||
                  e.target.value === ALL_PROJECT_NAMES
                ) {
                  safe(() =>
                    switchAll(
                      e.target.value === ALL_PROJECT_NAMES ? "projects" : "items",
                    ),
                  );
                  return;
                }
                const target = charts.find((c) => c.id === e.target.value);
                if (target) safe(() => switchChart(target));
              }}
            >
              {chart.id !== ALL_PROJECTS && (
                <option value={ALL_PROJECTS}>all</option>
              )}
              {chart.id !== ALL_PROJECT_NAMES && (
                <option value={ALL_PROJECT_NAMES}>all project name</option>
              )}
              <option value={chart.id}>
                {chart.title || t("無題のプロジェクト")}
              </option>
              {charts
                .filter((c) => c.id !== chart.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
            </select>
          </label>
          <button onClick={openLibrary} disabled={!ready}>
            {t("プロジェクト管理")}{" "}
          </button>
        </nav>
        <div className="top-actions">
          <button
            disabled={!ready}
            onClick={() => {
              setNewTitle("");
              setNewEnd("");
              setModal("new");
            }}
          >
            {t("＋ 新規作成")}{" "}
          </button>
          <button disabled={!ready} onClick={openLibrary}>
            {t("開く")}{" "}
          </button>
          <button
            disabled={!ready}
            onClick={() =>
              safe(async () => {
                await persist(chart);
                setSaveStatus(t("保存済み"));
                notify(t("このブラウザに保存しました"));
              })
            }
          >
            {t("保存")}{" "}
          </button>
          <button
            className="language-toggle"
            onClick={() => setLanguage(language === "ja" ? "en" : "ja")}
            aria-label={language === "ja" ? "English" : "日本語"}
          >
            {language === "ja" ? "English" : "日本語"}
          </button>
          <button className="primary" onClick={() => setModal("export")}>
            <span>↥</span> {t("エクスポート")}{" "}
          </button>
        </div>
      </header>
      <div className="toolbar">
        <div className="toolbar-group">
          <button
            className="icon-button"
            aria-label={t("元に戻す")}
            title={t("元に戻す (⌘/Ctrl Z)")}
            disabled={!past.length}
            onClick={undo}
          >
            ↶
          </button>
          <button
            className="icon-button"
            aria-label={t("やり直す")}
            title={t("やり直す (⌘/Ctrl Shift Z)")}
            disabled={!future.length}
            onClick={redo}
          >
            ↷
          </button>
        </div>
        <div className="toolbar-group">
          <button
            disabled={!!chart.overviewProjects}
            onClick={() =>
              edit((c) => {
                if (c.rows.length >= 500) return;
                const r = createRow();
                r.height = c.displaySettings.rowHeight;
                c.rows.push(r);
              })
            }
          >
            {t("＋ 行を追加")}{" "}
          </button>
        </div>
        <fieldset
          disabled={!!chart.overviewProjects}
          className="toolbar-group palette"
        >
          <span className="toolbar-label"> {t("塗りつぶし")} </span>
          {palette.map((color, i) => (
            <button
              aria-label={t(
                `${["ブルー", "グリーン", "オレンジ", "レッド", "パープル", "イエロー", "グレー", "ティール"][i]}で塗りつぶす`,
              )}
              title={color}
              className={`swatch ${activeColor === color ? "active" : ""}`}
              style={{ background: color }}
              key={color}
              onClick={() => colorize(color)}
            />
          ))}
          <label className="custom-color" title={t("任意のHEXカラー")}>
            <input
              type="color"
              aria-label={t("カスタムカラー")}
              value={activeColor}
              onChange={(e) => colorize(e.target.value)}
            />
            ＋
          </label>
          <button
            className="icon-button eraser"
            aria-label={t("塗りつぶしを解除")}
            disabled={!selection}
            onClick={() => {
              edit((c) => paint(c, selection!, null));
              select(selection);
            }}
          >
            ⌫
          </button>
        </fieldset>
        <div className="time-scale-switch" aria-label={t("時間軸の切り替え")}>
          {(["hour", "day", "week", "month", "quarter"] as const).map(
            (scale) => (
              <button
                key={scale}
                aria-pressed={chart.timeScale === scale}
                className={chart.timeScale === scale ? "active" : ""}
                onClick={() => {
                  edit((c) => changeTimeScale(c, scale));
                  select(null);
                }}
              >
                {t(scaleLabels[scale])}
              </button>
            ),
          )}
        </div>
        <div className="toolbar-spacer" />
        <button
          className={`damn-toggle ${damnMode ? "active" : ""}`}
          aria-pressed={damnMode}
          title={t("開始位置が同じか後ろの全行のバーをまとめて移動")}
          onClick={() => setDamnMode((v) => !v)}
        >
          Damn it
        </button>
        <button
          className={`today-toggle ${chart.displaySettings.showToday !== false ? "active" : ""}`}
          aria-pressed={chart.displaySettings.showToday !== false}
          onClick={() =>
            edit((c) => {
              c.displaySettings.showToday =
                c.displaySettings.showToday === false;
            })
          }
        >
          <span aria-hidden="true">│</span> {t("日付線")}{" "}
        </button>
        <button
          className="today-jump"
          title={t("日付線の位置へジャンプ")}
          onClick={() => {
            const target = todayJumpTarget(chart);
            if (!target) {
              notify(
                t("移動先の稼働日時がPJ期間外のため、ジャンプできません。"),
              );
              return;
            }
            if (
              chart.displaySettings.showToday === false ||
              target.visibleStartDate !== chart.visibleStartDate ||
              target.visiblePeriodCount !== chart.visiblePeriodCount
            ) {
              edit((c) => {
                c.displaySettings.showToday = true;
                c.visibleStartDate = target.visibleStartDate;
                c.visiblePeriodCount = target.visiblePeriodCount;
              });
            }
            setTodayJumpRequest((n) => n + 1);
            if (target.adjusted)
              notify(
                t(
                  `次の稼働開始 ${target.targetDate.replace("T", " ")} へ移動しました`,
                ),
              );
          }}
        >
          {t("今日へ")}{" "}
        </button>
        <div className="segmented" aria-label={t("バーの表示スタイル")}>
          <button
            className={
              chart.displaySettings.barStyle === "cell" ? "active" : ""
            }
            onClick={() =>
              edit((c) => {
                c.displaySettings.barStyle = "cell";
                c.rows.forEach((r) =>
                  r.bars.forEach((b) => (b.style = "cell")),
                );
              })
            }
          >
            {t("▦ セル")}{" "}
          </button>
          <button
            className={chart.displaySettings.barStyle === "bar" ? "active" : ""}
            onClick={() =>
              edit((c) => {
                c.displaySettings.barStyle = "bar";
                c.rows.forEach((r) => r.bars.forEach((b) => (b.style = "bar")));
              })
            }
          >
            {t("▬ バー")}{" "}
          </button>
        </div>
        <button
          className="settings-button"
          onClick={() => setModal("settings")}
        >
          {t("⚙ 表示設定")}{" "}
        </button>
        <button
          className={`icon-button ${panel ? "pressed" : ""}`}
          aria-label={t("編集パネルを切り替え")}
          onClick={() => setPanel((v) => !v)}
        >
          ▥
        </button>
      </div>
      <main className="workspace">
        <section className="canvas-area">
          <div className="canvas-heading">
            <div>
              <h1>
                {chart.displaySettings.showTitle ? (
                  <input
                    readOnly={!!chart.overviewProjects}
                    className="project-title-input"
                    aria-label={t("プロジェクトタイトル")}
                    title={t("クリックしてプロジェクトタイトルを編集")}
                    value={chart.title}
                    maxLength={200}
                    placeholder={t("プロジェクトタイトル")}
                    onChange={(e) =>
                      edit((c) => {
                        c.title = e.target.value;
                      })
                    }
                  />
                ) : (
                  t("タイムライン")
                )}
              </h1>
            </div>
            <div className="timeline-badge">
              <span>
                {t(scaleLabels[chart.timeScale])} {t("単位")}{" "}
              </span>
              <span>
                {projectRange(chart).startDate.replaceAll("-", ".")} —{" "}
                {projectRange(chart).endDate.replaceAll("-", ".")}
              </span>
            </div>
          </div>
          <div className="chart-card">
            <div className="chart-card-heading">
              <span>
                <i /> {t("タイムライン")}{" "}
              </span>
              <span>
                {chart.overviewMode === "projects"
                  ? `${chart.overviewProjects?.length ?? 0} ${t("プロジェクト")}`
                  : `${chart.rows.length} ${t("項目")}`} <b>·</b>{" "}
                {chart.visiblePeriodCount} {t("期間 / 画面")}{" "}
              </span>
            </div>
            <Grid
              damnMode={damnMode}
              onFeedback={notify}
              todayJumpRequest={todayJumpRequest}
              onViewportChange={onViewportChange}
            />
            <div className="chart-footnote">
              <span>
                {t("ドラッグで選択")} <b>·</b> {t("パレットで色をつける")}{" "}
                <b>·</b> {t("ダブルクリックで文字を編集")}{" "}
              </span>
              <span> {t("すべての変更は自動保存")} </span>
            </div>
          </div>
          <div className="canvas-bottom">
            <span> {t("◈ ローカルで保存。アイデアは、あなたの手元に。")} </span>
            <button onClick={() => setModal("export")}>
              {" "}
              {t("出力プレビュー")}{" "}
            </button>
          </div>
        </section>
        {panel && !chart.overviewProjects && (
          <Inspector onClose={() => setPanel(false)} />
        )}
      </main>
      <footer className="statusbar">
        <span>
          <span className="status-dot" />
          {selectedCount
            ? t(`${selectedCount} セルを選択中`)
            : t("セルを選択して編集をはじめましょう")}
        </span>
        <span>
          {t("⌘ / Ctrl + Z 元に戻す")} <b>·</b> {t("Delete 消去")} <b>·</b>{" "}
          {chart.timeScale.toUpperCase()}
        </span>
      </footer>
      {message && !modal && (
        <div role="status" className="toast">
          {t(message)}
          <button aria-label={t("通知を閉じる")} onClick={() => setMessage("")}>
            ×
          </button>
        </div>
      )}
      <input
        ref={fileInput}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          safe(async () => {
            if (file.size > 10000000)
              throw new Error(t("JSONファイルは10MBまでです"));
            const data = JSON.parse(await file.text());
            if (
              data &&
              data.schemaVersion === 1 &&
              Array.isArray(data.projects)
            ) {
              if (!data.projects.length || data.projects.length > 1000)
                throw new Error(t("JSONの形式が正しくありません"));
              const imported = data.projects.map((item: unknown) => ({
                ...validateChart(item),
                id: uid(),
                updatedAt: new Date().toISOString(),
              }));
              await persist(chart);
              await db.saveCharts(imported);
              const list = await db.listCharts();
              setCharts(list);
              load(overviewChart(list, imported[0]));
              await db.saveLast(ALL_PROJECTS);
              setModal(null);
              notify(t("JSONからチャートを復元しました"));
              return;
            }
            const imported = validateChart(data);
            imported.id = uid();
            imported.updatedAt = new Date().toISOString();
            await switchChart(imported);
            notify(t("JSONからチャートを復元しました"));
          });
        }}
      />
      {modal === "new" && (
        <Modal
          message={t(message)}
          title={t("新しいタイムライン")}
          onClose={() => setModal(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              safe(async () => {
                if (!validDate(newStart))
                  throw new Error(t("開始日を確認してください"));
                if (newEnd && (!validDate(newEnd) || newEnd < newStart))
                  throw new Error(t("PJ終了日は開始日以降を指定してください"));
                const c = createChart(newScale, newStart, newCount);
                if (newEnd) c.projectEndDate = newEnd;
                c.title = newTitle.trim() || t("無題のタイムライン");
                await switchChart(c);
              });
            }}
          >
            <p className="modal-description">
              {t("時間の単位を選んで、計画を描きはじめましょう。")}{" "}
            </p>
            <label>
              {t("チャートタイトル")}{" "}
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={t("例：2027年 プロジェクト計画")}
                maxLength={200}
              />
            </label>
            <label> {t("時間軸の単位")} </label>
            <div className="scale-options">
              {(["hour", "day", "week", "month", "quarter"] as const).map(
                (s) => (
                  <button
                    className={newScale === s ? "active" : ""}
                    type="button"
                    key={s}
                    onClick={() => {
                      setNewScale(s);
                      setNewCount(defaultPeriodCounts[s]);
                    }}
                  >
                    <strong>{s[0].toUpperCase() + s.slice(1)}</strong>
                    <span>
                      {t(scaleLabels[s])} {t("単位")}{" "}
                    </span>
                  </button>
                ),
              )}
            </div>
            <div className="button-pair">
              <label>
                {t("PJ開始日")}{" "}
                <input
                  type="date"
                  required
                  min="1900-01-01"
                  max="2190-01-01"
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                />
              </label>
              <label>
                {t("表示期間")}{" "}
                <input
                  type="number"
                  required
                  min="1"
                  max="240"
                  value={newCount}
                  onChange={(e) => setNewCount(Number(e.target.value))}
                />
              </label>
            </div>
            <label>
              {t("PJ終了日（未設定は3年間）")}{" "}
              <input
                type="date"
                min={newStart}
                max="2199-12-31"
                value={newEnd}
                onChange={(e) => setNewEnd(e.target.value)}
              />
            </label>
            <div className="modal-actions">
              <button type="button" onClick={() => setModal(null)}>
                {t("キャンセル")}{" "}
              </button>
              <button className="primary" type="submit">
                {t("作成する")}{" "}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {modal === "settings" && (
        <Modal
          message={t(message)}
          title={t("表示設定")}
          onClose={() => setModal(null)}
          wide
        >
          <Settings />
          <div className="modal-actions">
            <button className="primary" onClick={() => setModal(null)}>
              {t("完了")}{" "}
            </button>
          </div>
        </Modal>
      )}
      {modal === "library" && (
        <Modal
          message={t(message)}
          title={t("プロジェクト管理")}
          onClose={() => setModal(null)}
          wide
        >
          <div className="library-toolbar">
            <p> {t("このブラウザに保存されているプロジェクト")} </p>
            <button
              onClick={() => {
                setNewTitle("");
                setNewEnd("");
                setModal("new");
              }}
            >
              {t("＋ プロジェクトを作成")}{" "}
            </button>
            <button onClick={() => fileInput.current?.click()}>
              {t("JSONを読み込む")}{" "}
            </button>
          </div>
          <div className="chart-list">
            {charts.map((c) => (
              <div
                className={`library-item ${c.id === chart.id ? "current" : ""}`}
                key={c.id}
              >
                <button
                  className="library-open"
                  onClick={() => safe(() => switchChart(c))}
                >
                  <span className="mini-chart">▤</span>
                  <span>
                    <strong>{c.title}</strong>
                    <small>
                      {t(scaleLabels[c.timeScale])} {t("単位 ·")}{" "}
                      {c.rows.length} {t("項目 ·")}{" "}
                      {new Date(c.updatedAt).toLocaleString("ja-JP")}
                    </small>
                  </span>
                  {c.id === chart.id && <em> {t("編集中")} </em>}
                </button>
                <button
                  onClick={() =>
                    safe(async () => {
                      const copy = structuredClone(c);
                      copy.id = uid();
                      copy.title = (copy.title + t(" のコピー")).slice(0, 200);
                      copy.updatedAt = new Date().toISOString();
                      await db.saveChart(copy);
                      await refreshProjects();
                    })
                  }
                >
                  {t("複製")}{" "}
                </button>
                {renameId === c.id ? (
                  <form
                    className="rename-project"
                    onSubmit={(e) => {
                      e.preventDefault();
                      safe(async () => {
                        const title = renameTitle.trim();
                        if (!title)
                          throw new Error(
                            t("プロジェクト名を入力してください"),
                          );
                        const list = await db.listCharts();
                        const target = list.find((item) => item.id === c.id);
                        if (!target)
                          throw new Error(t("プロジェクトが見つかりません"));
                        if (c.id === chart.id) {
                          edit((d) => {
                            d.title = title;
                          });
                          await persist(useChartStore.getState().chart);
                        } else {
                          target.title = title;
                          target.updatedAt = new Date().toISOString();
                          await db.saveChart(target);
                        }
                        await refreshProjects();
                        setRenameId(null);
                      });
                    }}
                  >
                    <input
                      autoFocus
                      aria-label={t("新しいプロジェクト名")}
                      maxLength={200}
                      value={renameTitle}
                      onChange={(e) => setRenameTitle(e.target.value)}
                    />
                    <button type="submit"> {t("変更する")} </button>
                    <button type="button" onClick={() => setRenameId(null)}>
                      {t("取消")}{" "}
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => {
                      setRenameId(c.id);
                      setRenameTitle(c.title);
                    }}
                  >
                    {t("名前変更")}{" "}
                  </button>
                )}
                {deleteId === c.id ? (
                  <div className="delete-confirm">
                    <span> {t("削除しますか？")} </span>
                    <button
                      className="danger-link"
                      disabled={c.id === chart.id}
                      onClick={() =>
                        safe(async () => {
                          await db.deleteChart(c.id);
                          await refreshProjects();
                          setDeleteId(null);
                        })
                      }
                    >
                      {t("削除する")}{" "}
                    </button>
                    <button onClick={() => setDeleteId(null)}>
                      {" "}
                      {t("戻る")}{" "}
                    </button>
                  </div>
                ) : (
                  <button
                    disabled={c.id === chart.id}
                    title={
                      c.id === chart.id
                        ? t("編集中のチャートは削除できません")
                        : t("チャートを削除")
                    }
                    onClick={() => setDeleteId(c.id)}
                  >
                    {t("削除")}{" "}
                  </button>
                )}
              </div>
            ))}
          </div>
          <p className="field-help">
            {t(
              "プロジェクトは個別に自動保存されます。JSONでバックアップや別のブラウザへの移動ができます。",
            )}{" "}
          </p>
        </Modal>
      )}
      {modal === "export" && (
        <Modal
          message={t(message)}
          title={t("プレビューとエクスポート")}
          onClose={() => setModal(null)}
          wide
        >
          <p className="field-help" data-testid="export-range">
            {t("表示期間：")}{" "}
            {displayPeriods(chart, viewStartIndex)[0]?.startDate ??
              t("稼働日なし")}{" "}
            〜{" "}
            {displayPeriods(chart, viewStartIndex).at(-1)?.endDateExclusive ??
              "—"}
            {t("（終了位置を含まず）")}{" "}
          </p>
          <div className="preview-area">
            <img
              src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(chartSvg(chart, displayOptions))}`}
              alt={t("表示期間の出力プレビュー")}
            />
          </div>
          <div className="export-options">
            <label className="check-label">
              <input
                type="checkbox"
                checked={options.wide}
                onChange={(e) =>
                  setOptions({ ...options, wide: e.target.checked })
                }
              />
              {t("16:9に配置")}{" "}
            </label>
            <label>
              {t("余白")}{" "}
              <select
                value={options.margin}
                onChange={(e) =>
                  setOptions({ ...options, margin: Number(e.target.value) })
                }
              >
                {[0, 16, 32, 64, 96].map((n) => (
                  <option key={n} value={n}>
                    {n}px
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("PNG解像度")}{" "}
              <select
                value={options.scale}
                onChange={(e) =>
                  setOptions({ ...options, scale: Number(e.target.value) })
                }
              >
                {[1, 2, 3].map((n) => (
                  <option key={n} value={n}>
                    {n}×
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="field-help">
            {t(
              "現在の表示期間・全行を書き出します。横スクロール位置を反映し、期間の両端をまたぐバーは範囲内だけ出力します。XLSXは編集可能なセルです。",
            )}{" "}
          </p>
          <div className="export-buttons">
            <button
              onClick={() => {
                download(
                  new Blob(
                    [
                      JSON.stringify(
                        chart.overviewProjects
                          ? { schemaVersion: 1, projects: splitOverview(chart) }
                          : chart,
                        null,
                        2,
                      ),
                    ],
                    {
                      type: "application/json",
                    },
                  ),
                  filename(chart) + "_backup.json",
                );
                notify(t("PJ全データをバックアップしました"));
              }}
            >
              {t("全データをバックアップ")}{" "}
            </button>
            {(["png", "svg", "xlsx", "json"] as const).map((kind) => (
              <button
                key={kind}
                disabled={busy}
                className={kind === "png" ? "primary" : ""}
                onClick={() => exportFile(kind)}
              >
                {kind.toUpperCase()} {t("を保存")}{" "}
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
