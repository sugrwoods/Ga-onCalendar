(function () {
  const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  function loadProfiles() {
    try {
      const p = JSON.parse(localStorage.getItem("profiles") || "null");
      if (Array.isArray(p) && p.length > 0) return p;
    } catch (e) {}
    return [{ id: "default", name: "Me" }];
  }
  let profiles = loadProfiles();
  function saveProfiles() {
    localStorage.setItem("profiles", JSON.stringify(profiles));
  }
  if (localStorage.getItem("profiles")) saveProfiles();

  let activeProfileId = localStorage.getItem("activeProfileId");
  if (!activeProfileId || !profiles.some((p) => p.id === activeProfileId)) {
    activeProfileId = profiles[0].id;
    localStorage.setItem("activeProfileId", activeProfileId);
  }

  function storageKey(base) {
    return "profile:" + activeProfileId + ":" + base;
  }

  const PROFILE_DATA_KEYS = [
    "palettesAll",
    "customColorDefs",
    "hiddenPresetColors",
    "calendarNotes",
    "scheduleBlocks",
    "todos",
    "paletteIndex",
    "fontScale",
  ];

  // Migra datos sueltos ( de antes de que existieran perfiles) al perfil "default", una sola vez
  if (
    activeProfileId === "default" &&
    !localStorage.getItem("profile:default:migrated")
  ) {
    PROFILE_DATA_KEYS.forEach((k) => {
      const old = localStorage.getItem(k);
      if (old !== null && localStorage.getItem(storageKey(k)) === null) {
        localStorage.setItem(storageKey(k), old);
      }
    });
    localStorage.setItem("profile:default:migrated", "1");
  }

  function renderProfileList() {
    const list = document.getElementById("profileList");
    list.innerHTML = "";
    profiles.forEach((p) => {
      const isActive = p.id === activeProfileId;
      const row = document.createElement("div");
      row.style.cssText =
        "display:flex;align-items:center;gap:8px;padding:8px;border-radius:6px;background:rgba(0,0,0,0.03);";
      row.innerHTML =
        '<span style="flex:1;font-family:Inter,sans-serif;font-size:14px;' +
        (isActive ? "font-weight:600;" : "") +
        '">' +
        escapeHtml(p.name) +
        (isActive ? " (current)" : "") +
        "</span>" +
        (isActive
          ? ""
          : '<button type="button" data-action="use" style="border:1px solid var(--line);background:transparent;color:var(--ink);padding:6px 12px;border-radius:16px;cursor:pointer;font-size:12px;">Use</button>') +
        '<button type="button" data-action="rename" style="border:none;background:none;cursor:pointer;color:var(--ink-soft);padding:6px 8px;">✎</button>' +
        (profiles.length > 1
          ? '<button type="button" data-action="delete" style="border:none;background:none;cursor:pointer;color:#B5533C;padding:6px 8px;">✕</button>'
          : "");

      const useBtn = row.querySelector('[data-action="use"]');
      if (useBtn)
        useBtn.addEventListener("click", () => {
          localStorage.setItem("activeProfileId", p.id);
          location.reload();
        });
      row
        .querySelector('[data-action="rename"]')
        .addEventListener("click", () => {
          const newName = prompt("Rename profile:", p.name);
          if (newName && newName.trim()) {
            p.name = newName.trim();
            saveProfiles();
            renderProfileList();
            if (p.id === activeProfileId)
              document.getElementById("profileToggle").textContent =
                "👤 " + p.name;
          }
        });
      const delBtn = row.querySelector('[data-action="delete"]');
      if (delBtn)
        delBtn.addEventListener("click", () => {
          if (profiles.length <= 1) return;
          if (
            !confirm(
              'Delete profile "' +
                p.name +
                '" and all its data? This cannot be undone.',
            )
          )
            return;
          PROFILE_DATA_KEYS.forEach((k) =>
            localStorage.removeItem("profile:" + p.id + ":" + k),
          );
          profiles = profiles.filter((x) => x.id !== p.id);
          saveProfiles();
          if (p.id === activeProfileId) {
            localStorage.setItem("activeProfileId", profiles[0].id);
            location.reload();
          } else {
            renderProfileList();
          }
        });
      list.appendChild(row);
    });
  }

  document.getElementById("profileToggle").addEventListener("click", () => {
    renderProfileList();
    document.getElementById("profileOverlay").classList.add("open");
  });
  document
    .getElementById("closeProfileOverlayBtn")
    .addEventListener("click", () => {
      document.getElementById("profileOverlay").classList.remove("open");
    });
  document.getElementById("profileOverlay").addEventListener("click", (e) => {
    if (e.target.id === "profileOverlay")
      document.getElementById("profileOverlay").classList.remove("open");
  });
  document.getElementById("addProfileBtn").addEventListener("click", () => {
    const input = document.getElementById("newProfileName");
    const name = input.value.trim();
    if (!name) return;
    const id = "p-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
    profiles.push({ id, name });
    saveProfiles();
    input.value = "";
    renderProfileList();
  });

  const currentProfile = profiles.find((p) => p.id === activeProfileId);
  document.getElementById("profileToggle").textContent =
    "👤 " + (currentProfile ? currentProfile.name : "Me");

  const DEFAULT_PALETTES = [
    {
      name: "Sunset",
      paper: "#FFE3B3",
      paper2: "#FBB931",
      ink: "#EA6113",
      inkSoft: "#F88F22",
      accent: "#EA6113",
      accent2: "#F88F22",
      line: "#FBB931",
    },
    {
      name: "Marple",
      paper: "#FFE3B3",
      paper2: "#FFB173",
      ink: "#CA2851",
      inkSoft: "#FF6766",
      accent: "#CA2851",
      accent2: "#FF6766",
      line: "#FFB173",
    },
    {
      name: "Violet",
      paper: "#F8FAE9",
      paper2: "#F6DBC0",
      ink: "#502D55",
      inkSoft: "#935073",
      accent: "#502D55",
      accent2: "#935073",
      line: "#F6DBC0",
    },
    {
      name: "Night",
      paper: "#FFFFFF",
      paper2: "#B3CDE0",
      ink: "#0C1446",
      inkSoft: "#2B5C92",
      accent: "#0C1446",
      accent2: "#2B5C92",
      line: "#B3CDE0",
    },
  ];

  // ---- Palettes: single persisted list, editable and deletable ----
  let PALETAS = [];
  try {
    const stored = JSON.parse(
      localStorage.getItem(storageKey("palettesAll")) || "null",
    );
    if (Array.isArray(stored) && stored.length > 0) {
      PALETAS = stored;
    } else {
      const oldCustom = JSON.parse(
        localStorage.getItem("customPalettes") || "[]",
      );
      PALETAS = DEFAULT_PALETTES.concat(
        Array.isArray(oldCustom) ? oldCustom : [],
      );
    }
  } catch (e) {
    PALETAS = DEFAULT_PALETTES.slice();
  }

  // ---- Colores personalizados "adaptables": cada paleta define su propio valor para el mismo id ----
  let customColorDefs = [];
  try {
    customColorDefs = JSON.parse(
      localStorage.getItem(storageKey("customColorDefs")) || "null",
    );
    if (!Array.isArray(customColorDefs)) customColorDefs = null;
  } catch (e) {
    customColorDefs = null;
  }

  if (customColorDefs === null) {
    // Migración desde el formato viejo (lista plana de hex)
    let oldHexList = [];
    try {
      oldHexList = JSON.parse(
        localStorage.getItem("customEventColors") || "[]",
      );
      if (!Array.isArray(oldHexList)) oldHexList = [];
    } catch (e) {
      oldHexList = [];
    }
    customColorDefs = oldHexList.map((hex, i) => {
      const id = "cc-" + Date.now() + "-" + i;
      PALETAS.forEach((p) => {
        if (!p.customColors) p.customColors = {};
        p.customColors[id] = hex;
      });
      return { id };
    });
  }

  function saveCustomColorDefs() {
    localStorage.setItem(
      storageKey("customColorDefs"),
      JSON.stringify(customColorDefs),
    );
  }

  function getCustomColorHex(id) {
    const active = PALETAS[state.paletteIndex];
    if (active && active.customColors && active.customColors[id])
      return active.customColors[id];
    // si esta paleta todavía no tiene un valor propio para este color, usa el de la primera paleta que sí lo tenga
    const fallback = PALETAS.find((p) => p.customColors && p.customColors[id]);
    return (fallback && fallback.customColors[id]) || "#888888";
  }

  // ---- Colores por defecto ocultados por el usuario ----
  let hiddenPresetColors = [];
  try {
    hiddenPresetColors = JSON.parse(
      localStorage.getItem(storageKey("hiddenPresetColors")) || "[]",
    );
    if (!Array.isArray(hiddenPresetColors)) hiddenPresetColors = [];
  } catch (e) {
    hiddenPresetColors = [];
  }
  function saveHiddenPresets() {
    localStorage.setItem(
      storageKey("hiddenPresetColors"),
      JSON.stringify(hiddenPresetColors),
    );
  }

  function wrapDotWithDelete(dot, onDelete, title) {
    const wrap = document.createElement("span");
    wrap.className = "color-dot-wrap";
    dot.parentNode.insertBefore(wrap, dot);
    wrap.appendChild(dot);
    const del = document.createElement("button");
    del.type = "button";
    del.className = "color-dot-del";
    del.title = title || "Remove this color";
    del.textContent = "×";
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      onDelete();
    });
    wrap.appendChild(del);
    return wrap;
  }

  function initPresetDeleteButtons() {
    ["colorRow", "scheduleColorRow"].forEach((rowId) => {
      document
        .querySelectorAll("#" + rowId + " > .color-dot[data-color]")
        .forEach((dot) => {
          const token = dot.dataset.color;
          if (hiddenPresetColors.includes(token)) {
            dot.style.display = "none";
            return;
          }
          wrapDotWithDelete(
            dot,
            () => {
              hiddenPresetColors.push(token);
              saveHiddenPresets();
              document
                .querySelectorAll('.color-dot[data-color="' + token + '"]')
                .forEach((d) => {
                  const w = d.closest(".color-dot-wrap");
                  if (w) w.style.display = "none";
                });
            },
            "Remove " + token,
          );
        });
    });
  }

  function renderCustomColorDots(rowId, onPick) {
    const row = document.getElementById(rowId);
    row
      .querySelectorAll(".custom-color-wrap, .add-color-btn")
      .forEach((el) => el.remove());
    customColorDefs.forEach((def, idx) => {
      const hex = getCustomColorHex(def.id);
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "color-dot custom-color-dot";
      dot.dataset.color = def.id;
      dot.style.background = hex;
      dot.addEventListener("click", () => onPick(def.id));

      const wrap = document.createElement("span");
      wrap.className = "color-dot-wrap custom-color-wrap";
      wrap.appendChild(dot);
      const del = document.createElement("button");
      del.type = "button";
      del.className = "color-dot-del";
      del.title = "Delete this color";
      del.textContent = "×";
      del.addEventListener("click", (e) => {
        e.stopPropagation();
        customColorDefs.splice(idx, 1);
        PALETAS.forEach((p) => {
          if (p.customColors) delete p.customColors[def.id];
        });
        saveCustomColorDefs();
        savePalettes();
        renderCustomColorDots(rowId, onPick);
      });
      wrap.appendChild(del);
      row.appendChild(wrap);
    });
    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "color-dot add-color-btn";
    addBtn.style.cssText =
      "border:1.5px dashed var(--line);background:transparent;color:var(--ink-soft);font-size:14px;";
    addBtn.textContent = "+";
    addBtn.addEventListener("click", () => {
      const picker = document.createElement("input");
      picker.type = "color";
      picker.style.cssText = "position:fixed;left:-999px;";
      document.body.appendChild(picker);
      picker.addEventListener("input", () => {
        const id =
          "cc-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
        PALETAS.forEach((p) => {
          if (!p.customColors) p.customColors = {};
          p.customColors[id] = picker.value; // valor inicial igual en todas las paletas; edítalo por paleta luego
        });
        customColorDefs.push({ id });
        saveCustomColorDefs();
        savePalettes();
        onPick(id);
        renderCustomColorDots(rowId, onPick);
        document.body.removeChild(picker);
      });
      picker.click();
    });
    row.appendChild(addBtn);
  }

  function savePalettes() {
    localStorage.setItem(storageKey("palettesAll"), JSON.stringify(PALETAS));
  }

  const today = new Date();

  // ---- Notes: robust migration from any old format ----
  let savedNotes = {};
  try {
    const raw = JSON.parse(
      localStorage.getItem(storageKey("calendarNotes")) || "{}",
    );
    Object.keys(raw).forEach((k) => {
      const val = raw[k];
      if (Array.isArray(val)) {
        savedNotes[k] = val;
      } else if (typeof val === "string") {
        savedNotes[k] = [
          {
            id: k + "-legacy",
            texto: val,
            hora: "",
            color: "accent2",
            repeat: "none",
            important: false,
          },
        ];
      } else if (val && typeof val === "object") {
        savedNotes[k] = [
          {
            id: k + "-legacy",
            texto: val.texto || "",
            hora: "",
            color: val.color || "accent2",
            repeat: "none",
            important: false,
          },
        ];
      }
    });
  } catch (e) {
    savedNotes = {};
  }

  // ---- Schedule blocks (clases / trabajo) ----
  let scheduleBlocks = [];
  try {
    scheduleBlocks = JSON.parse(
      localStorage.getItem(storageKey("scheduleBlocks")) || "[]",
    );
    if (!Array.isArray(scheduleBlocks)) scheduleBlocks = [];
  } catch (e) {
    scheduleBlocks = [];
  }
  function saveSchedule() {
    localStorage.setItem(
      storageKey("scheduleBlocks"),
      JSON.stringify(scheduleBlocks),
    );
  }

  let todos = [];
  try {
    todos = JSON.parse(localStorage.getItem(storageKey("todos")) || "[]");
    if (!Array.isArray(todos)) todos = [];
  } catch (e) {
    todos = [];
  }

  function saveTodos() {
    localStorage.setItem(storageKey("todos"), JSON.stringify(todos));
  }

  // Arrastra al día de hoy cualquier tarea pendiente cuya fecha ya pasó
  function carryOverTodos() {
    const todayMid = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const todayKey = key(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    let changed = false;
    todos.forEach((t) => {
      if (t.done) return;
      const p = t.date.split("-").map(Number);
      const d = new Date(p[0], p[1], p[2]);
      if (d < todayMid) {
        t.date = todayKey;
        changed = true;
      }
    });
    if (changed) saveTodos();
  }

  function renderTodos() {
    const list = document.getElementById("todoList");
    list.innerHTML = "";

    // Barra de progreso
    const progressWrap = document.getElementById("todoProgressWrap");
    if (todos.length === 0) {
      progressWrap.style.display = "none";
    } else {
      const doneCount = todos.filter((t) => t.done).length;
      progressWrap.style.display = "flex";
      document.getElementById("todoProgressLabel").textContent =
        doneCount + " of " + todos.length;
      document.getElementById("todoProgressFill").style.width =
        Math.round((doneCount / todos.length) * 100) + "%";
    }

    if (todos.length === 0) {
      list.innerHTML =
        '<div class="todo-empty"><span class="big">✓</span>Nothing pending — nice!</div>';
      return;
    }

    const todayKey = key(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const sorted = todos
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date) || a.done - b.done);
    const groups = {};
    sorted.forEach((t) => {
      (groups[t.date] = groups[t.date] || []).push(t);
    });
    Object.keys(groups)
      .sort()
      .forEach((dateKey) => {
        const p = dateKey.split("-").map(Number);
        const isToday = dateKey === todayKey;
        const label = document.createElement("div");
        label.className = "todo-group-label" + (isToday ? " is-today" : "");
        label.textContent =
          MONTHS[p[1]] + " " + p[2] + (isToday ? " · Today" : "");
        list.appendChild(label);
        groups[dateKey].forEach((t) => {
          const row = document.createElement("div");
          row.className = "todo-row" + (t.done ? " done" : "");
          row.innerHTML =
            '<button type="button" class="todo-checkbox' +
            (t.done ? " checked" : "") +
            '">' +
            '<svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
            "</button>" +
            '<span class="todo-text">' +
            escapeHtml(t.text) +
            "</span>" +
            '<button class="todo-del" type="button" title="Delete">✕</button>';
          row.querySelector(".todo-checkbox").addEventListener("click", () => {
            t.done = !t.done;
            saveTodos();
            renderTodos();
          });
          row.querySelector(".todo-del").addEventListener("click", () => {
            todos = todos.filter((x) => x.id !== t.id);
            saveTodos();
            renderTodos();
          });
          list.appendChild(row);
        });
      });
  }

  document.getElementById("addTodoBtn").addEventListener("click", () => {
    const input = document.getElementById("todoInput");
    const text = input.value.trim();
    if (!text) return;
    todos.push({
      id: Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      text,
      date: key(today.getFullYear(), today.getMonth(), today.getDate()),
      done: false,
    });
    saveTodos();
    input.value = "";
    renderTodos();
  });
  let savedPaletteIndex = parseInt(
    localStorage.getItem(storageKey("paletteIndex")),
    10,
  );
  if (isNaN(savedPaletteIndex)) savedPaletteIndex = 0;

  let state = {
    year: today.getFullYear(),
    month: today.getMonth(),
    paletteIndex: savedPaletteIndex,
    notes: savedNotes, // "YYYY-M-D": [ {id, texto, hora, color, repeat, important}, ... ]
    viewMode: "month", // 'month' | 'week'
    appView: "calendar", // 'calendar' | 'schedule' | 'todo'
    cursorDate: new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    ),
  };

  function syncStateFromCursor() {
    state.year = state.cursorDate.getFullYear();
    state.month = state.cursorDate.getMonth();
  }

  function getMonday(d) {
    const dt = new Date(d);
    const dow = mondayIndex(dt.getDay());
    dt.setDate(dt.getDate() - dow);
    dt.setHours(0, 0, 0, 0);
    return dt;
  }

  function key(y, m, d) {
    return y + "-" + m + "-" + d;
  }

  function getEventsForDate(y, m, d) {
    const dateKey = key(y, m, d);
    const own = Array.isArray(state.notes[dateKey]) ? state.notes[dateKey] : [];
    const target = new Date(y, m, d);
    const extra = [];
    Object.keys(state.notes).forEach((k) => {
      if (k === dateKey) return;
      const parts = k.split("-").map(Number);
      const oy = parts[0],
        om = parts[1],
        od = parts[2];
      const originDate = new Date(oy, om, od);
      if (originDate >= target) return;
      const list = Array.isArray(state.notes[k]) ? state.notes[k] : [];
      list.forEach((ev) => {
        if (ev.repeat === "weekly" && originDate.getDay() === target.getDay()) {
          extra.push(Object.assign({}, ev, { recurring: true }));
        } else if (ev.repeat === "monthly" && od === d) {
          extra.push(Object.assign({}, ev, { recurring: true }));
        }
      });
    });
    return own
      .concat(extra)
      .sort((a, b) => (a.hora || "99:99").localeCompare(b.hora || "99:99"));
  }

  function saveNotes() {
    localStorage.setItem(
      storageKey("calendarNotes"),
      JSON.stringify(state.notes),
    );
  }

  function escapeHtml(s) {
    return String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  }

  function colorToVar(c) {
    const map = {
      accent2: "var(--accent-2)",
      accent: "var(--accent)",
      ok: "#5C8A5C",
      warn: "#B5533C",
      info: "#4B6FA8",
    };
    if (map[c]) return map[c];
    if (typeof c === "string" && c.startsWith("cc-"))
      return getCustomColorHex(c);
    if (typeof c === "string" && c.startsWith("#")) return c;
    return "var(--accent-2)";
  }

  // ---------------- Notifications ----------------
  let notificationsEnabled = false;
  const notifiedToday = new Set();

  function updateNotifBtn() {
    const btn = document.getElementById("notifToggle");
    btn.textContent = notificationsEnabled ? "🔔 On" : "🔕 Reminders";
    btn.classList.toggle("active", notificationsEnabled);
  }

  function toggleNotifications() {
    if (!("Notification" in window)) {
      alert("Your browser does not support notifications.");
      return;
    }
    if (Notification.permission === "granted") {
      notificationsEnabled = !notificationsEnabled;
      updateNotifBtn();
    } else {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") {
          notificationsEnabled = true;
          updateNotifBtn();
        }
      });
    }
  }

  function checkReminders() {
    if (!notificationsEnabled) return;
    const now = new Date();
    const nowStr =
      String(now.getHours()).padStart(2, "0") +
      ":" +
      String(now.getMinutes()).padStart(2, "0");
    const events = getEventsForDate(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    events.forEach((ev) => {
      if (ev.hora === nowStr) {
        const notifKey = ev.id + "-" + now.toDateString();
        if (!notifiedToday.has(notifKey)) {
          notifiedToday.add(notifKey);
          new Notification("Reminder", {
            body: ev.texto + (ev.hora ? " · " + ev.hora : ""),
          });
        }
      }
    });
  }

  // ---------------- Palettes ----------------
  function applyPalette(p) {
    const r = document.documentElement.style;
    r.setProperty("--paper", p.paper);
    r.setProperty("--paper-2", p.paper2);
    r.setProperty("--ink", p.ink);
    r.setProperty("--ink-soft", p.inkSoft);
    r.setProperty("--accent", p.accent);
    r.setProperty("--accent-2", p.accent2);
    r.setProperty("--line", p.line);
  }

  function renderPalettes() {
    const wrap = document.getElementById("palettes");
    wrap.innerHTML = "";
    PALETAS.forEach((p, i) => {
      const holder = document.createElement("div");
      holder.className = "swatch-wrap";

      const b = document.createElement("button");
      b.className = "swatch" + (i === state.paletteIndex ? " active" : "");
      b.title = p.name;
      b.innerHTML = '<span style="background:' + p.accent + '"></span>';
      b.addEventListener("click", () => {
        state.paletteIndex = i;
        localStorage.setItem("paletteIndex", i);
        applyPalette(p);
        renderPalettes();
      });

      const editBtn = document.createElement("button");
      editBtn.className = "swatch-edit";
      editBtn.title = "Edit " + p.name;
      editBtn.textContent = "✎";
      editBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        openPaletteEditor(i);
      });

      holder.appendChild(b);
      holder.appendChild(editBtn);
      wrap.appendChild(holder);
    });

    const addBtn = document.createElement("button");
    addBtn.className = "swatch add-swatch";
    addBtn.title = "Add palette";
    addBtn.textContent = "+";
    addBtn.addEventListener("click", () => openPaletteEditor(null));
    wrap.appendChild(addBtn);
  }

  let editingPaletteIndex = null;

  function openPaletteEditor(index) {
    editingPaletteIndex = index;
    const overlay = document.getElementById("paletteOverlay");
    const title = document.getElementById("paletteEditorTitle");
    const deleteBtn = document.getElementById("deletePalette");
    const customSection = document.getElementById("paletteCustomColorsSection");

    if (index === null) {
      title.textContent = "New palette";
      document.getElementById("colorC1").value = "#EFEAD9";
      document.getElementById("colorC2").value = "#E6DFC9";
      document.getElementById("colorC3").value = "#A9862F";
      document.getElementById("colorC4").value = "#1F2A24";
      deleteBtn.style.display = "none";
      customSection.innerHTML = "";
    } else {
      const p = PALETAS[index];
      title.textContent = 'Edit "' + p.name + '"';
      document.getElementById("colorC1").value = p.paper;
      document.getElementById("colorC2").value = p.paper2;
      document.getElementById("colorC3").value = p.accent2;
      document.getElementById("colorC4").value = p.ink;
      deleteBtn.style.display = PALETAS.length > 1 ? "inline-block" : "none";

      customSection.innerHTML = "";
      if (customColorDefs.length > 0) {
        const heading = document.createElement("div");
        heading.className = "sub";
        heading.style.marginTop = "14px";
        heading.textContent = "Custom colors for this palette";
        customSection.appendChild(heading);

        customColorDefs.forEach((def) => {
          if (!p.customColors) p.customColors = {};
          const row = document.createElement("label");
          row.style.cssText =
            "display:flex;align-items:center;justify-content:space-between;font-family:Inter,sans-serif;font-size:13px;color:var(--ink-soft);margin-top:8px;";
          row.innerHTML = "<span>" + def.id.slice(0, 10) + "…</span>";
          const input = document.createElement("input");
          input.type = "color";
          input.style.cssText =
            "width:40px;height:28px;border:1.5px solid var(--line);border-radius:4px;padding:0;background:none;cursor:pointer;";
          input.value = p.customColors[def.id] || "#888888";
          input.addEventListener("input", () => {
            p.customColors[def.id] = input.value;
          });
          row.appendChild(input);
          customSection.appendChild(row);
        });
      }
    }
    overlay.classList.add("open");
  }

  function closePaletteEditor() {
    document.getElementById("paletteOverlay").classList.remove("open");
    editingPaletteIndex = null;
  }

  document
    .getElementById("cancelPalette")
    .addEventListener("click", closePaletteEditor);
  document.getElementById("paletteOverlay").addEventListener("click", (e) => {
    if (e.target.id === "paletteOverlay") closePaletteEditor();
  });

  document.getElementById("savePalette").addEventListener("click", () => {
    const c1 = document.getElementById("colorC1").value;
    const c2 = document.getElementById("colorC2").value;
    const c3 = document.getElementById("colorC3").value;
    const c4 = document.getElementById("colorC4").value;

    const existingCustomColors =
      editingPaletteIndex !== null
        ? PALETAS[editingPaletteIndex].customColors || {}
        : {};

    const paletteData = {
      name:
        editingPaletteIndex !== null
          ? PALETAS[editingPaletteIndex].name
          : "Custom " + (PALETAS.length + 1),
      paper: c1,
      paper2: c2,
      ink: c4,
      inkSoft: c3,
      accent: c4,
      accent2: c3,
      line: c2,
      customColors: existingCustomColors,
    };

    if (editingPaletteIndex !== null) {
      PALETAS[editingPaletteIndex] = paletteData;
      if (state.paletteIndex === editingPaletteIndex) applyPalette(paletteData);
    } else {
      PALETAS.push(paletteData);
      state.paletteIndex = PALETAS.length - 1;
      applyPalette(paletteData);
    }

    localStorage.setItem(storageKey("paletteIndex"), state.paletteIndex);
    savePalettes();
    renderPalettes();
    closePaletteEditor();
  });

  document.getElementById("deletePalette").addEventListener("click", () => {
    if (editingPaletteIndex === null || PALETAS.length <= 1) return;
    PALETAS.splice(editingPaletteIndex, 1);
    if (state.paletteIndex >= PALETAS.length)
      state.paletteIndex = PALETAS.length - 1;
    applyPalette(PALETAS[state.paletteIndex]);
    localStorage.setItem(storageKey("paletteIndex"), state.paletteIndex);
    savePalettes();
    renderPalettes();
    closePaletteEditor();
  });

  // ---------------- View / grid ----------------
  function renderWeekdays() {
    const row = document.getElementById("weekdaysRow");
    row.innerHTML = DAYS.map((d) => "<span>" + d + "</span>").join("");
  }

  function daysInMonth(y, m) {
    return new Date(y, m + 1, 0).getDate();
  }
  function mondayIndex(jsDay) {
    return (jsDay + 6) % 7;
  }

  function buildDayCell(dt, c, isOtherMonth) {
    const y = dt.getFullYear(),
      m = dt.getMonth(),
      d = dt.getDate();
    const isWeekend = c === 5 || c === 6;
    const isToday =
      d === today.getDate() &&
      m === today.getMonth() &&
      y === today.getFullYear();
    const events = getEventsForDate(y, m, d);
    const hasNote = events.length > 0;

    const dotsHtml = events
      .slice(0, 4)
      .map(
        (ev) =>
          '<span class="dot" style="background:' +
          colorToVar(ev.color) +
          '"></span>',
      )
      .join("");

    const previewHtml =
      events
        .slice(0, 2)
        .map((ev) => {
          const horaTxt = ev.hora
            ? '<span class="ev-time">' + escapeHtml(ev.hora) + "</span>"
            : "";
          return (
            '<div class="note-preview" style="color:' +
            colorToVar(ev.color) +
            '">' +
            horaTxt +
            escapeHtml(ev.texto) +
            (ev.recurring ? " 🔁" : "") +
            (ev.important ? " ⭐" : "") +
            "</div>"
          );
        })
        .join("") +
      (events.length > 2
        ? '<div class="note-preview more-count">+' +
          (events.length - 2) +
          " more</div>"
        : "");

    const dayEl = document.createElement("div");
    const matchesFilter =
      !activeCategoryFilter ||
      events.some((ev) => ev.category === activeCategoryFilter);
    dayEl.className =
      "day" +
      (isWeekend ? " weekend" : "") +
      (isToday ? " today" : "") +
      (hasNote ? " has-note" : "") +
      (isOtherMonth ? " other-month" : "") +
      (activeCategoryFilter && !matchesFilter ? " filtered-out" : "");
    dayEl.innerHTML =
      '<div class="num-row"><span class="num">' +
      d +
      '</span><span class="dots-row">' +
      dotsHtml +
      "</span></div>" +
      previewHtml;

    dayEl.addEventListener("click", () => openEditor(y, m, d));

    // Arrastre: los eventos visibles (no recurrentes) se pueden arrastrar a otro día
    const previewEls = dayEl.querySelectorAll(".note-preview:not(.more-count)");
    events.slice(0, 2).forEach((ev, i) => {
      if (ev.recurring || !previewEls[i]) return; // los recurrentes no se mueven
      const el = previewEls[i];
      el.draggable = true;
      el.addEventListener("dragstart", (e) => {
        e.stopPropagation();
        e.dataTransfer.setData(
          "text/plain",
          JSON.stringify({ fromKey: key(y, m, d), eventId: ev.id }),
        );
      });
    });

    dayEl.addEventListener("dragover", (e) => {
      e.preventDefault();
      dayEl.classList.add("drag-over");
    });
    dayEl.addEventListener("dragleave", () =>
      dayEl.classList.remove("drag-over"),
    );
    dayEl.addEventListener("drop", (e) => {
      e.preventDefault();
      dayEl.classList.remove("drag-over");
      let data;
      try {
        data = JSON.parse(e.dataTransfer.getData("text/plain"));
      } catch (err) {
        return;
      }
      if (!data || !data.fromKey) return;
      const toKey = key(y, m, d);
      if (data.fromKey === toKey) return;
      const list = state.notes[data.fromKey];
      if (!list) return;
      const idx = list.findIndex((ev2) => ev2.id === data.eventId);
      if (idx === -1) return;
      const moved = list.splice(idx, 1)[0];
      if (list.length === 0) delete state.notes[data.fromKey];
      if (!state.notes[toKey]) state.notes[toKey] = [];
      state.notes[toKey].push(moved);
      state.notes[toKey].sort((a, b) =>
        (a.hora || "99:99").localeCompare(b.hora || "99:99"),
      );
      saveNotes();
      render();
    });
    return dayEl;
  }

  function render() {
    const grid = document.getElementById("grid");
    grid.innerHTML = "";

    if (state.viewMode === "week") {
      const monday = getMonday(state.cursorDate);
      const weekDates = [];
      for (let i = 0; i < 7; i++) {
        const dt = new Date(monday);
        dt.setDate(monday.getDate() + i);
        weekDates.push(dt);
      }
      const first = weekDates[0],
        last = weekDates[6];

      document.getElementById("monthName").textContent =
        MONTHS[first.getMonth()];
      document.getElementById("yearLabel").textContent = first.getFullYear();
      document.getElementById("ghostNum").textContent = String(
        first.getMonth() + 1,
      ).padStart(2, "0");
      document.getElementById("dayCount").textContent =
        first.getDate() +
        " – " +
        last.getDate() +
        " " +
        MONTHS[last.getMonth()];

      const weekEl = document.createElement("div");
      weekEl.className = "week";
      weekDates.forEach((dt, c) => {
        weekEl.appendChild(
          buildDayCell(dt, c, dt.getMonth() !== first.getMonth()),
        );
      });
      grid.appendChild(weekEl);
      renderCountdown();
      renderCalendarCategoryTotals();
      return;
    }

    document.getElementById("monthName").textContent = MONTHS[state.month];
    document.getElementById("yearLabel").textContent = state.year;
    document.getElementById("ghostNum").textContent = String(
      state.month + 1,
    ).padStart(2, "0");
    document.getElementById("dayCount").textContent =
      "month " + (state.month + 1) + " of 12";

    const total = daysInMonth(state.year, state.month);
    const firstDow = mondayIndex(new Date(state.year, state.month, 1).getDay());

    let cells = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= total; d++)
      cells.push(new Date(state.year, state.month, d));
    while (cells.length % 7 !== 0) cells.push(null);

    for (let w = 0; w < cells.length / 7; w++) {
      const weekEl = document.createElement("div");
      weekEl.className = "week";
      for (let c = 0; c < 7; c++) {
        const dt = cells[w * 7 + c];
        if (dt === null) {
          const emptyEl = document.createElement("div");
          emptyEl.className = "day empty";
          weekEl.appendChild(emptyEl);
          continue;
        }
        weekEl.appendChild(buildDayCell(dt, c, false));
      }
      grid.appendChild(weekEl);
    }

    renderCountdown();
    renderCalendarCategoryTotals();
  }

  // ---------------- Countdown ----------------
  function nextWeekday(fromDate, weekday) {
    const d = new Date(fromDate);
    while (d.getDay() !== weekday) d.setDate(d.getDate() + 1);
    return d;
  }
  function nextMonthly(fromDate, dayOfMonth) {
    let d = new Date(fromDate.getFullYear(), fromDate.getMonth(), dayOfMonth);
    if (d < fromDate) d.setMonth(d.getMonth() + 1);
    return d;
  }

  function findNextImportant() {
    const todayMid = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    let best = null;
    Object.keys(state.notes).forEach((k) => {
      const parts = k.split("-").map(Number);
      const y = parts[0],
        m = parts[1],
        d = parts[2];
      const list = Array.isArray(state.notes[k]) ? state.notes[k] : [];
      list.forEach((ev) => {
        if (!ev.important) return;
        let occurDate = new Date(y, m, d);
        if (ev.repeat === "weekly")
          occurDate = nextWeekday(todayMid, occurDate.getDay());
        else if (ev.repeat === "monthly") occurDate = nextMonthly(todayMid, d);
        if (occurDate < todayMid) return;
        if (!best || occurDate < best.date)
          best = { date: occurDate, texto: ev.texto };
      });
    });
    return best;
  }

  function renderCountdown() {
    const el = document.getElementById("countdownBadge");
    const next = findNextImportant();
    if (!next) {
      el.style.display = "none";
      return;
    }
    const todayMid = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const diffDays = Math.round((next.date - todayMid) / 86400000);
    el.style.display = "flex";
    el.textContent =
      diffDays === 0
        ? "Today! · " + next.texto
        : diffDays + " days left · " + next.texto;
  }

  // ---------------- Category totals + filter (calendar) ----------------
  let activeCategoryFilter = null;

  function estimateDurationMinutes(ev) {
    return 30; // sin hora de fin en eventos del día, contamos cada uno como 30 min de referencia
  }

  function renderCalendarCategoryTotals() {
    const wrap = document.getElementById("calendarCategoryTotals");
    if (!wrap) return;
    const totals = {};
    const sampleColor = {};
    Object.keys(state.notes).forEach((k) => {
      const parts = k.split("-").map(Number);
      if (
        state.viewMode === "month"
          ? parts[1] !== state.month || parts[0] !== state.year
          : false
      ) {
        // en modo mes, solo contamos eventos de ese mes; en modo semana, contamos todo lo visible es más simple mostrar el mes igual
      }
      const list = Array.isArray(state.notes[k]) ? state.notes[k] : [];
      list.forEach((ev) => {
        if (parts[1] !== state.month || parts[0] !== state.year) return;
        const cat =
          ev.category && ev.category !== "Uncategorized" ? ev.category : null;
        if (!cat) return;
        totals[cat] = (totals[cat] || 0) + 1;
        if (!sampleColor[cat]) sampleColor[cat] = ev.color;
      });
    });

    const cats = Object.keys(totals);
    if (cats.length === 0) {
      wrap.innerHTML = "";
      return;
    }

    wrap.innerHTML = cats
      .map((cat) => {
        const isActive = activeCategoryFilter === cat;
        return (
          '<button type="button" class="category-pill category-filter-pill' +
          (isActive ? " active" : "") +
          '" style="background:' +
          colorToVar(sampleColor[cat]) +
          ";" +
          (isActive ? "outline:2px solid var(--ink);outline-offset:1px;" : "") +
          '" data-cat="' +
          escapeHtml(cat) +
          '">' +
          escapeHtml(cat) +
          ": " +
          totals[cat] +
          "</button>"
        );
      })
      .join("");

    wrap.querySelectorAll(".category-filter-pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        const cat = btn.dataset.cat;
        activeCategoryFilter = activeCategoryFilter === cat ? null : cat;
        render();
        renderCalendarCategoryTotals();
      });
    });
  }

  // ---------------- Event editor ----------------
  let activeDay = null,
    activeMonth = null,
    activeYear = null;
  let activeColor = "accent2";
  let editingEventId = null;

  function openEditor(y, m, d) {
    activeYear = y;
    activeMonth = m;
    activeDay = d;
    document.getElementById("editorTitle").textContent = MONTHS[m] + " " + d;
    resetForm();
    renderEventList(y, m, d);
    document.getElementById("overlay").classList.add("open");
  }

  function closeEditor() {
    document.getElementById("overlay").classList.remove("open");
    activeDay = null;
    activeMonth = null;
    activeYear = null;
  }

  function resetForm() {
    editingEventId = null;
    document.getElementById("eventHora").value = "";
    document.getElementById("noteInput").value = "";
    document.getElementById("scheduleCategory").value = "";
    activeColor = "accent2";
    renderColorRow(activeColor);
    document.getElementById("eventRepeat").value = "none";
    document.getElementById("eventImportant").checked = false;
    document.getElementById("saveNote").textContent = "Add event";
    renderCustomColorDots("colorRow", (hex) => {
      activeColor = hex;
      renderColorRow(activeColor);
    });
  }

  function renderColorRow(selected) {
    const dots = document.querySelectorAll("#colorRow .color-dot");
    dots.forEach((dot) => {
      dot.classList.toggle("active", dot.dataset.color === selected);
      dot.onclick = () => {
        activeColor = dot.dataset.color;
        renderColorRow(activeColor);
      };
    });
  }

  function renderEventList(y, m, d) {
    const list = document.getElementById("eventList");
    const dateKey = key(y, m, d);
    const events = (state.notes[dateKey] || [])
      .slice()
      .sort((a, b) => (a.hora || "99:99").localeCompare(b.hora || "99:99"));
    list.innerHTML = "";
    if (events.length === 0) {
      list.innerHTML =
        '<div class="event-empty">No events yet for this day.</div>';
      return;
    }
    events.forEach((ev) => {
      const row = document.createElement("div");
      row.className = "event-row";
      row.innerHTML =
        '<span class="event-dot" style="background:' +
        colorToVar(ev.color) +
        '"></span>' +
        '<span class="event-time">' +
        (ev.hora || "--:--") +
        "</span>" +
        '<span class="event-text">' +
        escapeHtml(ev.texto) +
        (ev.category && ev.category !== "Uncategorized"
          ? " <small>[" + escapeHtml(ev.category) + "]</small>"
          : "") +
        (ev.repeat !== "none"
          ? " <small>(" +
            (ev.repeat === "weekly" ? "weekly" : "monthly") +
            ")</small>"
          : "") +
        (ev.important ? " ⭐" : "") +
        "</span>" +
        '<button class="event-edit" type="button" title="Edit">✎</button>' +
        '<button class="event-del" type="button" title="Delete">✕</button>';
      row
        .querySelector(".event-edit")
        .addEventListener("click", () => loadEventIntoForm(dateKey, ev.id));
      row.querySelector(".event-del").addEventListener("click", () => {
        state.notes[dateKey] = state.notes[dateKey].filter(
          (e) => e.id !== ev.id,
        );
        if (state.notes[dateKey].length === 0) delete state.notes[dateKey];
        saveNotes();
        renderEventList(y, m, d);
        render();
      });
      list.appendChild(row);
    });
  }

  function loadEventIntoForm(dateKey, id) {
    const ev = (state.notes[dateKey] || []).find((e) => e.id === id);
    if (!ev) return;
    editingEventId = id;
    document.getElementById("eventHora").value = ev.hora || "";
    document.getElementById("noteInput").value = ev.texto || "";
    document.getElementById("scheduleCategory").value =
      ev.category && ev.category !== "Uncategorized" ? ev.category : "";
    activeColor = ev.color || "accent2";
    renderColorRow(activeColor);
    document.getElementById("eventRepeat").value = ev.repeat || "none";
    document.getElementById("eventImportant").checked = !!ev.important;
    document.getElementById("saveNote").textContent = "Update event";
    renderCustomColorDots("colorRow", (hex) => {
      activeColor = hex;
      renderColorRow(activeColor);
    });
  }

  document.getElementById("saveNote").addEventListener("click", () => {
    const texto = document.getElementById("noteInput").value.trim();
    if (!texto) return;
    const hora = document.getElementById("eventHora").value;
    const repeat = document.getElementById("eventRepeat").value;
    const important = document.getElementById("eventImportant").checked;
    const category =
      document.getElementById("scheduleCategory").value.trim() ||
      "Uncategorized";
    const dateKey = key(activeYear, activeMonth, activeDay);
    if (!state.notes[dateKey]) state.notes[dateKey] = [];

    if (editingEventId) {
      const idx = state.notes[dateKey].findIndex(
        (e) => e.id === editingEventId,
      );
      if (idx > -1) {
        state.notes[dateKey][idx] = Object.assign(
          {},
          state.notes[dateKey][idx],
          { texto, hora, color: activeColor, repeat, important, category },
        );
      }
    } else {
      state.notes[dateKey].push({
        id: Date.now() + "-" + Math.random().toString(36).slice(2, 7),
        texto,
        hora,
        color: activeColor,
        repeat,
        important,
        category,
      });
    }
    state.notes[dateKey].sort((a, b) =>
      (a.hora || "99:99").localeCompare(b.hora || "99:99"),
    );
    saveNotes();
    resetForm();
    renderEventList(activeYear, activeMonth, activeDay);
    render();
  });

  document.getElementById("closeEditorBtn").addEventListener("click", () => {
    closeEditor();
    render();
  });

  document.getElementById("overlay").addEventListener("click", (e) => {
    if (e.target.id === "overlay") {
      closeEditor();
      render();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeEditor();
      render();
      closePaletteEditor();
      closeScheduleEditor();
    }
  });

  // ---------------- Schedule (Horario) view ----------------
  const SCHEDULE_START = 7; // 7:00 AM
  const SCHEDULE_END = 22; // 10:00 PM
  const HOUR_PX = 56;

  function timeToMinutes(t) {
    const parts = (t || "00:00").split(":").map(Number);
    return parts[0] * 60 + parts[1];
  }

  function renderScheduleHeader() {
    const header = document.getElementById("scheduleDaysHeader");
    header.innerHTML =
      "<span></span>" + DAYS.map((d) => "<span>" + d + "</span>").join("");
  }

  function renderScheduleHours() {
    const hoursEl = document.getElementById("scheduleHours");
    hoursEl.innerHTML = "";
    for (let h = SCHEDULE_START; h < SCHEDULE_END; h++) {
      const lbl = document.createElement("div");
      lbl.className = "hour-label";
      lbl.textContent = String(h).padStart(2, "0") + ":00";
      hoursEl.appendChild(lbl);
    }
  }

  function renderScheduleColumns() {
    const cols = document.getElementById("scheduleColumns");
    cols.innerHTML = "";
    cols.style.height = (SCHEDULE_END - SCHEDULE_START) * HOUR_PX + "px";
    for (let day = 0; day < 7; day++) {
      const col = document.createElement("div");
      col.className = "schedule-col";
      col.dataset.day = day;
      col.style.height = "100%";
      col.addEventListener("click", () => openScheduleEditor(null, day));

      scheduleBlocks
        .filter((b) => b.day === day)
        .forEach((b) => {
          const startMin = timeToMinutes(b.start);
          const endMin = timeToMinutes(b.end);
          const top = ((startMin - SCHEDULE_START * 60) / 60) * HOUR_PX;
          const height = Math.max(((endMin - startMin) / 60) * HOUR_PX, 24);
          const block = document.createElement("div");
          block.className = "class-block";
          block.style.top = top + "px";
          block.style.height = height + "px";
          block.style.background = colorToVar(b.color);
          block.innerHTML =
            '<span class="cb-time">' +
            escapeHtml(b.start) +
            "–" +
            escapeHtml(b.end) +
            "</span>" +
            '<span class="cb-title">' +
            escapeHtml(b.title) +
            "</span>" +
            (b.subtitle
              ? '<span class="cb-sub">' + escapeHtml(b.subtitle) + "</span>"
              : "");
          block.addEventListener("click", (e) => {
            e.stopPropagation();
            openScheduleEditor(b.id, day);
          });
          col.appendChild(block);
        });
      cols.appendChild(col);
    }
  }

  function renderSchedule() {
    renderScheduleHeader();
    renderScheduleHours();
    renderScheduleColumns();
    renderCategoryTotals();
  }

  function renderCategoryTotals() {
    const totals = {};
    scheduleBlocks.forEach((b) => {
      const mins = timeToMinutes(b.end) - timeToMinutes(b.start);
      const cat = b.category || "Sin categoría";
      totals[cat] = (totals[cat] || 0) + Math.max(mins, 0);
    });
    const wrap = document.getElementById("categoryTotals");
    wrap.innerHTML = Object.keys(totals)
      .map((cat) => {
        const hrs = (totals[cat] / 60).toFixed(1).replace(/\.0$/, "");
        const sampleBlock = scheduleBlocks.find(
          (b) => (b.category || "Sin categoría") === cat,
        );
        return (
          '<span class="category-pill" style="background:' +
          colorToVar(sampleBlock ? sampleBlock.color : "accent2") +
          '">' +
          escapeHtml(cat) +
          ": " +
          hrs +
          "h/sem</span>"
        );
      })
      .join("");
  }

  let editingScheduleId = null;
  let activeScheduleColor = "accent2";

  let fontScale = parseFloat(
    localStorage.getItem(storageKey("fontScale")) || "1",
  );

  function applyFontScale() {
    document.getElementById("sheet").style.zoom = fontScale;
    localStorage.setItem(storageKey("fontScale"), fontScale);
  }

  document.getElementById("fontIncBtn").addEventListener("click", () => {
    fontScale = Math.min(fontScale + 0.1, 1.5);
    applyFontScale();
  });
  document.getElementById("fontDecBtn").addEventListener("click", () => {
    fontScale = Math.max(fontScale - 0.1, 0.8);
    applyFontScale();
  });
  applyFontScale();

  function setScheduleColor(c) {
    activeScheduleColor = c;
    document.querySelectorAll("#scheduleColorRow .color-dot").forEach((dot) => {
      dot.classList.toggle("active", dot.dataset.color === c);
      dot.onclick = () => setScheduleColor(dot.dataset.color);
    });
  }

  function openScheduleEditor(id, defaultDay) {
    const overlay = document.getElementById("scheduleOverlay");
    const title = document.getElementById("scheduleEditorTitle");
    const delBtn = document.getElementById("deleteScheduleBlock");
    const saveBtn = document.getElementById("saveScheduleBlock");

    if (id) {
      const b = scheduleBlocks.find((x) => x.id === id);
      if (!b) return;
      editingScheduleId = id;
      title.textContent = "Edit class";
      document.getElementById("scheduleDay").value = b.day;
      document.getElementById("scheduleStart").value = b.start;
      document.getElementById("scheduleEnd").value = b.end;
      document.getElementById("scheduleTitle").value = b.title;
      document.getElementById("scheduleSubtitle").value = b.subtitle || "";
      document.getElementById("scheduleCategory").value = b.category || "";
      setScheduleColor(b.color || "accent2");
      delBtn.style.display = "inline-block";
      saveBtn.textContent = "Update class";
    } else {
      editingScheduleId = null;
      title.textContent = "Add class";
      document.getElementById("scheduleDay").value =
        defaultDay != null ? defaultDay : 0;
      document.getElementById("scheduleStart").value = "08:00";
      document.getElementById("scheduleEnd").value = "09:00";
      document.getElementById("scheduleTitle").value = "";
      document.getElementById("scheduleSubtitle").value = "";
      document.getElementById("scheduleCategory").value = "";
      setScheduleColor("accent2");
      delBtn.style.display = "none";
      saveBtn.textContent = "Add class";
    }
    renderCustomColorDots("scheduleColorRow", (hex) => setScheduleColor(hex));
    overlay.classList.add("open");
  }

  function closeScheduleEditor() {
    document.getElementById("scheduleOverlay").classList.remove("open");
    editingScheduleId = null;
  }

  document
    .getElementById("closeScheduleEditorBtn")
    .addEventListener("click", closeScheduleEditor);
  document.getElementById("scheduleOverlay").addEventListener("click", (e) => {
    if (e.target.id === "scheduleOverlay") closeScheduleEditor();
  });

  document.getElementById("saveScheduleBlock").addEventListener("click", () => {
    const day = parseInt(document.getElementById("scheduleDay").value, 10);
    const start = document.getElementById("scheduleStart").value;
    const end = document.getElementById("scheduleEnd").value;
    const title = document.getElementById("scheduleTitle").value.trim();
    const subtitle = document.getElementById("scheduleSubtitle").value.trim();
    const category =
      document.getElementById("scheduleCategory").value.trim() ||
      "Sin categoría";
    if (!title || !start || !end) return;

    if (editingScheduleId) {
      const idx = scheduleBlocks.findIndex((x) => x.id === editingScheduleId);
      if (idx > -1) {
        scheduleBlocks[idx] = Object.assign({}, scheduleBlocks[idx], {
          day,
          start,
          end,
          title,
          subtitle,
          color: activeScheduleColor,
          category,
        });
      }
    } else {
      scheduleBlocks.push({
        id: Date.now() + "-" + Math.random().toString(36).slice(2, 7),
        day,
        start,
        end,
        title,
        subtitle,
        color: activeScheduleColor,
        category,
      });
    }
    saveSchedule();
    closeScheduleEditor();
    renderSchedule();
  });

  document
    .getElementById("deleteScheduleBlock")
    .addEventListener("click", () => {
      if (!editingScheduleId) return;
      scheduleBlocks = scheduleBlocks.filter((x) => x.id !== editingScheduleId);
      saveSchedule();
      closeScheduleEditor();
      renderSchedule();
    });

  function setAppView(view) {
    state.appView = view;
    const isCal = view === "calendar";
    const isSchedule = view === "schedule";
    const isTodo = view === "todo";

    document.getElementById("weekdaysRow").style.display = isCal ? "" : "none";
    document.getElementById("grid").style.display = isCal ? "" : "none";
    document.getElementById("scheduleContainer").style.display = isSchedule
      ? "flex"
      : "none";
    document.getElementById("todoContainer").style.display = isTodo
      ? "flex"
      : "none";
    document.getElementById("calendarCategoryTotals").style.display = isCal
      ? "flex"
      : "none";
    document
      .getElementById("scheduleToggle")
      .classList.toggle("active", isSchedule);
    document.getElementById("todoToggle").classList.toggle("active", isTodo);
    document.getElementById("viewToggleBtn").classList.toggle("active", false);

    if (isCal) {
      render();
    } else if (isSchedule) {
      document.getElementById("monthName").textContent = "Weekly Schedule";
      document.getElementById("yearLabel").textContent = "";
      document.getElementById("dayCount").textContent =
        scheduleBlocks.length + " classes";
      document.getElementById("ghostNum").textContent = "🗓";
      renderSchedule();
    } else {
      document.getElementById("monthName").textContent = "To-do";
      document.getElementById("yearLabel").textContent = "";
      document.getElementById("dayCount").textContent =
        todos.filter((t) => !t.done).length + " pending";
      document.getElementById("ghostNum").textContent = "☑";
      renderTodos();
    }
  }

  // Un solo listener: alterna entre calendario y horario (el duplicado de antes se quitó)
  document.getElementById("scheduleToggle").addEventListener("click", () => {
    setAppView(state.appView === "schedule" ? "calendar" : "schedule");
  });
  document.getElementById("todoToggle").addEventListener("click", () => {
    setAppView(state.appView === "todo" ? "calendar" : "todo");
  });

  // ---------------- Navigation ----------------
  document.getElementById("prevBtn").addEventListener("click", () => {
    if (state.appView !== "calendar") setAppView("calendar");
    if (state.viewMode === "week") {
      state.cursorDate.setDate(state.cursorDate.getDate() - 7);
    } else {
      state.cursorDate.setMonth(state.cursorDate.getMonth() - 1, 1);
    }
    syncStateFromCursor();
    render();
  });
  document.getElementById("nextBtn").addEventListener("click", () => {
    if (state.appView !== "calendar") setAppView("calendar");
    if (state.viewMode === "week") {
      state.cursorDate.setDate(state.cursorDate.getDate() + 7);
    } else {
      state.cursorDate.setMonth(state.cursorDate.getMonth() + 1, 1);
    }
    syncStateFromCursor();
    render();
  });
  document.getElementById("todayBtn").addEventListener("click", () => {
    if (state.appView !== "calendar") setAppView("calendar");
    state.cursorDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    syncStateFromCursor();
    render();
  });
  document.getElementById("viewToggleBtn").addEventListener("click", () => {
    if (state.appView !== "calendar") setAppView("calendar");
    state.viewMode = state.viewMode === "month" ? "week" : "month";
    document.getElementById("viewToggleBtn").textContent =
      state.viewMode === "month" ? "Week" : "Month";
    syncStateFromCursor();
    render();
  });

  document
    .getElementById("notifToggle")
    .addEventListener("click", toggleNotifications);
  setInterval(checkReminders, 20000);

  document.getElementById("printCalBtn").addEventListener("click", () => {
    if (state.appView !== "calendar") setAppView("calendar");
    if (state.viewMode !== "month") {
      state.viewMode = "month";
      document.getElementById("viewToggleBtn").textContent = "Week";
      syncStateFromCursor();
      render();
    }
    setTimeout(() => window.print(), 50);
  });

  document.getElementById("printScheduleBtn").addEventListener("click", () => {
    if (state.appView !== "schedule") setAppView("schedule");
    setTimeout(() => window.print(), 50);
  });

  // ---------------- Startup ----------------
  applyPalette(PALETAS[state.paletteIndex]);
  renderPalettes();
  renderWeekdays();
  syncStateFromCursor();
  carryOverTodos();
  initPresetDeleteButtons();
  setAppView("calendar");
})();
