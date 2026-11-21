import { useI18n, weekdayLabels } from "../i18n";
import {
  containsMilestone,
  headerGroups,
  localDateTime,
} from "../domain/timeline";
import { useChartStore } from "../store/chartStore";
import { barCells, periodsFor } from "../domain/timeline";
import { createRow, uid } from "../domain/model";
import { replaceBar, paint } from "../domain/edit";
export default function Inspector({ onClose }: { onClose: () => void }) {
  const { t, language, setLanguage } = useI18n();

  const { chart, selection, selectedBar, selectedMilestone, edit, select } =
    useChartStore();
  const ri = selection?.rowStart ?? -1,
    row = chart.rows[ri],
    bar = row?.bars.find((b) => b.id === selectedBar),
    milestone = row?.milestones.find((m) => m.id === selectedMilestone),
    p = periodsFor(chart),
    cells = bar ? barCells(bar, p) : null;
  const updateBar = (field: string, value: string) =>
    edit((c) => {
      const b = c.rows[ri].bars.find((b) => b.id === selectedBar)!;
      Object.assign(b, { [field]: value });
    });
  return (
    <aside className="inspector">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">PROPERTIES</span>
          <h2> {t("編集パネル")} </h2>
        </div>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label={t("編集パネルを閉じる")}
        >
          ×
        </button>
      </div>
      {!row ? (
        <div className="empty-panel">
          <span>▦</span>
          <p>
            {t("セルやバーを選択すると、")} <br />
            {t("ここで編集できます。")}{" "}
          </p>
        </div>
      ) : (
        <>
          <div className="panel-section">
            <div className="section-caption">
              {t("項目")} <span>ROW {String(ri + 1).padStart(2, "0")}</span>
            </div>
            <label>
              {t("項目名")}{" "}
              <input
                aria-label={t("項目名")}
                value={row.title}
                maxLength={1000}
                onChange={(e) =>
                  edit((c) => (c.rows[ri].title = e.target.value))
                }
              />
            </label>
            <label>
              {t("補足テキスト")}{" "}
              <textarea
                value={row.note}
                maxLength={5000}
                onChange={(e) =>
                  edit((c) => (c.rows[ri].note = e.target.value))
                }
              />
            </label>
            <label>
              {t("行の高さ")} <span>{row.height}px</span>
              <input
                type="range"
                min="32"
                max="120"
                value={row.height}
                onChange={(e) =>
                  edit((c) => (c.rows[ri].height = Number(e.target.value)))
                }
              />
            </label>
            <div className="button-pair">
              <button
                disabled={ri === 0}
                onClick={() => {
                  edit((c) => {
                    [c.rows[ri - 1], c.rows[ri]] = [c.rows[ri], c.rows[ri - 1]];
                  });
                  select({ ...selection!, rowStart: ri - 1, rowEnd: ri - 1 });
                }}
              >
                {t("上へ移動")}{" "}
              </button>
              <button
                disabled={ri === chart.rows.length - 1}
                onClick={() => {
                  edit((c) => {
                    [c.rows[ri + 1], c.rows[ri]] = [c.rows[ri], c.rows[ri + 1]];
                  });
                  select({ ...selection!, rowStart: ri + 1, rowEnd: ri + 1 });
                }}
              >
                {t("下へ移動")}{" "}
              </button>
            </div>
            <div className="button-pair">
              <button
                onClick={() =>
                  edit((c) => {
                    if (c.rows.length >= 500) return;
                    const copy = structuredClone(row);
                    copy.id = uid();
                    copy.title = (copy.title + t(" のコピー")).slice(0, 1000);
                    copy.bars.forEach((b) => (b.id = uid()));
                    copy.milestones.forEach((m) => (m.id = uid()));
                    c.rows.splice(ri + 1, 0, copy);
                  })
                }
              >
                {t("行を複製")}{" "}
              </button>
              <button
                onClick={() =>
                  edit((c) => {
                    if (c.rows.length >= 500) return;
                    const r = createRow("");
                    r.height = c.displaySettings.rowHeight;
                    c.rows.splice(ri, 0, r);
                  })
                }
              >
                {t("空行を挿入")}{" "}
              </button>
            </div>
            <button
              className="danger-link"
              onClick={() => {
                edit((c) => c.rows.splice(ri, 1));
                select(null);
              }}
            >
              {t("行を削除")}{" "}
            </button>
          </div>
          <div className="panel-section">
            <div className="section-caption">
              {bar
                ? t("バー")
                : milestone
                  ? t("マイルストーン")
                  : t("選択範囲")}
            </div>
            {bar && (
              <>
                <label>
                  {t("バー内テキスト")}{" "}
                  <input
                    aria-label={t("バー内テキスト")}
                    maxLength={1000}
                    value={bar.label}
                    onChange={(e) => updateBar("label", e.target.value)}
                  />
                </label>
                <div className="button-pair">
                  <label>
                    {t("色")}{" "}
                    <input
                      type="color"
                      value={bar.color}
                      onChange={(e) => updateBar("color", e.target.value)}
                    />
                  </label>
                  <label>
                    {t("文字色")}{" "}
                    <input
                      type="color"
                      value={bar.textColor}
                      onChange={(e) => updateBar("textColor", e.target.value)}
                    />
                  </label>
                </div>
                <label>
                  {t("HEXカラー")}{" "}
                  <input
                    key={bar.id + bar.color}
                    defaultValue={bar.color}
                    aria-label={t("バーのHEXカラー")}
                    maxLength={7}
                    spellCheck={false}
                    onBlur={(e) => {
                      if (/^#[0-9a-f]{6}$/i.test(e.target.value))
                        updateBar("color", e.target.value);
                      else e.target.value = bar.color;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                    }}
                  />
                </label>
                <label>
                  {t("文字の配置")}{" "}
                  <select
                    value={bar.align}
                    onChange={(e) => updateBar("align", e.target.value)}
                  >
                    <option value="left"> {t("左寄せ")} </option>
                    <option value="center"> {t("中央寄せ")} </option>
                  </select>
                </label>
                {cells && (
                  <div className="button-pair">
                    <label>
                      {t("開始位置")}{" "}
                      <select
                        aria-label={t("開始位置")}
                        value={cells.start}
                        onChange={(e) =>
                          edit((c) =>
                            replaceBar(c.rows[ri], {
                              ...bar,
                              startDate: p[Number(e.target.value)].startDate,
                            }),
                          )
                        }
                      >
                        {p.map((v, i) => (
                          <option key={i} disabled={i > cells.end} value={i}>
                            {v.year} / {v.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      {t("終了位置")}{" "}
                      <select
                        aria-label={t("終了位置")}
                        value={cells.end}
                        onChange={(e) =>
                          edit((c) =>
                            replaceBar(c.rows[ri], {
                              ...bar,
                              endDateExclusive:
                                p[Number(e.target.value)].endDateExclusive,
                            }),
                          )
                        }
                      >
                        {p.map((v, i) => (
                          <option key={i} disabled={i < cells.start} value={i}>
                            {v.year} / {v.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}
                <p className="field-help">
                  {t("バーの両端をドラッグして伸縮できます。")}{" "}
                </p>
                <button
                  onClick={() => {
                    edit(
                      (c) =>
                        (c.rows[ri].bars = c.rows[ri].bars.filter(
                          (b) => b.id !== bar.id,
                        )),
                    );
                    select(selection);
                  }}
                >
                  {t("バーを削除")}{" "}
                </button>
              </>
            )}
            {milestone && (
              <>
                <label>
                  {t("ラベル")}{" "}
                  <input
                    value={milestone.label}
                    onChange={(e) =>
                      edit(
                        (c) =>
                          (c.rows[ri].milestones.find(
                            (m) => m.id === milestone.id,
                          )!.label = e.target.value),
                      )
                    }
                    maxLength={1000}
                  />
                </label>
                <label>
                  {t("色")}{" "}
                  <input
                    type="color"
                    value={milestone.color}
                    onChange={(e) =>
                      edit(
                        (c) =>
                          (c.rows[ri].milestones.find(
                            (m) => m.id === milestone.id,
                          )!.color = e.target.value),
                      )
                    }
                  />
                </label>
                <label>
                  {t("位置")}{" "}
                  <select
                    value={p.findIndex((v) =>
                      containsMilestone(v, milestone.date),
                    )}
                    onChange={(e) =>
                      edit(
                        (c) =>
                          (c.rows[ri].milestones.find(
                            (m) => m.id === milestone.id,
                          )!.date = p[Number(e.target.value)].startDate),
                      )
                    }
                  >
                    {p.map((v, i) => (
                      <option key={i} value={i}>
                        {v.year} / {v.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  onClick={() => {
                    edit(
                      (c) =>
                        (c.rows[ri].milestones = c.rows[ri].milestones.filter(
                          (m) => m.id !== milestone.id,
                        )),
                    );
                    select(selection);
                  }}
                >
                  {t("マイルストーンを削除")}{" "}
                </button>
              </>
            )}
            {!bar && !milestone && (
              <>
                <p className="field-help">
                  {t(
                    "パレットの色をクリックすると、選択範囲が1本のバーになります。",
                  )}{" "}
                </p>
                <button
                  disabled={!p[selection!.colStart]}
                  onClick={() => {
                    const id = uid();
                    edit((c) => {
                      const r = c.rows[ri];
                      r.milestones.push({
                        id,
                        date: p[selection!.colStart].startDate,
                        label: t("マイルストーン"),
                        color: "#dc6770",
                      });
                    });
                    select(
                      {
                        ...selection!,
                        rowEnd: ri,
                        colEnd: selection!.colStart,
                      },
                      undefined,
                      id,
                    );
                  }}
                >
                  {t("◆ マイルストーンを追加")}{" "}
                </button>
                <button onClick={() => edit((c) => paint(c, selection!, null))}>
                  {t("選択範囲を消去")}{" "}
                </button>
              </>
            )}
          </div>
        </>
      )}
      <div className="panel-tip">
        <span> {t("ヒント")} </span>
        <p>
          {t(
            "項目名・補足はダブルクリックで直接編集。Excelの行をコピーして貼り付けることもできます。",
          )}{" "}
        </p>
      </div>
    </aside>
  );
}
