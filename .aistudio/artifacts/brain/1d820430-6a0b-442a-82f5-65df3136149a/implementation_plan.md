# Ultra-Minimal Overview (پیشخوان) Decluttering Plan

Streamline the **پیشخوان (Overview)** workspace to eliminate visual crowding, redundant navigation widgets, and nested internal card borders—leaving a spacious, calm layout focused strictly on the KPI summary cards, animated circular charts, and live active stations list.

## User Review & Critical Decisions

> [!IMPORTANT]
> This plan directly incorporates your confirmed choices from our clarification step:

- **Confirmed Decision 1 — Focused 3-Part Overview Structure**: Keep only (1) the KPI summary cards, (2) the animated circular donut charts, and (3) the active stations summary list. Remove the redundant "Quick Launch Shortcuts" panel (`دسترسی سریع به بخش‌های گیم‌نت`) that duplicated the sidebar menu.
- **Confirmed Decision 2 — Remove Redundant Top Status Strip & Preserve KPI Mini Rings**: Remove the repetitive status bar (`mg-status-strip`) below the header, while keeping the animated mini circular rings inside the KPI cards.
- **Confirmed Decision 3 — Deep Internal Decluttering of Charts & Cards**: Strip away secondary badges, nested boxes, and duplicate mini progress bars inside the donut chart legends so the circular charts and numbers breathe with generous negative space.

---

## 1. Overview & Core Concept

- **What It Does**: Presents the gaming center's live operational state on the Overview screen in three clean, scannable horizontal tiers without duplicate bars, repetitive buttons, or nested boxes inside boxes.
- **Target Audience / Persona**: Shift managers who want an immediate, calm visual readout when opening the dashboard.
- **Key Value**: Cuts visual elements on the Overview screen by nearly 50% while retaining 100% of the essential operational metrics, circular animations, and active table status.

---

## 2. User Experience & Visual Design

### Streamlined 3-Tier Overview Layout
1. **Clean Top Header**:
   - Displays a concise page title (`پیشخوان`) on the right and the search input, system clock, notifications, and profile chip on the left.
   - Removes the redundant secondary status strip (`mg-status-strip`), header tag pill, and long multi-sentence subtitle.
2. **Tier 1 — Clean KPI Summary Row**:
   - Displays the summary KPI cards with their animated mini circular rings in a balanced row with generous padding (`20px 22px`).
   - Removes internal card divider lines and secondary footer clutter so each card highlights only the label, primary number, subtle subtitle, and mini ring.
3. **Tier 2 — Minimalist Circular Donut Charts**:
   - Preserves the 3 animated circular donut gauges (Station Occupancy, Revenue Share, and Active Timers).
   - **Internal Decluttering**:
     - Removes the top decorative pill badges (`ظرفیت زنده سالن`, `تفکیک منابع درآمد`, `مانیتورینگ زمان‌سنج‌ها`) and verbose descriptions.
     - Removes the duplicate horizontal progress bars (`mg-mini-bar-track`) and heavy boxed borders from inside each legend item—replacing them with clean, borderless dot + label + value rows that highlight smoothly on hover.
4. **Tier 3 — Compact Active Stations Summary**:
   - Replaces the crowded 2-column bottom split grid with a single, clean full-width **میزهای فعال** card.
   - Removes the header icon box and long instructional paragraph, leaving a clean title and a single `مدیریت میزها` action button.
   - Simplifies each active table item into a compact, uncluttered card showing Table Number, Console Name, Timer Status dot, and a subtle link to manage the table.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Remove Duplicate Progress Bars Inside Donut Chart Legends**
  - *Chosen Approach*: Keep the interactive legend rows (color dot, label, and value/percentage) next to each circular donut chart, but remove the boxed containers and horizontal mini-bars underneath each legend item.
  - *Why*: Showing both a circular donut chart and horizontal progress bars inside the same small card created severe visual crowding.
- **Decision 2: Remove the Quick Launch Shortcuts Card & Section Header Bars**
  - *Chosen Approach*: Remove the 4-tile shortcut grid (`دسترسی سریع به بخش‌های گیم‌نت`) and the extra section title bar (`شاخص‌های کلیدی و وضعیت لحظه‌ای سالن`) above the KPIs.
  - *Why*: All navigation links are already permanently visible in the right-hand sidebar, and the cards themselves are self-explanatory without an extra banner header above them.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Simplified Overview Component Hierarchy

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Simplified Topbar (Concise Title + Search + Clock + Admin Profile)      │
├──────────────────────────────────────────────────────────────────────────┤
│  Main Overview Canvas (#121218 — Generous 24px Vertical Rhythm)          │
│                                                                          │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────┐ │
│  │ KPI Summary    │ │ KPI Summary    │ │ KPI Summary    │ │ KPI        │ │
│  │ + Mini Ring    │ │ + Mini Ring    │ │ + Mini Ring    │ │ + Mini Ring│ │
│  └────────────────┘ └────────────────┘ └────────────────┘ └────────────┘ │
│                                                                          │
│  ┌────────────────────────┐ ┌────────────────────────┐ ┌───────────────┐ │
│  │ Occupancy Donut Gauge  │ │ Revenue Donut Gauge    │ │ Timers Gauge  │ │
│  │ + Clean Dot Legend     │ │ + Clean Dot Legend     │ │ + Dot Legend  │ │
│  └────────────────────────┘ └────────────────────────┘ └───────────────┘ │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ Active Stations Summary (Clean Header + Compact Station Cards)      │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

### Interactive Component & State Mapping
- **KPI Counters & Mini Rings**: Continue to animate smoothly on load using `animateCountUp` and `animateKpiMiniRings`.
- **Circular Donut Charts**: Preserve smooth stroke-dashoffset entrance animations and interactive hover highlighting between SVG segments and clean legend rows.
- **Active Stations Summary (`#overviewMiniTablesList`)**: Renders compact station cards with a single click handler (`data-switch-view="tables"`) to jump directly to the Tables management view.
