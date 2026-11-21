import { it, expect } from "vitest";
import { translate, weekdayLabels } from "./i18n";
it("UI・日付・動的ラベルを日英で切り替える", () => {
  expect(translate("保存", "en")).toBe("Save");
  expect(translate("1/4(月)", "en")).toBe("1/4(Mon)");
  expect(translate("2027年4月", "en")).toBe("Apr 2027");
  expect(translate("行2の項目名", "en")).toBe("Row 2 item name");
  expect(translate("保存", "ja")).toBe("保存");
  expect(translate("My project", "en")).toBe("My project");
  expect(weekdayLabels("en")[1]).toBe("Mon");
});
