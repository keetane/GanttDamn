# GanttDamn user guide

[Back to README](../README.en.md) | [日本語](user-guide.md)

## Editing the grid and items

The left columns are initially labeled `milestone` and `action item`. Double-click a heading, item name, or note to edit it, or focus it and press `Enter`. Adjacent identical milestone names merge vertically within the same project. Empty or separated names do not merge.

Editing a merged name changes the whole group. To give a row a different name, select its action item or a timeline cell, then change the item name in the properties panel.

| Action | How |
|---|---|
| Create a bar | Drag across timeline cells, then choose a palette color |
| Edit colors or text | Select a bar and use the palette or properties panel |
| Resize a bar | Drag its left or right edge |
| Clear part of a bar | Drag from inside the bar to select a range, then use Clear fill or Delete |
| Select rows | Click the left columns; Shift-click to select multiple rows |
| Deselect | Click the selected item, cell, bar, or diamond again |
| Reorder rows | Drag a row number, or use Move up / Move down in properties |
| Duplicate, insert, or delete rows | Use the properties panel |
| Resize rows or columns | Drag a row's bottom edge or a column heading's right edge, or use View settings |
| Add a diamond | Select an empty cell and choose Add milestone in properties |

Filling an overlapping range splits or replaces existing bars on that row. Bars outside the range are preserved. Drag a colored cell or bar horizontally to move that bar alone. Diamond milestones can also be dragged individually. Use Shift-drag to select part of a bar, or start range selections from an empty cell; use Damn it mode to shift later schedules together. Dragging a summary bar in all project name shifts only that project’s underlying schedule.

Cell appearance retains grid lines over the fill. Bar appearance uses a horizontal rectangle. Both display the same schedule data.

## Keyboard and paste

| Action | Keys |
|---|---|
| Undo | Cmd/Ctrl + Z |
| Redo | Cmd/Ctrl + Shift + Z |
| Clear selected content | Delete / Backspace |
| Start direct text editing | Focus editable text and press Enter |
| Cancel a Damn it drag | Esc |

Paste tab-separated text from Excel or another editor to use the first column as item names and the second as notes. Pasting starts at the selected row, or appends when no row is selected. Standard browser editing shortcuts take priority inside input fields.

## Timeline, visible periods, and working calendar

Set project start and end dates in View settings. The end date is inclusive; leaving it empty gives a three-year range from the start. Scroll horizontally through that range. Changing the view or scale does not change dates stored in bars.

Visible periods is the number of timeline cells shown across one screen. Cell width adjusts to the available space. Switching scales applies these defaults, which you can change in View settings:

| Scale | One cell | Default visible periods |
|---|---|---|
| Hour | One working hour | 12 |
| Day | One working day | 15 |
| Week | One week starting on Monday | 12 |
| Month | One calendar month | 12 |
| Q | One calendar quarter | 8 |

The default working calendar is Monday–Friday, 08:00–18:00, excluding the end time. Hour and Day follow this calendar; Week, Month, and Q use calendar periods. Data outside working periods is retained; only the visible cells change.

Weeks crossing a month boundary stay together under the month in which they start. For example, April 26–May 2 is grouped under April. Day labels also include the weekday.

## Date line and Today

Use Date line to show or hide the red line. It has no date text and does not cover the left item or notes columns.

During working hours, the line marks the current position. Before work starts, it marks that day's opening time. After work ends or on non-working days, it marks the next working start. With the default calendar, Friday at 18:00 or a weekend points to Monday at 08:00.

Today scrolls to the same position and turns the line on if needed. If the target falls outside the project range, a message appears without changing project dates. Switching projects or scales aligns the cell containing the date line with the start of the timeline, within the available scroll range.

## Managing projects and overview modes

Use the project selector to switch views. Manage projects lets you create, rename, duplicate, delete, and import JSON. Switch away from an individual project before deleting it.

| View | Contents and editing scope |
|---|---|
| Individual project | Add items, edit names and notes, resize bars, and perform other detailed edits |
| `all` | Show every project's items; black lines separate projects, with no project divider at the bottom |
| `all project name` | One row per project, with item and notes columns hidden; one bar spans its earliest scheduled start to latest end, with diamonds on the same row and no project divider lines |

Summary display preserves original item names, notes, row heights, and individual bars. Projects without bars show their names and any diamonds. Switch to an individual project to add items, edit names, or resize bars.

An overview covers the start and end dates of all projects and initially inherits the scale and working calendar of the preceding view. Changing an overview's scale does not change settings in individual projects. The last selected project or overview is restored on reload.

## Damn it mode

Enable Damn it and drag the body of a bar horizontally to move that bar and all bars starting at the same time or later, across rows. Bars outside the visible range are included.

- In an individual project, only that project's bars move; diamonds stay in place.
- In `all`, later bars across every project move, together with diamonds at or after the same reference time.
- In `all project name`, the selected project's earliest bar start is the reference. The same rule applies to original bars and diamonds across all projects, and summaries are then updated.

Hour and Day moves use working cells. Month and Q moves use calendar months. Week moves use the date difference to the target cell. Earlier bars and diamonds before the reference time stay in place.

Dragging previews the result; releasing commits it. Press Esc, cancel the pointer, or move focus away from the window to cancel. Moves that overlap an earlier bar or exceed a project range are rejected with a message. Undo or redo restores a grouped move in one step. The mode resets to off on reload.

## Storage, backups, and export

Edits autosave to IndexedDB for the same browser, profile, and origin. Save also writes immediately. Keep JSON backups in case private browsing or clearing browser data removes local storage.

Regular PNG, SVG, XLSX, and JSON exports include all rows and the visible number of periods starting at the horizontal scroll position. If scrolling stops partway through a cell, that leftmost partial cell is included. Bars crossing range boundaries are clipped. Preview offers margins, a 16:9 layout, and PNG resolution settings.

Back up all data saves original data for the full range: the current project in an individual view, or every project in an overview. Imports assign new IDs without overwriting existing projects. A regular overview JSON export saves the visible range as one standalone chart.

Imports are limited to 10 MB, individual charts to 500 rows, and visible periods to 1–240. PNG output exceeding 64 megapixels or 32,767 pixels on either side, and XLSX output exceeding 16,384 columns, is rejected. Reduce visible periods or image scale before exporting again.

Local folders named `projects/`, `project-data/`, `backups/`, and `exports/` are excluded from Git. JSON, PNG, SVG, and XLSX files are also excluded, with exceptions for app configuration JSON and images in `assets/`. These file-storage folders are separate from browser autosave storage.

## Language

Use English / 日本語 in the top bar to switch the UI and date labels. User-entered project names, item names, notes, and bar labels are preserved without translation. The browser remembers the selected language.

## Launchers

Install dependencies using the [quick start](../README.en.md#quick-start) first.

On macOS, double-click GanttDamn.app to start the server in Terminal and open the default browser. Keep the launcher inside the app folder; you can add it to the Dock from there.

On Ubuntu, run `npm start` or `bash GanttDamn.sh`. Opening the default browser automatically requires `xdg-open`. To generate an icon launcher for the app's current location, run:

```sh
npm run desktop:linux
```

Open the generated GanttDamn.desktop from the file manager. Regenerate it after moving the app. When copying to Ubuntu, install dependencies on that machine instead of reusing macOS node_modules.

The server uses `127.0.0.1:4317`. The launcher stops with a message if another app uses that port. The development server also does not automatically choose another port. Stop the server with `Ctrl+C` in the terminal that started it.

## Data format notes

The JSON schema version is 1. `visibleStartDate` is the project start, `visiblePeriodCount` is the visible-period count, and `projectEndDate` is the inclusive project end. A bar's `endDateExclusive` does not include that instant. Time values use local date-time strings without a timezone, such as `2027-01-01T08:00`.

See the [data model](../src/domain/model.ts), [import validation](../src/domain/validation.ts), and [visible-range export logic](../src/domain/displayWindow.ts) for details.
