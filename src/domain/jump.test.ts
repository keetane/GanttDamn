import { it, expect } from "vitest";
import { createChart } from "./model";
import { todayJumpTarget } from "./timeline";
it("表示範囲内なら期間を変えず、対象セルの位置を返す", () => {
  const c = createChart("month", "2027-01-01", 12),
    before = structuredClone(c);
  const t = todayJumpTarget(c, new Date(2027, 10, 15, 10))!;
  expect(t.visibleStartDate).toBe("2027-01-01");
  expect(t.position).toBeGreaterThan(10);
  expect(c).toEqual(before);
});
it.each(["day", "week", "month", "quarter"] as const)(
  "%sのPJ期間外では開始日を変更しない",
  (scale) => {
    const c = createChart(scale, "2020-01-01", 2);
    expect(todayJumpTarget(c, new Date(2027, 10, 15, 10))).toBeNull();
    expect(c.visibleStartDate).toBe("2020-01-01");
  },
);
it("画面グリッド数が少なくてもPJ内の現在時刻へ移動できる", () => {
  const c = createChart("hour", "2027-11-15", 1);
  const t = todayJumpTarget(c, new Date(2027, 10, 15, 17, 30))!;
  expect(t.visiblePeriodCount).toBe(1);
  expect(t.position).toBe(9.5);
});
it("非稼働日は次の営業日、終了後は翌営業日の開始へ", () => {
  const c = createChart("hour", "2027-11-01");
  expect(todayJumpTarget(c, new Date(2027, 10, 13, 10))?.targetDate).toBe(
    "2027-11-15T08:00",
  );
  expect(todayJumpTarget(c, new Date(2027, 10, 15, 18))?.targetDate).toBe(
    "2027-11-16T08:00",
  );
  expect(todayJumpTarget(c, new Date(2027, 10, 15, 7, 59))?.targetDate).toBe(
    "2027-11-15T08:00",
  );
});
it("営業時間中は現在時刻、金曜18時は月曜8時へ", () => {
  const c = createChart("hour", "2027-11-01");
  expect(todayJumpTarget(c, new Date(2027, 10, 12, 17, 59))?.targetDate).toBe(
    "2027-11-12T17:59",
  );
  expect(todayJumpTarget(c, new Date(2027, 10, 12, 18))?.targetDate).toBe(
    "2027-11-15T08:00",
  );
});
it("カスタム稼働曜日と開始時刻にも従い、PJ外には移動しない", () => {
  const c = createChart("hour", "2027-11-01");
  c.workCalendar = { startHour: 10, endHour: 16, weekdays: [2, 4] };
  expect(todayJumpTarget(c, new Date(2027, 10, 11, 16))?.targetDate).toBe(
    "2027-11-16T10:00",
  );
  c.projectEndDate = "2027-11-15";
  expect(todayJumpTarget(c, new Date(2027, 10, 11, 16))).toBeNull();
});
