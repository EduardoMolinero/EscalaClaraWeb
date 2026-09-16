(() => {
  "use strict";

  const STORAGE_KEY = "escala-clara.shifts.v1";
  const SHIFTS_LIST_KEY = "escala-clara.saved-shifts.v1";
  const ARCHIVE_VERSION = 1;
  const DEFAULT_COLOR = { red: 0.10, green: 0.55, blue: 0.52 };
  const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
  const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric"
  });
  const dayTitleFormatter = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long"
  });
  const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
  const weekdayFormatter = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });
  const shiftDateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  const elements = {
    app: document.querySelector("#app"),
    tabBar: document.querySelector("#tab-bar"),
    modalRoot: document.querySelector("#modal-root"),
    toast: document.querySelector("#toast"),
    importInput: document.querySelector("#import-input")
  };

  const state = {
    shifts: loadShifts(),
    savedShifts: loadSavedShifts(),
    tab: "calendar",
    displayedMonth: startOfMonth(new Date()),
    selectedDay: dateKey(new Date()),
    modal: null,
    pendingArchive: null,
    isDarkMode: loadTheme(),
    summaryMonth: startOfMonth(new Date())
  };

  let toastTimer;

  function loadTheme() {
    try {
      const saved = localStorage.getItem("escala-clara.theme");
      if (saved === "dark") return true;
      if (saved === "light") return false;
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
  }

  function saveTheme(isDark) {
    try {
      localStorage.setItem("escala-clara.theme", isDark ? "dark" : "light");
    } catch {}
  }

  function applyTheme(isDark) {
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
    const root = document.documentElement;
    if (isDark) {
      root.style.setProperty("--page", "#1c1c1e");
      root.style.setProperty("--surface", "#2c2c2e");
      root.style.setProperty("--text", "#f5f5f5");
      root.style.setProperty("--body-bg", "#000000");
      root.style.setProperty("--line", "rgba(255, 255, 255, 0.1)");
      root.style.setProperty("--muted", "#8e8e93");
      root.style.setProperty("--secondary-fill", "rgba(255, 255, 255, 0.1)");
      root.style.setProperty("--dialog-bg", "rgba(44, 44, 46, 0.98)");
      root.style.setProperty("--header-bg", "rgba(28, 28, 30, 0.95)");
      root.style.setProperty("--sheet-header-bg", "rgba(44, 44, 46, 0.91)");
      root.style.setProperty("--tab-bg", "rgba(28, 28, 30, 0.92)");
      root.style.setProperty("--day-cell-bg", "rgba(255, 255, 255, 0.05)");
      root.style.setProperty("--day-cell-has-bg", "rgba(255, 255, 255, 0.08)");
      root.style.setProperty("--empty-strong", "#e5e5e5");
      root.style.setProperty("--form-placeholder", "#666666");
      root.style.setProperty("--empty-text", "#8e8e93");
      root.style.setProperty("--shadow", "0 16px 48px rgba(0, 0, 0, 0.4)");
    } else {
      root.style.setProperty("--page", "#f2f2f7");
      root.style.setProperty("--surface", "#ffffff");
      root.style.setProperty("--text", "#151518");
      root.style.setProperty("--body-bg", "#d9d9df");
      root.style.setProperty("--line", "rgba(60, 60, 67, 0.15)");
      root.style.setProperty("--muted", "#6d6d72");
      root.style.setProperty("--secondary-fill", "rgba(120, 120, 128, 0.12)");
      root.style.setProperty("--dialog-bg", "rgba(248, 248, 252, 0.98)");
      root.style.setProperty("--header-bg", "rgba(242, 242, 247, 0.95)");
      root.style.setProperty("--sheet-header-bg", "rgba(249, 249, 252, 0.91)");
      root.style.setProperty("--tab-bg", "rgba(249, 249, 252, 0.92)");
      root.style.setProperty("--day-cell-bg", "rgba(120, 120, 128, 0.05)");
      root.style.setProperty("--day-cell-has-bg", "rgba(120, 120, 128, 0.08)");
      root.style.setProperty("--empty-strong", "#343438");
      root.style.setProperty("--form-placeholder", "#9e9ea4");
      root.style.setProperty("--empty-text", "#6d6d72");
      root.style.setProperty("--shadow", "0 16px 48px rgba(20, 30, 35, 0.16)");
    }
  }

  function icon(name) {
    const paths = {
      plus: "<path d=\"M12 5v14M5 12h14\"/>",
      calendar: "<rect x=\"3\" y=\"4.5\" width=\"18\" height=\"16\" rx=\"2\"/><path d=\"M7 2.5v4M17 2.5v4M3 9h18\"/>",
      chart: "<path d=\"M4 20V10M10 20V4M16 20v-7M22 20H2\"/>",
      transfer: "<path d=\"M17 3l4 4-4 4M3 7h18M7 21l-4-4 4-4M21 17H3\"/>",
      chevronLeft: "<path d=\"m15 18-6-6 6-6\"/>",
      chevronRight: "<path d=\"m9 18 6-6-6-6\"/>",
      palette: "<path d=\"M12 3a9 9 0 0 0 0 18h1.2a1.8 1.8 0 0 0 1.4-2.9 1.8 1.8 0 0 1 1.4-2.9H17a4 4 0 0 0 0-8h-5Z\"/><path d=\"M7.5 10h.01M10 7.5h.01M14 7.5h.01M16.5 10h.01\"/>",
      lock: "<rect x=\"5\" y=\"10\" width=\"14\" height=\"11\" rx=\"2\"/><path d=\"M8 10V7a4 4 0 0 1 8 0v3\"/>",
      share: "<path d=\"M12 16V3M8 7l4-4 4 4M5 13v7h14v-7\"/>",
      download: "<path d=\"M12 3v12M8 11l4 4 4-4M5 21h14\"/>",
      copy: "<rect x=\"9\" y=\"9\" width=\"11\" height=\"11\" rx=\"2\"/><path d=\"M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3\"/>",
      trash: "<path d=\"M4 7h16M10 11v6M14 11v6M9 7l1-3h4l1 3M6 7l1 14h10l1-14\"/>",
      check: "<path d=\"m5 12 4 4L19 6\"/>",
      undo: "<path d=\"M9 7 4 12l5 5M4 12h10a5 5 0 0 1 5 5v1\"/>",
      close: "<path d=\"m6 6 12 12M18 6 6 18\"/>",
      emptyCalendar: "<rect x=\"3\" y=\"4.5\" width=\"18\" height=\"16\" rx=\"2\"/><path d=\"M7 2.5v4M17 2.5v4M3 9h18M8 14h8M12 12v4\"/>",
      emptyChart: "<path d=\"M4 20V10M10 20V4M16 20v-7M22 20H2\"/>",
      more: "<path d=\"M5 12h.01M12 12h.01M19 12h.01\" stroke-width=\"3\"/>",
      information: "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 10v6M12 7h.01\"/>",
      file: "<path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z\"/><path d=\"M14 2v6h6\"/>",
      sun: "<circle cx=\"12\" cy=\"12\" r=\"5\"/><path d=\"M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42\"/>",
      moon: "<path d=\"M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z\"/>"
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || ""}</svg>`;
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#039;"
    })[character]);
  }

  function startOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  function parseDateInput(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));
    if (!match) return null;
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    if (Number.isNaN(date.getTime()) || dateKey(date) !== value) return null;
    return date;
  }

  function dateKey(date) {
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
  }

  function localStartOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function toSwiftISO(date) {
    return date.toISOString().replace(/\.\d{3}Z$/, "Z");
  }

  function isoForDay(day) {
    const date = parseDateInput(day);
    return date ? toSwiftISO(date) : null;
  }

  function isoForDayAndTime(day, time) {
    const date = parseDateInput(day);
    const match = /^(\d{2}):(\d{2})$/.exec(String(time));
    if (!date || !match) return null;
    date.setHours(Number(match[1]), Number(match[2]), 0, 0);
    return toSwiftISO(date);
  }

  function isTimeBefore(time1, time2) {
    const m1 = /^(\d{2}):(\d{2})$/.exec(String(time1));
    const m2 = /^(\d{2}):(\d{2})$/.exec(String(time2));
    if (!m1 || !m2) return false;
    const mins1 = Number(m1[1]) * 60 + Number(m1[2]);
    const mins2 = Number(m2[1]) * 60 + Number(m2[2]);
    return mins1 < mins2;
  }

  function nextDayKey(day) {
    const d = parseDateInput(day);
    if (!d) return day;
    d.setDate(d.getDate() + 1);
    return dateKey(d);
  }

  function isoForDayAndTimeOvernight(day, startTime, endTime) {
    if (isTimeBefore(endTime, startTime)) {
      return isoForDayAndTime(nextDayKey(day), endTime);
    }
    return isoForDayAndTime(day, endTime);
  }

  function parseDateTimeInput(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(String(value));
    if (!match) return null;
    const date = new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      Number(match[4]),
      Number(match[5])
    );
    const expectedDay = `${match[1]}-${match[2]}-${match[3]}`;
    if (Number.isNaN(date.getTime()) || dateKey(date) !== expectedDay) return null;
    return date;
  }

  function dateTimeLocalFromISO(value) {
    const date = validDate(value);
    if (!date) return "";
    return `${dateKey(date)}T${timeFromISO(value)}`;
  }

  function dateTimeForDay(day, time) {
    const value = isoForDayAndTime(day, time);
    return value ? dateTimeLocalFromISO(value) : "";
  }

  function validDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function timeFromISO(value) {
    const date = validDate(value);
    if (!date) return "00:00";
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }

  function dateFromISO(value) {
    const date = validDate(value);
    return date ? dateKey(date) : dateKey(new Date());
  }

  function formatMoney(amount) {
    return currencyFormatter.format(Number(amount) || 0);
  }

  function formatMonth(date) {
    const value = monthFormatter.format(date);
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function formatDayTitle(date) {
    return dayTitleFormatter.format(date);
  }

  function formatDate(date) {
    return dateFormatter.format(date);
  }

  function formatShiftDateTime(value) {
    const date = validDate(value);
    return date ? shiftDateTimeFormatter.format(date).replace(".", "") : "Data invalida";
  }

  function weekdayNames() {
    const sunday = new Date(2023, 0, 1);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(sunday);
      date.setDate(sunday.getDate() + index);
      return weekdayFormatter.format(date).replace(".", "").toUpperCase();
    });
  }

  function uuid() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    const bytes = new Uint8Array(16);
    if (globalThis.crypto?.getRandomValues) {
      globalThis.crypto.getRandomValues(bytes);
    } else {
      for (let index = 0; index < bytes.length; index += 1) {
        bytes[index] = Math.floor(Math.random() * 256);
      }
    }
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  function clampColor(value) {
    return Math.max(0, Math.min(1, Number(value) || 0));
  }

  function shiftColor(shift) {
    return `rgb(${Math.round(clampColor(shift.red) * 255)} ${Math.round(clampColor(shift.green) * 255)} ${Math.round(clampColor(shift.blue) * 255)})`;
  }

  function rgbToHex(shift) {
    const color = [shift.red, shift.green, shift.blue]
      .map((value) => Math.round(clampColor(value) * 255).toString(16).padStart(2, "0"))
      .join("");
    return `#${color}`;
  }

  function hexToRgb(hex) {
    const normalized = /^#[0-9a-f]{6}$/i.test(hex) ? hex.slice(1) : "1a8c85";
    return {
      red: parseInt(normalized.slice(0, 2), 16) / 255,
      green: parseInt(normalized.slice(2, 4), 16) / 255,
      blue: parseInt(normalized.slice(4, 6), 16) / 255
    };
  }

  function normalizeShift(raw) {
    if (!raw || typeof raw !== "object" || !uuidPattern.test(raw.id)) return null;
    const day = validDate(raw.day);
    const startsAt = validDate(raw.startsAt);
    const endsAt = validDate(raw.endsAt);
    if (!day || !startsAt || !endsAt || typeof raw.title !== "string" || typeof raw.notes !== "string") return null;
    if (!Number.isFinite(raw.amount) || typeof raw.isPaid !== "boolean") return null;
    if (![raw.red, raw.green, raw.blue].every(Number.isFinite)) return null;

    return {
      id: raw.id,
      day: toSwiftISO(localStartOfDay(day)),
      title: raw.title,
      startsAt: toSwiftISO(startsAt),
      endsAt: toSwiftISO(endsAt),
      amount: raw.amount,
      isPaid: raw.isPaid,
      notes: raw.notes,
      red: raw.red,
      green: raw.green,
      blue: raw.blue
    };
  }

  function sortShifts(shifts) {
    return [...shifts].sort((left, right) => {
      const byDay = new Date(left.day) - new Date(right.day);
      if (byDay !== 0) return byDay;
      return new Date(left.startsAt) - new Date(right.startsAt);
    });
  }

  function loadShifts() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (!Array.isArray(saved)) return [];
      return sortShifts(saved.map(normalizeShift).filter(Boolean));
    } catch {
      return [];
    }
  }

  function loadSavedShifts() {
    try {
      const saved = JSON.parse(localStorage.getItem(SHIFTS_LIST_KEY) || "[]");
      if (!Array.isArray(saved)) return [];
      return saved.filter(s => s && typeof s.title === "string" && typeof s.startTime === "string" && typeof s.endTime === "string");
    } catch {
      return [];
    }
  }

  function saveSavedShifts() {
    try {
      localStorage.setItem(SHIFTS_LIST_KEY, JSON.stringify(state.savedShifts));
      return true;
    } catch {
      showToast("Nao foi possivel gravar a lista de plantões salvos.");
      return false;
    }
  }

  function persistShifts() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.shifts));
      return true;
    } catch {
      showToast("Nao foi possivel gravar os dados neste navegador.");
      return false;
    }
  }

  function shiftsForDay(day) {
    return state.shifts
      .filter((shift) => dateFromISO(shift.day) === day)
      .sort((left, right) => new Date(left.startsAt) - new Date(right.startsAt));
  }

  function totals(shifts = state.shifts) {
    const total = shifts.reduce((sum, shift) => sum + shift.amount, 0);
    const paid = shifts.filter((shift) => shift.isPaid).reduce((sum, shift) => sum + shift.amount, 0);
    return { total, paid, unpaid: total - paid };
  }

  function render() {
    elements.app.innerHTML = state.tab === "calendar"
      ? renderCalendar()
      : state.tab === "summary"
        ? renderSummary()
        : renderBackup();
    elements.tabBar.innerHTML = renderTabBar();
    renderModal();
  }

  function renderScreenHeader(title, trailing = "") {
    return `<header class="screen-header"><h1>${title}</h1>${trailing}</header>`;
  }

  function renderCalendar() {
    const month = state.displayedMonth;
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const numberOfDays = new Date(year, monthIndex + 1, 0).getDate();
    const leadingDays = new Date(year, monthIndex, 1).getDay();
    const trailingDays = (7 - ((leadingDays + numberOfDays) % 7)) % 7;
    const cells = [
      ...Array(leadingDays).fill(null),
      ...Array.from({ length: numberOfDays }, (_, index) => new Date(year, monthIndex, index + 1)),
      ...Array(trailingDays).fill(null)
    ];
    const today = dateKey(new Date());
    const weekdays = weekdayNames().map((day) => `<span>${day}</span>`).join("");
    const dayCells = cells.map((date) => {
      if (!date) return '<div class="empty-cell" aria-hidden="true"></div>';
      const day = dateKey(date);
      const shifts = shiftsForDay(day);
      const dots = shifts.slice(0, 3).map((shift) => (
        `<i class="color-dot" style="background:${shiftColor(shift)}"></i>`
      )).join("");
      const extra = shifts.length > 3 ? `<span class="extra-dots">+${shifts.length - 3}</span>` : "";
      const classes = ["day-cell", shifts.length ? "has-shifts" : "", day === today ? "today" : "", day === state.selectedDay ? "selected" : ""].filter(Boolean).join(" ");
      const label = shifts.length
        ? `${formatDate(date)}, ${shifts.length} plantao(s)`
        : formatDate(date);
      return `<button class="${classes}" data-action="select-day" data-day="${day}" aria-label="${escapeHTML(label)}">
        <span class="day-number">${date.getDate()}</span>
        <span class="color-dots">${dots}${extra}</span>
      </button>`;
    }).join("");

    const selectedShifts = shiftsForDay(state.selectedDay);
    const shiftRows = selectedShifts.length ? selectedShifts.map((shift) => {
      const startDate = validDate(shift.startsAt);
      const endDate = validDate(shift.endsAt);
      const startDay = startDate ? `${String(startDate.getDate()).padStart(2, "0")}/${String(startDate.getMonth() + 1).padStart(2, "0")}` : "";
      const startTime = startDate ? `${String(startDate.getHours()).padStart(2, "0")}:${String(startDate.getMinutes()).padStart(2, "0")}` : "";
      const endDay = endDate ? `${String(endDate.getDate()).padStart(2, "0")}/${String(endDate.getMonth() + 1).padStart(2, "0")}` : "";
      const endTime = endDate ? `${String(endDate.getHours()).padStart(2, "0")}:${String(endDate.getMinutes()).padStart(2, "0")}` : "";
      return `
      <li class="shift-row" data-action="edit-shift" data-id="${shift.id}" tabindex="0" role="button" aria-label="Editar ${escapeHTML(shift.title)}">
        <div class="shift-info">
          <strong>${escapeHTML(shift.title)}</strong>
          <span>${startDay}, ${startTime}</span>
          <span>${endDay}, ${endTime}</span>
        </div>
        <div class="shift-value">
          <strong>${formatMoney(shift.amount)}</strong>
          <span class="payment-badge ${shift.isPaid ? "paid" : "unpaid"}">${shift.isPaid ? "PAGO" : "PENDENTE"}</span>
        </div>
        <div class="shift-actions">
          <button class="row-action" data-action="toggle-paid" data-id="${shift.id}" aria-label="${shift.isPaid ? "Marcar pendente" : "Marcar pago"}">${icon(shift.isPaid ? "undo" : "check")}</button>
          <button class="row-action delete" data-action="confirm-delete" data-id="${shift.id}" aria-label="Excluir ${escapeHTML(shift.title)}">${icon("trash")}</button>
        </div>
      </li>`;
    }).join("") : `<li class="empty-shifts">${icon("emptyCalendar")}<span>Nenhum plantao neste dia</span></li>`;

    return `<section class="screen">
      ${renderScreenHeader("Minha escala", `<button class="icon-button" data-action="toggle-theme" aria-label="${state.isDarkMode ? "Tema claro" : "Tema escuro"}">${icon(state.isDarkMode ? "sun" : "moon")}</button><button class="icon-button" data-action="new-shift" data-day="${state.selectedDay}" aria-label="Novo plantao">${icon("plus")}</button>`)}
      <div class="content">
        <div class="calendar-wrapper">
          <section class="calendar-card" aria-label="Calendario mensal">
            <div class="month-controls">
              <button class="month-button" data-action="previous-month" aria-label="Mes anterior">${icon("chevronLeft")}</button>
              <h2>${formatMonth(month)}</h2>
              <button class="month-button" data-action="next-month" aria-label="Proximo mes">${icon("chevronRight")}</button>
            </div>
            <div class="weekday-grid">${weekdays}</div>
            <div class="calendar-grid">${dayCells}</div>
          </section>
        </div>
        <section class="shifts-panel" aria-label="Plantões do dia selecionado">
          <div style="display: flex; justify-content: space-between; align-items: center; margin: 8px 16px 4px;">
            <h2 class="section-title" style="margin: 0; text-align: center; flex: 1;">${formatDayTitle(parseDateInput(state.selectedDay))}</h2>
            <button class="icon-button" data-action="open-repeat" data-day="${state.selectedDay}" aria-label="Repetir plantões" ${selectedShifts.length ? "" : "disabled"}>${icon("copy")}</button>
          </div>
          <ul class="shifts-list">${shiftRows}</ul>
        </section>
      </div>
    </section>`;
  }

  function renderSummary() {
    const currentMonth = state.summaryMonth;
    const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}`;
    const monthShifts = state.shifts.filter((shift) => {
      const date = validDate(shift.day);
      return date && `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}` === monthKey;
    });
    const monthTotals = totals(monthShifts);

    const showShifts = monthShifts.length ? monthShifts.map((shift) => {
      const date = validDate(shift.day);
      const startTime = timeFromISO(shift.startsAt);
      const endTime = timeFromISO(shift.endsAt);
      return `<li class="summary-row">
        <div class="summary-row-main">
          <strong>${escapeHTML(shift.title)}</strong>
          <span>${date ? dateKey(date).split("-").reverse().join("/") : ""} ${startTime} - ${endTime}</span>
        </div>
        <div class="summary-row-values">
          <strong>${formatMoney(shift.amount)}</strong>
          <span class="${shift.isPaid ? "paid-text" : "unpaid-text"}">${shift.isPaid ? "Pago" : "A receber"}</span>
        </div>
      </li>`;
    }).join("") : `<li style="padding: 24px; text-align: center; color: var(--muted);">${icon("emptyCalendar")}<span>Nenhum plantao neste mes</span></li>`;

    return `<section class="screen">
      ${renderScreenHeader("Pagamentos")}
      <div class="content">
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0;">
          <button class="icon-button" data-action="summary-prev-month" aria-label="Mes anterior">${icon("chevronLeft")}</button>
          <strong style="font-size: 18px;">${formatMonth(currentMonth)}</strong>
          <button class="icon-button" data-action="summary-next-month" aria-label="Mes seguinte">${icon("chevronRight")}</button>
        </div>
        <section class="summary-cards" aria-label="Resumo do mes">
          <article class="amount-card"><span>TOTAL</span><strong>${formatMoney(monthTotals.total)}</strong></article>
          <article class="amount-card paid"><span>RECEBIDO</span><strong>${formatMoney(monthTotals.paid)}</strong></article>
          <article class="amount-card unpaid"><span>A RECEBER</span><strong>${formatMoney(monthTotals.unpaid)}</strong></article>
        </section>
        <ul class="summary-list">${showShifts}</ul>
      </div>
    </section>`;
  }

  function renderBackup() {
    const lastShift = state.shifts[state.shifts.length - 1];
    const lastShiftText = lastShift ? formatDate(validDate(lastShift.day)) : "Nenhum";
    return `<section class="screen">
      ${renderScreenHeader("Backup")}
      <div class="content">
        <aside class="privacy-card">
          <span class="inline-icon">${icon("lock")}</span>
          <p>Seus dados ficam somente neste dispositivo, sem conta e sem assinatura.</p>
        </aside>

        <section>
          <h2 class="section-title">Enviar para outro aparelho</h2>
          <div class="backup-section">
            <button class="backup-button" data-action="export-backup">${icon("share")}<span>Criar arquivo de backup</span></button>
            <p class="backup-description">Envie o arquivo .escalaclara por AirDrop, Mensagens ou salve-o em Arquivos. O outro aparelho pode importá-lo neste app.</p>
          </div>
        </section>

        <section>
          <h2 class="section-title">Receber backup</h2>
          <div class="backup-section">
            <button class="backup-button" data-action="open-import">${icon("download")}<span>Importar arquivo</span></button>
            <p class="backup-description">Ao importar, voce podera escolher entre mesclar os registros ou substituir sua escala atual.</p>
          </div>
        </section>

        <section>
          <h2 class="section-title">Conteudo atual</h2>
          <ul class="backup-list">
            <li class="backup-row"><span>Plantões salvos</span><span class="summary-row-values"><strong>${state.shifts.length}</strong></span></li>
            <li class="backup-row"><span>Ultimo plantao</span><span class="summary-row-values"><strong>${escapeHTML(lastShiftText)}</strong></span></li>
          </ul>
        </section>
      </div>
    </section>`;
  }

  function renderEmptyState(iconName, title, message) {
    return `<div class="empty-state">${icon(iconName)}<strong>${title}</strong><p>${message}</p></div>`;
  }

  function renderTabBar() {
    const tabs = [
      ["calendar", "Calendario", "calendar"],
      ["summary", "Pagamentos", "chart"],
      ["backup", "Backup", "transfer"]
    ];
    return tabs.map(([id, label, iconName]) => `<button class="tab-button ${state.tab === id ? "active" : ""}" data-action="select-tab" data-tab="${id}" aria-current="${state.tab === id ? "page" : "false"}">${icon(iconName)}<span>${label}</span></button>`).join("");
  }

  function renderModal() {
    if (!state.modal) {
      elements.modalRoot.innerHTML = "";
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      return;
    }
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";

    if (state.modal.type === "shift-form") {
      elements.modalRoot.innerHTML = renderShiftForm(state.modal);
      setupAmountInput();
      return;
    }
    if (state.modal.type === "copy") {
      elements.modalRoot.innerHTML = renderCopyDialog(state.modal);
      return;
    }
    if (state.modal.type === "repeat") {
      elements.modalRoot.innerHTML = renderRepeatDialog(state.modal);
      return;
    }
    if (state.modal.type === "confirm-delete") {
      elements.modalRoot.innerHTML = renderConfirmDeleteDialog(state.modal);
      return;
    }
    if (state.modal.type === "import") {
      elements.modalRoot.innerHTML = renderImportDialog();
    }
    if (state.modal.type === "saved-shifts") {
      elements.modalRoot.innerHTML = renderSavedShiftsDialog(state.modal);
      if (state.modal.mode === "edit") setupAmountInput();
    }
  }

  function formatCurrencyInput(value) {
    const num = Number(value);
    if (isNaN(num) || num === 0) return "";
    return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function parseCurrencyInput(value) {
    const clean = String(value).replace(/[^\d,]/g, "").replace(",", ".");
    const num = Number(clean);
    return isNaN(num) ? 0 : num;
  }

  function formatCurrencyAsYouType(value) {
    const digits = String(value).replace(/\D/g, "");
    if (!digits) return "";
    const cents = digits.padStart(3, "0");
    const integerPart = cents.slice(0, -2);
    const decimalPart = cents.slice(-2);
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `R$ ${formattedInteger},${decimalPart}`;
  }

  function parseCurrencyMasked(value) {
    const digits = String(value).replace(/\D/g, "");
    if (!digits) return 0;
    return Number(digits) / 100;
  }

  function setupAmountInput() {
    const ids = ["shift-amount", "saved-amount"];
    for (const id of ids) {
      const input = document.getElementById(id);
      if (!input) continue;
      
      input.addEventListener("input", (e) => {
        const cursorPos = input.selectionStart;
        const oldValue = input.value;
        const rawValue = input.value.replace(/\D/g, "");
        const formattedValue = formatCurrencyAsYouType(rawValue);
        input.value = formattedValue;
        input.dataset.rawAmount = rawValue ? (Number(rawValue) / 100).toFixed(2) : "0";
        
        const newLength = formattedValue.length;
        const oldLength = oldValue.length;
        const diff = newLength - oldLength;
        input.setSelectionRange(cursorPos + diff, cursorPos + diff);
      });

      input.addEventListener("focus", () => {
        if (!input.value) {
          input.value = "R$ 0,00";
        }
      });

      input.addEventListener("blur", () => {
        if (input.value === "R$ 0,00") {
          input.value = "";
        }
      });
    }
  }

  function renderShiftForm(modal) {
    const editing = modal.id ? state.shifts.find((shift) => shift.id === modal.id) : null;
    const day = editing ? dateFromISO(editing.day) : (modal.day || dateKey(new Date()));
    const defaults = editing || {
      title: modal.prefill?.title || "Plantao",
      startsAt: modal.prefill?.startsAt || isoForDayAndTime(day, "07:00"),
      endsAt: modal.prefill?.endsAt || isoForDayAndTime(day, "19:00"),
      amount: modal.prefill?.amount ?? 0,
      isPaid: false,
      notes: "",
      red: modal.prefill?.red ?? DEFAULT_COLOR.red,
      green: modal.prefill?.green ?? DEFAULT_COLOR.green,
      blue: modal.prefill?.blue ?? DEFAULT_COLOR.blue
    };
    const fromSavedList = !!modal.prefill;
    const formTitle = editing ? "Editar plantao" : "Novo plantao";
    return `<div class="modal-backdrop" role="presentation">
      <section class="sheet" role="dialog" aria-modal="true" aria-label="${formTitle}">
        <header class="sheet-header">
          <span class="header-left"><button class="text-button" data-action="close-modal">Cancelar</button></span>
          <h2>${formTitle}</h2>
          <span class="header-right"><button class="text-button" type="submit" form="shift-form">Salvar</button></span>
        </header>
        <form id="shift-form" data-id="${editing ? editing.id : ""}" ${fromSavedList ? 'data-from-saved-list="true"' : ""}>
          <div class="sheet-content">
            <section class="form-section">
              <h3 class="section-title">Plantao</h3>
              <div class="form-list">
                <div class="form-row" style="position: relative;">
                  <label for="shift-title">Descricao</label>
                  <div style="display: flex; gap: 8px; width: 100%;">
                    <input id="shift-title" name="title" value="${escapeHTML(defaults.title)}" autocomplete="off" required style="flex: 1;" placeholder="Digite ou selecione um plantao salvo">
                    <button type="button" class="icon-button" data-action="open-saved-shifts" aria-label="Selecionar plantao salvo" style="flex: 0 0 40px;">${icon("file")}</button>
                  </div>
                </div>
                <div class="form-row"><label for="shift-start">Inicio</label><input id="shift-start" name="startsAt" type="datetime-local" value="${dateTimeLocalFromISO(defaults.startsAt)}" required></div>
                <div class="form-row"><label for="shift-end">Fim</label><input id="shift-end" name="endsAt" type="datetime-local" value="${dateTimeLocalFromISO(defaults.endsAt)}" required></div>
              </div>
            </section>
            <section class="form-section">
              <h3 class="section-title">Pagamento</h3>
              <div class="form-list">
                <div class="form-row">
                  <label for="shift-amount">Valor</label>
                  <input id="shift-amount" name="amount" type="text" inputmode="numeric" value="${formatCurrencyAsYouType(defaults.amount * 100)}" required placeholder="R$ 0,00" data-raw-amount="${defaults.amount}">
                </div>
                <div class="form-row"><span>Ja foi pago</span><label class="switch" aria-label="Ja foi pago"><input name="isPaid" type="checkbox" ${defaults.isPaid ? "checked" : ""}><span></span></label></div>
              </div>
            </section>
            <section class="form-section">
              <h3 class="section-title">Identificacao</h3>
              <div class="form-list">
                <div class="form-row"><label for="shift-color">Cor do plantao</label><input id="shift-color" name="color" type="color" value="${rgbToHex(defaults)}"></div>
                <div class="form-row"><label for="shift-notes">Observacoes</label><textarea id="shift-notes" name="notes" rows="3" placeholder="">${escapeHTML(defaults.notes)}</textarea></div>
              </div>
            </section>
          </div>
        </form>
      </section>
    </div>`;
  }

  function renderCopyDialog(modal) {
    const count = shiftsForDay(modal.sourceDay).length;
    const sourceDate = parseDateInput(modal.sourceDay);
    const calMonth = modal.copyMonth ?? sourceDate.getMonth();
    const calYear = modal.copyYear ?? sourceDate.getFullYear();
    
    const firstDay = new Date(calYear, calMonth, 1);
    const lastDay = new Date(calYear, calMonth + 1, 0);
    const leadingDays = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const cells = [
      ...Array(leadingDays).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => new Date(calYear, calMonth, i + 1))
    ];
    
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    
    const dayButtons = cells.map(date => {
      if (!date) return '<div class="copy-cal-empty"></div>';
      const dk = dateKey(date);
      const isSelected = modal.targetDays?.includes(dk) || false;
      const isSourceDay = dk === modal.sourceDay;
      const classes = ["copy-cal-day", isSelected ? "selected" : "", isSourceDay ? "source-day" : ""].filter(Boolean).join(" ");
      return `<button type="button" class="${classes}" data-day="${dk}" data-action="toggle-copy-day" aria-label="${date.getDate()} de ${monthNames[calMonth]}${isSelected ? ", selecionado" : ""}${isSourceDay ? ", dia original" : ""}">
        <span>${date.getDate()}</span>
      </button>`;
    }).join("");
    
    const selectedCount = modal.targetDays?.length || 0;
    
    return `<div class="modal-backdrop dialog-backdrop" role="presentation">
      <form class="dialog copy-dialog" id="copy-form" data-source-day="${modal.sourceDay}" role="dialog" aria-modal="true" aria-label="Copiar plantoes">
        <div class="dialog-copy">
          <h2>Copiar plantoes</h2>
          <p>Serao criados ${count} plantao(oes) para cada dia selecionado. Toque nos dias para selecionar.</p>
          <div class="copy-calendar-wrapper">
            <div class="copy-cal-nav">
              <button type="button" class="month-button" data-action="copy-prev-month" aria-label="Mes anterior">${icon("chevronLeft")}</button>
              <h3>${monthNames[calMonth]} ${calYear}</h3>
              <button type="button" class="month-button" data-action="copy-next-month" aria-label="Proximo mes">${icon("chevronRight")}</button>
            </div>
            <div class="copy-weekdays">${["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map(d => `<span>${d}</span>`).join("")}</div>
            <div class="copy-calendar-grid">${dayButtons}</div>
          </div>
          <div class="copy-selected-info" style="margin-top: 12px; padding: 10px; background: var(--secondary-fill); border-radius: 8px; text-align: center;">
            <span>${selectedCount} dia(s) selecionado(s)</span>
            <input type="hidden" name="targetDays" value="${modal.targetDays?.join(",") || ""}">
          </div>
        </div>
        <div class="dialog-actions">
          <button type="submit" ${selectedCount === 0 ? "disabled" : ""}>Copiar para ${selectedCount} dia(s)</button>
          <button type="button" data-action="close-modal">Cancelar</button>
        </div>
      </form>
    </div>`;
  }

  function renderImportDialog() {
    return `<div class="modal-backdrop dialog-backdrop" role="presentation">
      <section class="dialog" role="dialog" aria-modal="true" aria-label="Importar escala">
        <div class="dialog-copy">
          <h2>Importar escala</h2>
          <p>Escolha mesclar para manter seus registros atuais ou substituir para usar apenas o backup recebido.</p>
        </div>
        <div class="dialog-actions">
          <button data-action="apply-import" data-mode="merge">Mesclar com meus plantões</button>
          <button class="destructive" data-action="apply-import" data-mode="replace">Substituir todos os meus plantões</button>
          <button data-action="cancel-import">Cancelar</button>
        </div>
      </section>
    </div>`;
  }

  function renderSavedShiftsDialog(modal) {
    const shiftId = modal.shiftId;
    const isEditing = modal.mode === "edit";
    const savedShifts = state.savedShifts;
    
    const shiftRows = savedShifts.length ? savedShifts.map((saved, index) => {
      const colorHex = (saved.red != null) ? rgbToHex({ red: saved.red, green: saved.green, blue: saved.blue }) : "";
      return `<li class="saved-shift-row" data-index="${index}" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; background: var(--surface); border-bottom: 1px solid var(--line); gap: 10px;">
        <div style="flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px;">
          ${colorHex ? `<span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: ${colorHex}; flex-shrink: 0;"></span>` : ""}
          <div style="flex: 1; min-width: 0;">
            <strong style="display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHTML(saved.title)}</strong>
            <span style="display: block; margin-top: 2px; color: var(--muted); font-size: 12px;">${saved.startTime} - ${saved.endTime}${saved.amount ? ` · ${formatMoney(saved.amount)}` : ""}</span>
          </div>
        </div>
        <div style="display: flex; gap: 4px;">
          <button type="button" class="row-action" data-action="select-saved-shift" data-index="${index}" aria-label="Selecionar ${escapeHTML(saved.title)}">${icon("check")}</button>
          <button type="button" class="row-action" data-action="edit-saved-shift" data-index="${index}" aria-label="Editar ${escapeHTML(saved.title)}">${icon("palette")}</button>
          <button type="button" class="row-action delete" data-action="delete-saved-shift" data-index="${index}" aria-label="Excluir ${escapeHTML(saved.title)}">${icon("trash")}</button>
        </div>
      </li>`;
    }).join("") : `<li class="empty-shifts" style="padding: 24px; text-align: center; color: var(--muted);">${icon("emptyCalendar")}<span>Nenhum plantão salvo</span></li>`;
    
    if (isEditing) {
      const saved = savedShifts[modal.editIndex];
      const savedColor = { red: saved?.red, green: saved?.green, blue: saved?.blue };
      return `<div class="modal-backdrop dialog-backdrop" role="presentation">
        <form class="dialog" id="saved-shift-form" data-index="${modal.editIndex}" role="dialog" aria-modal="true" aria-label="Editar plantão salvo">
          <div class="dialog-copy">
            <h2>Editar plantão salvo</h2>
          </div>
          <div style="padding: 0 20px 16px;">
            <div class="form-list" style="margin-bottom: 16px;">
              <div class="form-row" style="flex-direction: column; align-items: stretch; gap: 8px; padding: 12px 0;">
                <label for="saved-title">Descricao</label>
                <input id="saved-title" name="title" value="${escapeHTML(saved?.title || "")}" required autocomplete="off">
              </div>
              <div class="form-row" style="flex-direction: column; align-items: stretch; gap: 8px; padding: 12px 0;">
                <label for="saved-start">Horario de inicio</label>
                <input id="saved-start" name="startTime" type="time" value="${escapeHTML(saved?.startTime || "07:00")}" required>
              </div>
              <div class="form-row" style="flex-direction: column; align-items: stretch; gap: 8px; padding: 12px 0;">
                <label for="saved-end">Horario de fim</label>
                <input id="saved-end" name="endTime" type="time" value="${escapeHTML(saved?.endTime || "19:00")}" required>
              </div>
              <div class="form-row" style="flex-direction: column; align-items: stretch; gap: 8px; padding: 12px 0;">
                <label for="saved-amount">Valor</label>
                <input id="saved-amount" name="amount" type="text" inputmode="numeric" value="${formatCurrencyAsYouType((saved?.amount || 0) * 100)}" placeholder="R$ 0,00">
              </div>
              <div class="form-row" style="flex-direction: column; align-items: stretch; gap: 8px; padding: 12px 0;">
                <label for="saved-color">Cor do plantao</label>
                <input id="saved-color" name="color" type="color" value="${rgbToHex(savedColor.red != null ? savedColor : DEFAULT_COLOR)}">
              </div>
            </div>
          </div>
          <div class="dialog-actions">
            <button type="submit">Salvar alteracoes</button>
            <button type="button" data-action="close-modal">Cancelar</button>
          </div>
        </form>
      </div>`;
    }
    
    return `<div class="modal-backdrop dialog-backdrop" role="presentation">
      <section class="dialog saved-shifts-dialog" role="dialog" aria-modal="true" aria-label="Plantões salvos" style="max-height: 80dvh; overflow-y: auto;">
        <div class="dialog-copy">
          <h2>Plantões salvos</h2>
          <p>Toque em um plantão para selecioná-lo. Toque no ícone de edição para alterar.</p>
        </div>
        <div style="padding: 0 16px 16px;">
          <ul class="saved-shifts-list" style="margin: 0; padding: 0; list-style: none; background: var(--surface); border-radius: 12px; overflow: hidden;">${shiftRows}</ul>
          <button type="button" class="text-button" data-action="new-saved-shift" style="margin-top: 12px; width: 100%; text-align: left;">${icon("plus")} Novo plantão salvo</button>
        </div>
        <div class="dialog-actions">
          <button type="button" data-action="close-modal">Cancelar</button>
        </div>
      </section>
    </div>`;
  }

  function renderConfirmDeleteDialog(modal) {
    const shift = state.shifts.find((s) => s.id === modal.shiftId);
    const title = shift ? escapeHTML(shift.title) : "este plantão";
    return `<div class="modal-backdrop dialog-backdrop" role="presentation">
      <section class="dialog" role="dialog" aria-modal="true" aria-label="Confirmar exclusao">
        <div class="dialog-copy">
          <h2>Excluir plantao</h2>
          <p>Tem certeza que deseja excluir <strong>${title}</strong>? Esta acao nao pode ser desfeita.</p>
        </div>
        <div class="dialog-actions">
          <button class="destructive" data-action="delete-shift" data-id="${modal.shiftId}">Excluir</button>
          <button data-action="close-modal">Cancelar</button>
        </div>
      </section>
    </div>`;
  }

  function renderRepeatDialog(modal) {
    const sourceDay = parseDateInput(modal.sourceDay);
    const sourceShifts = shiftsForDay(modal.sourceDay);
    const weekdayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
    const today = new Date();
    const sourceWeekday = sourceDay.getDay();
    
    // Generate future dates for the next 12 weeks for each weekday
    const futureDates = [];
    for (let week = 1; week <= 12; week++) {
      for (let wd = 0; wd < 7; wd++) {
        const daysToAdd = (wd - sourceWeekday + 7) % 7 + week * 7;
        const date = new Date(sourceDay);
        date.setDate(sourceDay.getDate() + daysToAdd);
        if (date > today) {
          const key = dateKey(date);
          if (!futureDates.some(d => d.key === key)) {
            futureDates.push({ key, date, weekday: wd });
          }
        }
      }
    }
    // Group by weekday
    const datesByWeekday = {};
    for (const item of futureDates) {
      if (!datesByWeekday[item.weekday]) datesByWeekday[item.weekday] = [];
      if (datesByWeekday[item.weekday].length < 4) {
        datesByWeekday[item.weekday].push(item);
      }
    }

    const weekdayOptions = Object.entries(datesByWeekday).map(([wd, dates]) => {
      const selected = modal.weekdays.includes(Number(wd)) ? "selected" : "";
      const dateLabels = dates.map(d => formatDate(d.date)).join(", ");
      return `<label class="weekday-option ${selected}" data-weekday="${wd}" data-action="toggle-weekday">
        <span class="weekday-name">${weekdayNames[Number(wd)]}</span>
        <span class="weekday-dates">${dateLabels}</span>
      </label>`;
    }).join("");

    return `<div class="modal-backdrop dialog-backdrop" role="presentation">
      <form class="dialog" id="repeat-form" data-source-day="${modal.sourceDay}" role="dialog" aria-modal="true" aria-label="Repetir plantões">
        <div class="dialog-copy">
          <h2>Repetir plantões</h2>
          <p>Selecione os dias da semana para repetir os <strong>${sourceShifts.length}</strong> plantões de ${formatDayTitle(sourceDay)}. As datas futuras serao criadas automaticamente.</p>
        </div>
        <div class="weekday-selector">
          ${weekdayOptions}
        </div>
        <div class="dialog-actions">
          <button type="submit">Repetir em dias selecionados</button>
          <button type="button" data-action="close-modal">Cancelar</button>
        </div>
      </form>
    </div>`;
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("show");
    toastTimer = setTimeout(() => elements.toast.classList.remove("show"), 3600);
  }

  function openShiftForm(day = dateKey(new Date()), id = null) {
    state.modal = { type: "shift-form", day, id };
    renderModal();
  }

  function handleClick(event) {
    const target = event.target.closest("[data-action]");
    if (!target || target.disabled) return;
    const { action } = target.dataset;

    if (action === "select-tab") {
      state.tab = target.dataset.tab;
      state.modal = null;
      render();
      return;
    }
    if (action === "summary-prev-month" || action === "summary-next-month") {
      state.summaryMonth = new Date(
        state.summaryMonth.getFullYear(),
        state.summaryMonth.getMonth() + (action === "summary-next-month" ? 1 : -1),
        1
      );
      render();
      return;
    }
    if (action === "previous-month" || action === "next-month") {
      state.displayedMonth = new Date(
        state.displayedMonth.getFullYear(),
        state.displayedMonth.getMonth() + (action === "next-month" ? 1 : -1),
        1
      );
      render();
      return;
    }
    if (action === "select-day") {
      state.selectedDay = target.dataset.day;
      state.modal = null;
      render();
      return;
    }
    if (action === "close-modal") {
      state.modal = null;
      renderModal();
      return;
    }
    if (action === "toggle-theme") {
      state.isDarkMode = !state.isDarkMode;
      saveTheme(state.isDarkMode);
      applyTheme(state.isDarkMode);
      render();
      return;
    }
    if (action === "new-shift") {
      openShiftForm(target.dataset.day || state.selectedDay);
      return;
    }
    if (action === "edit-shift") {
      const shift = state.shifts.find((item) => item.id === target.dataset.id);
      if (shift) openShiftForm(dateFromISO(shift.day), shift.id);
      return;
    }
    if (action === "toggle-paid") {
      const shift = state.shifts.find((item) => item.id === target.dataset.id);
      if (!shift) return;
      shift.isPaid = !shift.isPaid;
      persistShifts();
      render();
      return;
    }
    if (action === "confirm-delete") {
      state.modal = { type: "confirm-delete", shiftId: target.dataset.id };
      renderModal();
      return;
    }
    if (action === "delete-shift") {
      state.shifts = state.shifts.filter((shift) => shift.id !== target.dataset.id);
      persistShifts();
      state.modal = null;
      render();
      return;
    }
    if (action === "open-copy") {
      const sourceDay = target.dataset.day || state.selectedDay;
      const source = parseDateInput(sourceDay);
      if (!source || !shiftsForDay(sourceDay).length) return;
      state.modal = { type: "copy", sourceDay, targetDays: [], copyMonth: source.getMonth(), copyYear: source.getFullYear() };
      renderModal();
      return;
    }
    if (action === "copy-prev-month") {
      let m = (state.modal.copyMonth ?? 0) - 1;
      let y = state.modal.copyYear ?? new Date().getFullYear();
      if (m < 0) { m = 11; y--; }
      state.modal.copyMonth = m;
      state.modal.copyYear = y;
      renderModal();
      return;
    }
    if (action === "copy-next-month") {
      let m = (state.modal.copyMonth ?? 0) + 1;
      let y = state.modal.copyYear ?? new Date().getFullYear();
      if (m > 11) { m = 0; y++; }
      state.modal.copyMonth = m;
      state.modal.copyYear = y;
      renderModal();
      return;
    }
    if (action === "toggle-copy-day") {
      const day = target.dataset.day;
      if (!day || day === state.modal.sourceDay) return;
      const targetDays = state.modal.targetDays || [];
      const index = targetDays.indexOf(day);
      if (index === -1) {
        targetDays.push(day);
      } else {
        targetDays.splice(index, 1);
      }
      state.modal.targetDays = targetDays;
      renderModal();
      return;
    }
    if (action === "open-saved-shifts") {
      const titleInput = document.getElementById("shift-title");
      const day = state.modal?.day || state.selectedDay;
      state.modal = { type: "saved-shifts", parentShiftForm: { day, id: state.modal?.id } };
      renderModal();
      return;
    }
    if (action === "select-saved-shift") {
      const index = Number(target.dataset.index);
      const saved = state.savedShifts[index];
      if (!saved) return;
      const shiftModal = state.modal.parentShiftForm;
      const day = shiftModal?.day || state.selectedDay;
      const startsAt = isoForDayAndTime(day, saved.startTime);
      const endsAt = isoForDayAndTimeOvernight(day, saved.startTime, saved.endTime);
      state.modal = {
        type: "shift-form",
        day,
        id: shiftModal?.id || null,
        prefill: { title: saved.title, startsAt, endsAt, amount: saved.amount || 0, red: saved.red, green: saved.green, blue: saved.blue }
      };
      renderModal();
      return;
    }
    if (action === "edit-saved-shift") {
      const index = Number(target.dataset.index);
      state.modal = { type: "saved-shifts", mode: "edit", editIndex: index };
      renderModal();
      return;
    }
    if (action === "delete-saved-shift") {
      const index = Number(target.dataset.index);
      state.savedShifts.splice(index, 1);
      saveSavedShifts();
      renderModal();
      return;
    }
    if (action === "new-saved-shift") {
      state.modal = { type: "saved-shifts", mode: "edit", editIndex: state.savedShifts.length };
      renderModal();
      return;
    }
    if (action === "open-repeat") {
      const sourceDay = target.dataset.day || state.selectedDay;
      const source = parseDateInput(sourceDay);
      if (!source || !shiftsForDay(sourceDay).length) return;
      state.modal = { type: "copy", sourceDay, targetDays: [] };
      renderModal();
      return;
    }
    if (action === "export-backup") {
      exportBackup();
      return;
    }
    if (action === "open-import") {
      elements.importInput.click();
      return;
    }
    if (action === "apply-import") {
      applyImport(target.dataset.mode === "replace");
      return;
    }
    if (action === "cancel-import") {
      state.pendingArchive = null;
      state.modal = null;
      renderModal();
    }
    if (action === "toggle-weekday") {
      const option = target.closest(".weekday-option");
      if (option) {
        option.classList.toggle("selected");
        const dialog = option.closest("#repeat-form");
        if (dialog) {
          const weekdays = [...dialog.querySelectorAll(".weekday-option.selected")].map(el => Number(el.dataset.weekday));
          state.modal.weekdays = weekdays;
        }
      }
      return;
    }
  }

  function handleSubmit(event) {
    const form = event.target;
    if (form.id === "shift-form") {
      event.preventDefault();
      saveShift(form);
      return;
    }
    if (form.id === "copy-form") {
      event.preventDefault();
      copyDay(form);
    }
    if (form.id === "repeat-form") {
      event.preventDefault();
      repeatShifts(form);
    }
    if (form.id === "saved-shift-form") {
      event.preventDefault();
      saveSavedShift(form);
    }
  }

  function saveShift(form) {
    const data = new FormData(form);
    const title = String(data.get("title") || "").trim();
    const amount = parseCurrencyMasked(data.get("amount"));
    const startsAt = parseDateTimeInput(data.get("startsAt"));
    const endsAt = parseDateTimeInput(data.get("endsAt"));

    if (!title) {
      showToast("Informe uma descricao para o plantao.");
      return;
    }
    if (!Number.isFinite(amount) || amount < 0) {
      showToast("O valor do plantao nao pode ser negativo.");
      return;
    }
    if (!startsAt || !endsAt) {
      showToast("Informe data e horarios validos para inicio e fim.");
      return;
    }

    const color = hexToRgb(String(data.get("color") || ""));
    const current = form.dataset.id ? state.shifts.find((shift) => shift.id === form.dataset.id) : null;
    const shift = {
      id: current?.id || uuid(),
      day: toSwiftISO(localStartOfDay(startsAt)),
      title,
      startsAt: toSwiftISO(startsAt),
      endsAt: toSwiftISO(endsAt),
      amount,
      isPaid: data.get("isPaid") === "on",
      notes: String(data.get("notes") || "").trim(),
      ...color
    };

    if (current) {
      state.shifts = state.shifts.map((item) => item.id === current.id ? shift : item);
    } else {
      state.shifts = [...state.shifts, shift];
    }
    state.shifts = sortShifts(state.shifts);
    persistShifts();
    
    // If this is a new shift (not from saved list), add to saved shifts list
    if (!current && !form.dataset.fromSavedList) {
      const startTime = timeFromISO(startsAt);
      const endTime = timeFromISO(endsAt);
      const exists = state.savedShifts.some(s => s.title === title && s.startTime === startTime && s.endTime === endTime);
      if (!exists) {
        state.savedShifts.push({ title, startTime, endTime, amount, red: color.red, green: color.green, blue: color.blue });
        saveSavedShifts();
      }
    }
    
    state.modal = null;
    render();
  }

  function saveSavedShift(form) {
    const data = new FormData(form);
    const title = String(data.get("title") || "").trim();
    const startTime = String(data.get("startTime") || "").trim();
    const endTime = String(data.get("endTime") || "").trim();
    const amount = parseCurrencyMasked(data.get("amount"));
    const colorHex = String(data.get("color") || "");
    const color = hexToRgb(colorHex);
    const index = Number(form.dataset.index);

    if (!title || !startTime || !endTime) {
      showToast("Preencha todos os campos.");
      return;
    }

    const savedShift = { title, startTime, endTime, amount: Number.isFinite(amount) ? amount : 0, red: color.red, green: color.green, blue: color.blue };

    if (index >= 0 && index < state.savedShifts.length) {
      state.savedShifts[index] = savedShift;
    } else {
      state.savedShifts.push(savedShift);
    }
    saveSavedShifts();
    state.modal = { type: "saved-shifts" };
    renderModal();
  }

  function copyDay(form) {
    const sourceDay = form.dataset.sourceDay;
    const targetDaysInput = form.querySelector('input[name="targetDays"]');
    const targetDays = targetDaysInput?.value ? targetDaysInput.value.split(",").filter(d => d) : [];
    const sourceShifts = shiftsForDay(sourceDay);
    if (!targetDays.length || !sourceShifts.length) {
      showToast("Selecione pelo menos um dia para copiar a escala.");
      return;
    }

    const copied = [];
    for (const targetDay of targetDays) {
      if (!isoForDay(targetDay)) continue;
      for (const shift of sourceShifts) {
        const startTime = timeFromISO(shift.startsAt);
        const endTime = timeFromISO(shift.endsAt);
        copied.push({
          ...shift,
          id: uuid(),
          day: isoForDay(targetDay),
          startsAt: isoForDayAndTime(targetDay, startTime),
          endsAt: isoForDayAndTimeOvernight(targetDay, startTime, endTime),
          isPaid: false
        });
      }
    }
    state.shifts = sortShifts([...state.shifts, ...copied]);
    persistShifts();
    state.modal = null;
    render();
    showToast(`${copied.length} plantoes copiados com sucesso.`);
  }

  function repeatShifts(form) {
    const sourceDay = form.dataset.sourceDay;
    const sourceShifts = shiftsForDay(sourceDay);
    if (!sourceShifts.length) {
      showToast("Nenhum plantao para repetir.");
      return;
    }

    const selectedWeekdays = [...form.querySelectorAll(".weekday-option.selected")].map(el => Number(el.dataset.weekday));
    if (selectedWeekdays.length === 0) {
      showToast("Selecione pelo menos um dia da semana.");
      return;
    }

    const sourceDate = parseDateInput(sourceDay);
    const sourceMonth = sourceDate.getMonth();
    const sourceYear = sourceDate.getFullYear();
    const today = new Date();
    const copied = [];

    for (const targetWeekday of selectedWeekdays) {
      for (let week = 1; week <= 8; week++) {
        const daysToAdd = (targetWeekday - sourceDate.getDay() + 7) % 7 + week * 7;
        const targetDate = new Date(sourceDate);
        targetDate.setDate(sourceDate.getDate() + daysToAdd);
        if (targetDate <= today) continue;
        
        // Only include dates in current month or next month
        const targetMonth = targetDate.getMonth();
        const targetYear = targetDate.getFullYear();
        if (targetYear !== sourceYear || (targetMonth !== sourceMonth && targetMonth !== (sourceMonth + 1) % 12)) {
          continue;
        }
        
        const targetDay = dateKey(targetDate);
        // Check if shift already exists on this day
        const exists = state.shifts.some(s => dateFromISO(s.day) === targetDay && 
          sourceShifts.some(ss => ss.title === s.title && ss.startsAt === s.startsAt));
        if (exists) continue;

        for (const shift of sourceShifts) {
          const startTime = timeFromISO(shift.startsAt);
          const endTime = timeFromISO(shift.endsAt);
          copied.push({
            ...shift,
            id: uuid(),
            day: isoForDay(targetDay),
            startsAt: isoForDayAndTime(targetDay, startTime),
            endsAt: isoForDayAndTimeOvernight(targetDay, startTime, endTime),
            isPaid: false
          });
        }
      }
    }

    if (copied.length === 0) {
      showToast("Nenhum novo plantao criado (ja existem ou fora do periodo).");
      return;
    }

    state.shifts = sortShifts([...state.shifts, ...copied]);
    persistShifts();
    state.modal = null;
    render();
    showToast(`${copied.length} plantões criados com sucesso.`);
  }

  function archiveForExport() {
    return {
      schemaVersion: ARCHIVE_VERSION,
      exportedAt: toSwiftISO(new Date()),
      shifts: state.shifts.map((shift) => ({ ...shift }))
    };
  }

  async function exportBackup() {
    const archive = archiveForExport();
    const payload = JSON.stringify(archive, null, 2);
    const stamp = dateKey(new Date());
    const filename = `escala-clara-${stamp}.escalaclara`;
    const blob = new Blob([payload], { type: "application/json" });
    const file = new File([blob], filename, { type: "application/json" });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "Backup Escala Clara" });
        return;
      } catch (error) {
        if (error?.name === "AbortError") return;
      }
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("Arquivo de backup criado.");
  }

  async function importBackup(file) {
    if (!file) return;
    try {
      const content = await file.text();
      const archive = JSON.parse(content);
      const validation = validateArchive(archive);
      if (validation.error) {
        showToast(validation.error);
        return;
      }
      state.pendingArchive = { ...archive, shifts: validation.shifts };
      state.modal = { type: "import" };
      renderModal();
    } catch {
      showToast("O arquivo nao e um backup valido do Escala Clara.");
    }
  }

  function validateArchive(archive) {
    if (!archive || typeof archive !== "object" || !Number.isInteger(archive.schemaVersion)) {
      return { error: "O arquivo nao e um backup valido do Escala Clara." };
    }
    if (archive.schemaVersion > ARCHIVE_VERSION) {
      return { error: "Este backup foi criado por uma versao mais nova do app." };
    }
    if (!validDate(archive.exportedAt) || !Array.isArray(archive.shifts)) {
      return { error: "O arquivo nao e um backup valido do Escala Clara." };
    }

    const shifts = archive.shifts.map(normalizeShift);
    if (shifts.some((shift) => !shift)) {
      return { error: "O arquivo nao e um backup valido do Escala Clara." };
    }
    if (new Set(shifts.map((shift) => shift.id)).size !== shifts.length) {
      return { error: "O backup contem identificadores de plantão duplicados." };
    }
    return { shifts };
  }

  function applyImport(replacing) {
    const archive = state.pendingArchive;
    if (!archive) return;

    if (replacing) {
      state.shifts = sortShifts(archive.shifts);
    } else {
      const savedByID = new Map(state.shifts.map((shift) => [shift.id, shift]));
      for (const imported of archive.shifts) savedByID.set(imported.id, imported);
      state.shifts = sortShifts([...savedByID.values()]);
    }

    persistShifts();
    state.pendingArchive = null;
    state.modal = null;
    render();
    showToast("Backup importado com sucesso.");
  }

  document.addEventListener("click", handleClick);
  document.addEventListener("submit", handleSubmit);
  elements.importInput.addEventListener("change", () => {
    const [file] = elements.importInput.files;
    elements.importInput.value = "";
    importBackup(file);
  });

  applyTheme(state.isDarkMode);

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js").catch(() => undefined);
    });
  }

  render();
})();
