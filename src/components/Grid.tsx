import { useI18n, weekdayLabels } from "../i18n";
import { moveFollowingBars } from "../domain/barMove";
import type { Chart, Selection } from "../domain/model";
import {
  containsMilestone,
  headerGroups,
  localDateTime,
} from "../domain/timeline";
import { useEffect, useRef, useState, useMemo, useLayoutEffect } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { useChartStore } from "../store/chartStore";
import {
  barCells,
  periodsFor,
  todayPosition,
  todayJumpTarget,
  dateLineTime,
  dateString,
} from "../domain/timeline";
import { rowGroupsFor, presentationSettings, moveRow, hasProjectDivider } from "../domain/rows";
import { replaceBar } from "../domain/edit";
function Editable({
  value,
  label,
  onChange,
  maxLength,
  readOnly = false,
}: {
  maxLength?: number;
  readOnly?: boolean;
  value: string;
  label: string;
  onChange: (v: string) => void;
}) {
  const { t, language, setLanguage } = useI18n();

  const [editing, setEditing] = useState(false);
  return editing ? (
    <input
      autoFocus
      aria-label={label}
      defaultValue={value}
      maxLength={maxLength ?? (label.includes(t("補足")) ? 5000 : 1000)}
      onBlur={(e) => {
        if (e.target.value !== value) onChange(e.target.value);
        setEditing(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          e.currentTarget.value = value;
          e.currentTarget.blur();
        }
      }}
    />
  ) : (
    <span
      className="editable"
      tabIndex={0}
      aria-label={`${label}: ${value}`}
      onDoubleClick={() => {
        if (!readOnly) setEditing(true);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !readOnly) setEditing(true);
      }}
      title={t("ダブルクリックで編集")}
    >
      {value || "—"}
    </span>
  );
}
export default function Grid({
  damnMode = false,
  onFeedback,
  todayJumpRequest = 0,
  onViewportChange,
}: {
  damnMode?: boolean;
  onFeedback?: (message: string) => void;
  todayJumpRequest?: number;
  onViewportChange?: (startIndex: number) => void;
}) {
  const { t, language, setLanguage } = useI18n();

  const { chart, selection, selectedBar, selectedMilestone, edit, select } =
    useChartStore();
  const [movePreview, setMovePreview] = useState<Chart | null>(null);
  const moving = useRef(false);
  const [draggedRow, setDraggedRow] = useState<number | null>(null);
  const [dropRow, setDropRow] = useState<number | null>(null);
  const namesView = chart.overviewMode === "projects";
  const groups = rowGroupsFor(chart);
  const [columnDraft, setColumnDraft] = useState<number | null>(null);
  const [rowDraft, setRowDraft] = useState<{
    id: string;
    height: number;
  } | null>(null);
  const [viewportWidth, setViewportWidth] = useState(1200);
  const [scrollLeft, setScrollLeft] = useState(0);
  const d = {
      ...presentationSettings(chart),
      titleWidth: columnDraft ?? chart.displaySettings.titleWidth,
    },
    p = useMemo(
      () => periodsFor(chart),
      [
        chart.timeScale,
        chart.visibleStartDate,
        chart.projectEndDate,
        chart.workCalendar,
      ],
    );
  const fixedWidth = d.titleWidth + (d.showNote ? d.noteWidth : 0);
  d.columnWidth = Math.max(
    1,
    (viewportWidth - fixedWidth) / chart.visiblePeriodCount,
  );
  const windowStart = Math.max(0, Math.floor(scrollLeft / d.columnWidth) - 2);
  const windowEnd = Math.min(
    p.length,
    windowStart + chart.visiblePeriodCount + 5,
  );
  const displayStart = Math.max(
    0,
    Math.min(
      Math.floor(scrollLeft / d.columnWidth),
      Math.max(0, p.length - chart.visiblePeriodCount),
    ),
  );
  useEffect(() => {
    onViewportChange?.(displayStart);
  }, [
    displayStart,
    chart.id,
    chart.timeScale,
    chart.visiblePeriodCount,
    onViewportChange,
  ]);
  const shownPeriods = p.slice(windowStart, windowEnd);
  const geometry = useRef({ columnWidth: d.columnWidth, count: p.length });
  geometry.current = { columnWidth: d.columnWidth, count: p.length };
  const [today, setToday] = useState(() => dateLineTime(chart));
  useEffect(() => {
    const refresh = () => setToday(dateLineTime(chart));
    refresh();
    const timer = window.setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [chart.timeScale, JSON.stringify(chart.workCalendar)]);
  const todayAt = d.showToday !== false ? todayPosition(p, today) : null;
  const drag = useRef<{
    row: number;
    col: number;
    x: number;
    y: number;
  } | null>(null);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!root.current) return;
    const el = root.current;
    const measure = () => setViewportWidth(el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => {
    if (root.current) root.current.scrollLeft = 0;
    setScrollLeft(0);
    select(null);
  }, [
    chart.id,
    chart.timeScale,
    chart.visibleStartDate,
    chart.projectEndDate,
    JSON.stringify(chart.workCalendar),
  ]);
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const position = todayPosition(p, dateLineTime(chart));
    const width = Math.max(
      1,
      (el.clientWidth - fixedWidth) / chart.visiblePeriodCount,
    );
    el.scrollLeft = position === null ? 0 : Math.floor(position) * width;
    setScrollLeft(el.scrollLeft);
  }, [chart.id, chart.timeScale]);
  useEffect(() => {
    if (!todayJumpRequest || !root.current) return;
    const now = dateLineTime(chart);
    setToday(now);
    const target = todayJumpTarget(chart);
    if (!target) return;
    const position = target.position;
    const fixed = fixedWidth;
    root.current.scrollTo({
      left: Math.max(
        0,
        position * d.columnWidth - (root.current.clientWidth - fixed) / 2,
      ),
      behavior: "auto",
    });
  }, [todayJumpRequest]);
  const [resize, setResize] = useState<{
    id: string;
    col: number;
    side: "start" | "end";
  } | null>(null);
  useEffect(() => {
    const up = () => (drag.current = null);
    const move = (e: PointerEvent) => {
      const a = drag.current;
      if (
        moving.current ||
        !a ||
        Math.abs(e.clientX - a.x) + Math.abs(e.clientY - a.y) < 4
      )
        return;
      const target = document
        .elementFromPoint(e.clientX, e.clientY)
        ?.closest<HTMLElement>(".timeline-row");
      if (!target) return;
      const state = useChartStore.getState();
      const ci = Math.max(
        0,
        Math.min(
          geometry.current.count - 1,
          Math.floor(
            (e.clientX - target.getBoundingClientRect().left) /
              geometry.current.columnWidth,
          ),
        ),
      );
      state.select({
        rowStart: a.row,
        rowEnd: Number(target.dataset.rowIndex),
        colStart: a.col,
        colEnd: ci,
      });
    };
    window.addEventListener("pointerup", up);
    window.addEventListener("pointermove", move);
    return () => {
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointermove", move);
    };
  }, []);
  const selectionCleanup = useRef<() => void>(() => {});
  useEffect(() => () => selectionCleanup.current(), []);
  const beginSelection = (
    event: ReactPointerEvent,
    next: Selection,
    bar?: string,
    milestone?: string,
  ) => {
    if (event.button !== 0) return;
    selectionCleanup.current();
    const state = useChartStore.getState(),
      current = state.selection;
    const same =
      !!current &&
      current.rowStart === next.rowStart &&
      current.rowEnd === next.rowEnd &&
      current.colStart === next.colStart &&
      current.colEnd === next.colEnd &&
      state.selectedBar === (bar ?? null) &&
      state.selectedMilestone === (milestone ?? null);
    select(next, bar, milestone);
    if (!same) return;
    const x = event.clientX,
      y = event.clientY;
    let moved = false;
    const move = (e: PointerEvent) => {
      if (Math.abs(e.clientX - x) + Math.abs(e.clientY - y) >= 4) moved = true;
    };
    const clean = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", clean);
    };
    const up = (e: PointerEvent) => {
      move(e);
      clean();
      if (!moved) select(null);
    };
    selectionCleanup.current = clean;
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
    window.addEventListener("pointercancel", clean, { once: true });
  };
  const startBarMove = (e: ReactPointerEvent, id: string, rowIndex: number) => {
    const x = e.clientX,
      scroll = root.current?.scrollLeft ?? 0;
    const initial = chart;
    let delta = 0,
      plan: Chart | null = null,
      error = "";
    moving.current = true;
    const clean = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("keydown", key);
      window.removeEventListener("blur", cancel);
      moving.current = false;
      setMovePreview(null);
    };
    const move = (ev: PointerEvent) => {
      const nextDelta = Math.round(
        (ev.clientX - x + (root.current?.scrollLeft ?? 0) - scroll) /
          geometry.current.columnWidth,
      );
      if (nextDelta === delta) return;
      delta = nextDelta;
      error = "";
      try {
        plan = moveFollowingBars(initial, id, delta);
        setMovePreview(plan);
      } catch (e) {
        plan = null;
        error = e instanceof Error ? e.message : t("移動できません");
        setMovePreview(null);
      }
    };
    const up = () => {
      clean();
      if (!delta) return;
      if (!plan) {
        if (error) onFeedback?.(error);
        return;
      }
      if (useChartStore.getState().chart !== initial) {
        onFeedback?.(t("編集内容が変更されたため移動を中止しました"));
        return;
      }
      const result = plan;
      edit((c) => {
        c.rows = result.rows;
        if (c.overviewMode === "projects" && result.overviewProjects) {
          c.overviewProjects = result.overviewProjects.map((project) => ({
            ...project,
            updatedAt:
              JSON.stringify(project.rows) !== JSON.stringify(
                initial.overviewProjects?.find((p) => p.id === project.id)?.rows,
              ) ? new Date().toISOString() : project.updatedAt,
          }));
        }
      });
      const selected = result.rows[rowIndex].bars.find((b) => b.id === id)!;
      const cells = barCells(selected, p);
      if (cells)
        select(
          {
            rowStart: rowIndex,
            rowEnd: rowIndex,
            colStart: cells.start,
            colEnd: cells.end,
          },
          id,
        );
      onFeedback?.(t("以降のバーをまとめて移動しました"));
    };
    const cancel = () => clean();
    const key = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") {
        ev.preventDefault();
        clean();
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
    window.addEventListener("pointercancel", cancel, { once: true });
    window.addEventListener("keydown", key);
    window.addEventListener("blur", cancel, { once: true });
  };
  const startResize = (
    e: ReactPointerEvent,
    id: string,
    side: "start" | "end",
    rowIndex: number,
  ) => {
    e.stopPropagation();
    e.preventDefault();
    if (chart.overviewProjects) return;
    const row = chart.rows[rowIndex],
      bar = row.bars.find((b) => b.id === id)!;
    const parent = e.currentTarget
      .closest(".timeline-row")!
      .getBoundingClientRect();
    const cells = barCells(bar, p)!;
    let col = side === "start" ? cells.start : cells.end;
    setResize({ id, col, side });
    const move = (ev: PointerEvent) => {
      col = Math.max(
        0,
        Math.min(
          p.length - 1,
          Math.floor((ev.clientX - parent.left) / d.columnWidth),
        ),
      );
      col =
        side === "start"
          ? Math.min(col, cells.end)
          : Math.max(col, cells.start);
      setResize({ id, col, side });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setResize(null);
      edit((c) => {
        const r = c.rows.find((r) => r.id === row.id)!;
        replaceBar(r, {
          ...bar,
          ...(side === "start"
            ? { startDate: p[col].startDate }
            : { endDateExclusive: p[col].endDateExclusive }),
        });
      });
      select(
        {
          rowStart: rowIndex,
          rowEnd: rowIndex,
          colStart: side === "start" ? col : cells.start,
          colEnd: side === "end" ? col : cells.end,
        },
        id,
      );
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
  };
  const width =
    d.titleWidth + (d.showNote ? d.noteWidth : 0) + p.length * d.columnWidth;
  const leftStyle: CSSProperties = {
    width: d.titleWidth + (d.showNote ? d.noteWidth : 0),
    minWidth: d.titleWidth + (d.showNote ? d.noteWidth : 0),
  };
  const selectionIncludes = (r: number, i: number) =>
    selection &&
    r >= Math.min(selection.rowStart, selection.rowEnd) &&
    r <= Math.max(selection.rowStart, selection.rowEnd) &&
    i >= Math.min(selection.colStart, selection.colEnd) &&
    i <= Math.max(selection.colStart, selection.colEnd);
  return (
    <div
      onScroll={(e) => setScrollLeft(e.currentTarget.scrollLeft)}
      className="grid-scroll"
      ref={root}
      tabIndex={0}
      aria-label={t("タイムライングリッド")}
    >
      <div
        className={`chart-grid ${d.showGrid ? "" : "no-grid"} ${namesView ? "project-name-view" : ""}`}
        style={{
          width: Math.max(width, viewportWidth),
          background: d.background,
          fontSize: d.fontSize,
        }}
      >
        <div className="grid-header" style={{ height: d.showYear ? 76 : 44 }}>
          <div className="item-cells header-items" style={leftStyle}>
            <div style={{ width: d.titleWidth }}>
              <Editable
                readOnly={namesView}
                value={d.titleColumnLabel ?? "milestone"}
                label={namesView ? t("プロジェクト") : t("milestone列の見出し")}
                maxLength={100}
                onChange={(value) =>
                  edit((c) => {
                    c.displaySettings.titleColumnLabel = value;
                  })
                }
              />
              <span className="subtle">{namesView ? chart.overviewProjects?.length : chart.rows.length}</span>
              <span
                className="column-resize"
                onPointerDown={(e) => {
                  const x = e.clientX,
                    start = d.titleWidth;
                  let w = start;
                  const move = (ev: PointerEvent) => {
                    w = Math.max(100, Math.min(500, start + ev.clientX - x));
                    setColumnDraft(w);
                  };
                  const up = () => {
                    window.removeEventListener("pointermove", move);
                    setColumnDraft(null);
                    edit((c) => (c.displaySettings.titleWidth = w));
                  };
                  window.addEventListener("pointermove", move);
                  window.addEventListener("pointerup", up, { once: true });
                }}
                title={t("ドラッグで項目列幅を変更")}
              />
            </div>
            {d.showNote && (
              <div style={{ width: d.noteWidth }}>
                <Editable
                  value={d.noteColumnLabel ?? "action item"}
                  label={t("action item列の見出し")}
                  maxLength={100}
                  onChange={(value) =>
                    edit((c) => {
                      c.displaySettings.noteColumnLabel = value;
                    })
                  }
                />
              </div>
            )}
          </div>
          <div
            className="time-header"
            style={{
              width: p.length * d.columnWidth,
              clipPath: `inset(0 0 0 ${scrollLeft}px)`,
            }}
          >
            {todayAt !== null && (
              <div
                className="today-header"
                data-testid="today-marker"
                style={{ left: todayAt * d.columnWidth }}
                aria-label={t("現在の日付線")}
              ></div>
            )}
            {d.showYear && (
              <div className="year-header">
                {headerGroups(p).map((g, i) => (
                  <div key={i} style={{ width: g.count * d.columnWidth }}>
                    {t(String(g.label))}
                    {chart.timeScale !== "hour" &&
                      chart.timeScale !== "week" && <span> {t("年")} </span>}
                  </div>
                ))}
              </div>
            )}
            <div className="period-header">
              <span
                aria-hidden="true"
                style={{ width: windowStart * d.columnWidth, flexShrink: 0 }}
              />
              {shownPeriods.map((v) => (
                <div
                  key={v.startDate}
                  style={{ width: d.columnWidth }}
                  title={t(
                    `${v.startDate} 〜 ${v.endDateExclusive}（終了日を含まず）`,
                  )}
                >
                  {chart.timeScale === "day" ? (
                    <span className="day-period-label">
                      <span>{t(v.label).split("(")[0]}</span>
                      <small>({t(v.label).split("(")[1]}</small>
                    </span>
                  ) : (
                    t(v.label)
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        {(movePreview ?? chart).rows.map((row, ri) => (
          <div
            data-project-id={row.projectId}
            data-project-start={
              (row.projectId &&
                (ri === 0 || chart.rows[ri - 1].projectId !== row.projectId)) ||
              undefined
            }
            data-project-end={hasProjectDivider(chart, ri) || undefined}
            className={`grid-row ${selection && ri >= Math.min(selection.rowStart, selection.rowEnd) && ri <= Math.max(selection.rowStart, selection.rowEnd) ? "row-active" : ""}`}
            key={row.id}
            data-row-id={row.id}
            data-drop-target={dropRow === ri || undefined}
            onDragOver={(e) => {
              if (draggedRow !== null) {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setDropRow(ri);
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (draggedRow !== null) {
                edit((c) => moveRow(c, draggedRow, ri));
                select({
                  rowStart: ri,
                  rowEnd: ri,
                  colStart: 0,
                  colEnd: Math.max(0, p.length - 1),
                });
              }
              setDraggedRow(null);
              setDropRow(null);
            }}
            style={{
              height: rowDraft?.id === row.id ? rowDraft.height : row.height,
            }}
          >
            <div
              className="item-cells"
              style={leftStyle}
              onPointerDown={(e) => {
                if ((e.target as HTMLElement).tagName !== "INPUT")
                  beginSelection(e, {
                    rowStart: namesView ? groups[ri].start : ri,
                    rowEnd: namesView
                      ? groups[ri].end
                      : e.shiftKey && selection ? selection.rowStart : ri,
                    colStart: 0,
                    colEnd: Math.max(0, p.length - 1),
                  });
              }}
            >
              <div
                className={`row-title ${groups[ri].end > groups[ri].start ? "merged-title" : ""}`}
                data-merged-start={
                  (groups[ri].start === ri && groups[ri].end > ri) || undefined
                }
                style={{
                  width: d.titleWidth,
                  borderBottom:
                    d.showGrid && groups[ri].start === ri
                      ? "1px solid #e2e8df"
                      : "none",
                  height:
                    groups[ri].start === ri ? groups[ri].height : undefined,
                }}
              >
                <span
                  className="row-number"
                  style={{ top: row.height / 2 }}
                  draggable={!chart.overviewProjects}
                  aria-label={t(`行${ri + 1}を移動`)}
                  title={t("ドラッグして行を移動")}
                  onPointerDown={(e) => e.stopPropagation()}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", row.id);
                    e.dataTransfer.effectAllowed = "move";
                    setDraggedRow(ri);
                  }}
                  onDragEnd={() => {
                    setDraggedRow(null);
                    setDropRow(null);
                  }}
                >
                  {String(ri + 1).padStart(2, "0")}
                </span>
                {!namesView && row.projectTitle && groups[ri].start === ri && (
                  <small
                    className="overview-project-name"
                    title={row.projectTitle}
                  >
                    {row.projectTitle}
                  </small>
                )}
                {groups[ri].start === ri && (
                  <Editable
                    readOnly={!!chart.overviewProjects}
                    value={
                      namesView ? (row.projectTitle ?? row.title) : row.title
                    }
                    label={t(`行${ri + 1}の項目名`)}
                    onChange={(value) =>
                      edit((c) => {
                        for (let i = groups[ri].start; i <= groups[ri].end; i++)
                          c.rows[i].title = value;
                      })
                    }
                  />
                )}
              </div>
              {d.showNote && (
                <div className="row-note" style={{ width: d.noteWidth }}>
                  <Editable
                    readOnly={!!chart.overviewProjects}
                    value={row.note}
                    label={t(`行${ri + 1}の補足`)}
                    onChange={(value) => edit((c) => (c.rows[ri].note = value))}
                  />
                </div>
              )}
            </div>
            <div
              className="timeline-row"
              data-row-index={ri}
              style={{
                width: p.length * d.columnWidth,
                clipPath: `inset(0 0 0 ${scrollLeft}px)`,
              }}
            >
              <span
                aria-hidden="true"
                style={{ width: windowStart * d.columnWidth, flexShrink: 0 }}
              />
              {shownPeriods.map((period, offset) => {
                const ci = windowStart + offset;
                return (
                  <div
                    className={`grid-cell ${selectionIncludes(ri, ci) ? "cell-selected" : ""}`}
                    data-testid={`cell-${ri}-${ci}`}
                    key={period.startDate}
                    style={{ width: d.columnWidth }}
                    onPointerDown={(e) => {
                      if (e.button !== 0 || chart.overviewProjects) return;
                      e.preventDefault();
                      drag.current = {
                        row: ri,
                        col: ci,
                        x: e.clientX,
                        y: e.clientY,
                      };
                      beginSelection(e, {
                        rowStart: ri,
                        rowEnd: ri,
                        colStart: ci,
                        colEnd: ci,
                      });
                      root.current?.focus();
                    }}
                    onPointerEnter={() => {
                      if (drag.current)
                        select({
                          rowStart: drag.current.row,
                          rowEnd: ri,
                          colStart: drag.current.col,
                          colEnd: ci,
                        });
                    }}
                  />
                );
              })}
              {row.bars.map((bar) => {
                let cells = barCells(bar, p);
                if (!cells) return null;
                if (resize?.id === bar.id)
                  cells = {
                    start: resize.side === "start" ? resize.col : cells.start,
                    end: resize.side === "end" ? resize.col : cells.end,
                  };
                const isBar = d.barStyle === "bar";
                return (
                  <div
                    key={bar.id}
                    className={`schedule-bar ${isBar ? "bar-mode" : "cell-mode"} ${isBar && d.rounded ? "rounded" : ""} ${selectedBar === bar.id ? "bar-selected" : ""}`}
                    data-testid="schedule-bar"
                    data-bar-id={bar.id}
                    data-start-date={bar.startDate}
                    data-end-date={bar.endDateExclusive}
                    style={{
                      left: cells.start * d.columnWidth + (isBar ? 3 : 0),
                      width:
                        (cells.end - cells.start + 1) * d.columnWidth -
                        (isBar ? 6 : 0),
                      cursor: damnMode ? "grab" : "pointer",
                      background: bar.color,
                      color: bar.textColor,
                      textAlign: bar.align,
                      backgroundImage:
                        !isBar && d.showGrid
                          ? `repeating-linear-gradient(to right,transparent 0,transparent ${d.columnWidth - 1}px,#ffffff55 ${d.columnWidth - 1}px,#ffffff55 ${d.columnWidth}px)`
                          : "none",
                    }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      const rect =
                        e.currentTarget.parentElement!.getBoundingClientRect();
                      if (damnMode) {
                        beginSelection(
                          e,
                          {
                            rowStart: ri,
                            rowEnd: ri,
                            colStart: cells!.start,
                            colEnd: cells!.end,
                          },
                          bar.id,
                        );
                        startBarMove(e, bar.id, ri);
                        root.current?.focus();
                        return;
                      }
                      drag.current = {
                        row: ri,
                        col: Math.max(
                          cells!.start,
                          Math.min(
                            cells!.end,
                            Math.floor((e.clientX - rect.left) / d.columnWidth),
                          ),
                        ),
                        x: e.clientX,
                        y: e.clientY,
                      };
                      beginSelection(
                        e,
                        {
                          rowStart: ri,
                          rowEnd: ri,
                          colStart: cells!.start,
                          colEnd: cells!.end,
                        },
                        bar.id,
                      );
                      root.current?.focus();
                    }}
                    title={bar.label || t("バーを選択して編集")}
                  >
                    <span
                      className="resize-handle start"
                      data-testid="resize-start"
                      onPointerDown={(e) => startResize(e, bar.id, "start", ri)}
                    />
                    <span className="bar-label">{bar.label}</span>
                    <span
                      className="resize-handle end"
                      data-testid="resize-end"
                      onPointerDown={(e) => startResize(e, bar.id, "end", ri)}
                    />
                  </div>
                );
              })}
              {row.milestones.map((m) => {
                const ci = p.findIndex((v) => containsMilestone(v, m.date));
                return ci < 0 ? null : (
                  <button
                    key={m.id}
                    className={`milestone ${selectedMilestone === m.id ? "milestone-selected" : ""}`}
                    style={{
                      left: (ci + 0.5) * d.columnWidth - 15,
                      color: m.color,
                    }}
                    title={m.label || t("マイルストーン")}
                    aria-label={m.label || t("マイルストーン")}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      beginSelection(
                        e,
                        { rowStart: ri, rowEnd: ri, colStart: ci, colEnd: ci },
                        undefined,
                        m.id,
                      );
                    }}
                  >
                    ◆
                  </button>
                );
              })}
              {todayAt !== null && (
                <div
                  className="today-line"
                  style={{ left: todayAt * d.columnWidth }}
                  aria-hidden="true"
                />
              )}
              {selection &&
                ri >= Math.min(selection.rowStart, selection.rowEnd) &&
                ri <= Math.max(selection.rowStart, selection.rowEnd) && (
                  <div
                    className="selection-outline"
                    style={{
                      left:
                        Math.min(selection.colStart, selection.colEnd) *
                        d.columnWidth,
                      width:
                        (Math.abs(selection.colEnd - selection.colStart) + 1) *
                        d.columnWidth,
                    }}
                  />
                )}
            </div>
            <span
              className="row-resize"
              title={t("ドラッグで行の高さを変更")}
              onPointerDown={(e) => {
                e.preventDefault();
                if (chart.overviewProjects) return;
                const start = e.clientY;
                let height = row.height;
                const move = (ev: PointerEvent) => {
                  height = Math.max(
                    32,
                    Math.min(120, row.height + ev.clientY - start),
                  );
                  setRowDraft({ id: row.id, height });
                };
                const up = () => {
                  window.removeEventListener("pointermove", move);
                  setRowDraft(null);
                  edit((c) => (c.rows[ri].height = height));
                };
                window.addEventListener("pointermove", move);
                window.addEventListener("pointerup", up, { once: true });
              }}
            />
          </div>
        ))}
        <button
          className="grid-add"
          disabled={!!chart.overviewProjects || chart.rows.length >= 500}
          style={{ width: width }}
          onClick={() =>
            edit((c) => {
              c.rows.push({
                id: crypto.randomUUID(),
                title: t("新しい項目"),
                note: "",
                height: d.rowHeight,
                sortOrder: c.rows.length,
                bars: [],
                milestones: [],
              });
            })
          }
        >
          {t("＋ 行を追加")}{" "}
        </button>
      </div>
    </div>
  );
}
