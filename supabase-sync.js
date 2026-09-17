(function () {
  "use strict";

  const SUPABASE_URL = "https://jifdptbrojxvaaailzht.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppZmRwdGJyb2p4dmFhYWlsemh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NjU2ODUsImV4cCI6MjEwNTI0MTY4NX0.LEW7d6yB0xCoABKlqyx3gJ_OvWu7fO6zoxgWa4K9jgw";

  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Claves de localStorage que la app (script.js) ya usa por perfil.
  const DATA_KEYS = [
    "palettesAll",
    "customColorDefs",
    "hiddenPresetColors",
    "paletteIndex",
    "calendarNotes",
    "scheduleBlocks",
    "todos",
  ];

  function pKey(profileId, base) {
    return "profile:" + profileId + ":" + base;
  }

  function safeParse(str, fallback) {
    try {
      const v = JSON.parse(str);
      return v === null || v === undefined ? fallback : v;
    } catch (e) {
      return fallback;
    }
  }

  // ---------------------------------------------------------------
  // UI: overlay de autenticación (reutiliza las clases visuales del calendario)
  // ---------------------------------------------------------------
  let authOverlayEl = null;

  function buildAuthOverlay() {
    const wrap = document.createElement("div");
    wrap.className = "overlay open";
    wrap.id = "authOverlay";
    wrap.innerHTML =
      '<div class="editor">' +
      '<h3>Ga-on\'s calendar</h3>' +
      '<div class="sub">Inicia sesión para sincronizar tu calendario</div>' +
      '<div class="form-row"><input type="email" id="authEmail" placeholder="Correo"></div>' +
      '<div class="form-row"><input type="password" id="authPassword" placeholder="Contraseña"></div>' +
      '<div id="authError" style="color:#B5533C;font-family:Inter,sans-serif;font-size:12px;margin:-4px 0 10px;min-height:14px;"></div>' +
      '<div class="editor-actions">' +
      '<button type="button" class="btn-ghost" id="authMagicLinkBtn">Enviar enlace mágico</button>' +
      '<button type="button" class="btn-ghost" id="authSignUpBtn">Crear cuenta</button>' +
      '<button type="button" class="btn-primary" id="authSignInBtn">Iniciar sesión</button>' +
      "</div>" +
      "</div>";
    return wrap;
  }

  function setAuthError(msg) {
    const box = document.getElementById("authError");
    if (box) box.textContent = msg || "";
  }

  function setAuthBusy(busy) {
    const overlay = document.getElementById("authOverlay");
    if (!overlay) return;
    overlay
      .querySelectorAll("button")
      .forEach((b) => (b.disabled = !!busy));
  }

  function showAuthOverlay() {
    if (authOverlayEl) return;
    authOverlayEl = buildAuthOverlay();
    document.body.appendChild(authOverlayEl);

    const emailInput = document.getElementById("authEmail");
    const passInput = document.getElementById("authPassword");

    document
      .getElementById("authSignInBtn")
      .addEventListener("click", async () => {
        setAuthError("");
        const email = emailInput.value.trim();
        const password = passInput.value;
        if (!email || !password) {
          setAuthError("Ingresa correo y contraseña.");
          return;
        }
        setAuthBusy(true);
        const { error } = await sb.auth.signInWithPassword({
          email,
          password,
        });
        setAuthBusy(false);
        if (error) setAuthError(error.message);
      });

    document
      .getElementById("authSignUpBtn")
      .addEventListener("click", async () => {
        setAuthError("");
        const email = emailInput.value.trim();
        const password = passInput.value;
        if (!email || !password) {
          setAuthError("Ingresa correo y contraseña.");
          return;
        }
        setAuthBusy(true);
        const { error } = await sb.auth.signUp({ email, password });
        setAuthBusy(false);
        if (error) setAuthError(error.message);
        else
          setAuthError(
            "Cuenta creada. Revisa tu correo si se pide confirmación, o inicia sesión.",
          );
      });

    document
      .getElementById("authMagicLinkBtn")
      .addEventListener("click", async () => {
        setAuthError("");
        const email = emailInput.value.trim();
        if (!email) {
          setAuthError("Ingresa tu correo primero.");
          return;
        }
        setAuthBusy(true);
        const { error } = await sb.auth.signInWithOtp({ email });
        setAuthBusy(false);
        setAuthError(
          error ? error.message : "Te enviamos un enlace mágico a tu correo.",
        );
      });
  }

  function hideAuthOverlay() {
    if (authOverlayEl) {
      authOverlayEl.remove();
      authOverlayEl = null;
    }
  }

  function showLoadingOverlay(text) {
    hideLoadingOverlay();
    const wrap = document.createElement("div");
    wrap.className = "overlay open";
    wrap.id = "syncLoadingOverlay";
    wrap.innerHTML =
      '<div class="editor" style="text-align:center;">' +
      '<div class="sub" style="margin:0;">' +
      (text || "Sincronizando...") +
      "</div>" +
      "</div>";
    document.body.appendChild(wrap);
  }

  function hideLoadingOverlay() {
    const el = document.getElementById("syncLoadingOverlay");
    if (el) el.remove();
  }

  // ---------------------------------------------------------------
  // Descarga (Supabase -> localStorage) y subida (localStorage -> Supabase)
  // ---------------------------------------------------------------
  async function pullProfileData(userId, profileId) {
    const [settingsRes, notesRes, todosRes, scheduleRes] = await Promise.all([
      sb
        .from("settings")
        .select("*")
        .eq("user_id", userId)
        .eq("profile_client_id", profileId)
        .maybeSingle(),
      sb
        .from("notes")
        .select("*")
        .eq("user_id", userId)
        .eq("profile_client_id", profileId),
      sb
        .from("todos")
        .select("*")
        .eq("user_id", userId)
        .eq("profile_client_id", profileId),
      sb
        .from("schedule_blocks")
        .select("*")
        .eq("user_id", userId)
        .eq("profile_client_id", profileId),
    ]);

    const settingsRow = settingsRes.data;
    if (settingsRow) {
      localStorage.setItem(
        pKey(profileId, "paletteIndex"),
        String(settingsRow.palette_index || 0),
      );
      localStorage.setItem(
        pKey(profileId, "palettesAll"),
        JSON.stringify(settingsRow.palettes || []),
      );
      localStorage.setItem(
        pKey(profileId, "customColorDefs"),
        JSON.stringify(settingsRow.custom_color_defs || []),
      );
      localStorage.setItem(
        pKey(profileId, "hiddenPresetColors"),
        JSON.stringify(settingsRow.hidden_preset_colors || []),
      );
    }

    const notesObj = {};
    (notesRes.data || []).forEach((n) => {
      const arr = notesObj[n.date_key] || (notesObj[n.date_key] = []);
      arr.push({
        id: n.client_id,
        texto: n.texto,
        hora: n.hora,
        color: n.color,
        repeat: n.repeat,
        important: n.important,
        category: n.category,
      });
    });
    localStorage.setItem(
      pKey(profileId, "calendarNotes"),
      JSON.stringify(notesObj),
    );

    localStorage.setItem(
      pKey(profileId, "todos"),
      JSON.stringify(
        (todosRes.data || []).map((t) => ({
          id: t.client_id,
          text: t.text,
          date: t.date,
          done: t.done,
        })),
      ),
    );

    localStorage.setItem(
      pKey(profileId, "scheduleBlocks"),
      JSON.stringify(
        (scheduleRes.data || []).map((s) => ({
          id: s.client_id,
          day: s.day,
          start: s.start_time,
          end: s.end_time,
          title: s.title,
          subtitle: s.subtitle,
          color: s.color,
          category: s.category,
        })),
      ),
    );
  }

  async function pushProfileData(userId, profileId) {
    const paletteIndex =
      parseInt(localStorage.getItem(pKey(profileId, "paletteIndex")), 10) ||
      0;
    const palettes = safeParse(
      localStorage.getItem(pKey(profileId, "palettesAll")),
      [],
    );
    const customColorDefs = safeParse(
      localStorage.getItem(pKey(profileId, "customColorDefs")),
      [],
    );
    const hiddenPresetColors = safeParse(
      localStorage.getItem(pKey(profileId, "hiddenPresetColors")),
      [],
    );

    await sb.from("settings").upsert(
      {
        user_id: userId,
        profile_client_id: profileId,
        palette_index: paletteIndex,
        palettes: palettes,
        custom_color_defs: customColorDefs,
        hidden_preset_colors: hiddenPresetColors,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,profile_client_id" },
    );

    const notesObj = safeParse(
      localStorage.getItem(pKey(profileId, "calendarNotes")),
      {},
    );
    const noteRows = [];
    Object.keys(notesObj).forEach((dateKey) => {
      (notesObj[dateKey] || []).forEach((n) => {
        noteRows.push({
          user_id: userId,
          profile_client_id: profileId,
          client_id: String(n.id),
          date_key: dateKey,
          texto: n.texto || "",
          hora: n.hora || null,
          color: n.color || null,
          repeat: n.repeat || "none",
          important: !!n.important,
          category: n.category || null,
        });
      });
    });
    await sb
      .from("notes")
      .delete()
      .eq("user_id", userId)
      .eq("profile_client_id", profileId);
    if (noteRows.length) await sb.from("notes").insert(noteRows);

    const todos = safeParse(
      localStorage.getItem(pKey(profileId, "todos")),
      [],
    );
    await sb
      .from("todos")
      .delete()
      .eq("user_id", userId)
      .eq("profile_client_id", profileId);
    if (todos.length)
      await sb.from("todos").insert(
        todos.map((t) => ({
          user_id: userId,
          profile_client_id: profileId,
          client_id: String(t.id),
          text: t.text,
          date: t.date || null,
          done: !!t.done,
        })),
      );

    const blocks = safeParse(
      localStorage.getItem(pKey(profileId, "scheduleBlocks")),
      [],
    );
    await sb
      .from("schedule_blocks")
      .delete()
      .eq("user_id", userId)
      .eq("profile_client_id", profileId);
    if (blocks.length)
      await sb.from("schedule_blocks").insert(
        blocks.map((b) => ({
          user_id: userId,
          profile_client_id: profileId,
          client_id: String(b.id),
          day: b.day,
          start_time: b.start,
          end_time: b.end,
          title: b.title,
          subtitle: b.subtitle || null,
          color: b.color || null,
          category: b.category || null,
        })),
      );
  }

  // ---------------------------------------------------------------
  // Reconciliación de la lista de perfiles (crear / renombrar / borrar)
  // ---------------------------------------------------------------
  async function syncProfilesListChange(userId, newProfiles) {
    const snapshot = safeParse(
      localStorage.getItem("cloudProfilesSnapshot"),
      [],
    );
    const { data: remoteProfiles } = await sb
      .from("profiles")
      .select("client_id,name")
      .eq("user_id", userId);
    const remoteIds = new Set((remoteProfiles || []).map((p) => p.client_id));

    for (const p of newProfiles) {
      if (!remoteIds.has(p.id)) {
        await sb
          .from("profiles")
          .upsert({ user_id: userId, client_id: p.id, name: p.name });
        await pushProfileData(userId, p.id);
      } else {
        const prevMatch = snapshot.find((s) => s.id === p.id);
        if (!prevMatch || prevMatch.name !== p.name) {
          await sb
            .from("profiles")
            .update({ name: p.name })
            .eq("user_id", userId)
            .eq("client_id", p.id);
        }
      }
    }

    for (const prev of snapshot) {
      const stillExists = newProfiles.some((p) => p.id === prev.id);
      if (!stillExists) {
        await sb
          .from("profiles")
          .delete()
          .eq("user_id", userId)
          .eq("client_id", prev.id);
      }
    }

    localStorage.setItem("cloudProfilesSnapshot", JSON.stringify(newProfiles));
  }

  // ---------------------------------------------------------------
  // Arranque: reconcilia perfiles y trae los datos del perfil activo
  // ---------------------------------------------------------------
  async function reconcileProfilesAndBoot(userId) {
    const { data: remoteProfilesRaw } = await sb
      .from("profiles")
      .select("client_id,name")
      .eq("user_id", userId);
    const remoteProfiles = (remoteProfilesRaw || []).map((r) => ({
      id: r.client_id,
      name: r.name,
    }));

    let localProfiles = safeParse(localStorage.getItem("profiles"), null);
    const hasLocalProfiles =
      Array.isArray(localProfiles) && localProfiles.length > 0;

    if (remoteProfiles.length === 0) {
      // Primera vez que esta cuenta se sincroniza: lo que haya en este navegador
      // (o el perfil por defecto) se sube a Supabase tal cual.
      if (!hasLocalProfiles) localProfiles = [{ id: "default", name: "Me" }];
      for (const p of localProfiles) {
        await sb
          .from("profiles")
          .upsert({ user_id: userId, client_id: p.id, name: p.name });
        await pushProfileData(userId, p.id);
      }
      localStorage.setItem("profiles", JSON.stringify(localProfiles));
      localStorage.setItem(
        "cloudProfilesSnapshot",
        JSON.stringify(localProfiles),
      );
      if (!localStorage.getItem("activeProfileId")) {
        localStorage.setItem("activeProfileId", localProfiles[0].id);
      }
      return;
    }

    // Ya existen perfiles en Supabase para esta cuenta.
    let finalProfiles = remoteProfiles.slice();
    if (hasLocalProfiles) {
      // Sube cualquier perfil creado localmente que aún no exista en la nube,
      // y aplica localmente los cambios de nombre que se hayan hecho offline.
      const remoteIds = new Set(remoteProfiles.map((p) => p.id));
      for (const p of localProfiles) {
        if (!remoteIds.has(p.id)) {
          await sb
            .from("profiles")
            .upsert({ user_id: userId, client_id: p.id, name: p.name });
          await pushProfileData(userId, p.id);
          finalProfiles.push({ id: p.id, name: p.name });
        }
      }
      // Perfiles borrados localmente desde el último snapshot -> bórralos también en la nube.
      const snapshot = safeParse(
        localStorage.getItem("cloudProfilesSnapshot"),
        [],
      );
      for (const prev of snapshot) {
        const stillLocal = localProfiles.some((p) => p.id === prev.id);
        if (!stillLocal) {
          await sb
            .from("profiles")
            .delete()
            .eq("user_id", userId)
            .eq("client_id", prev.id);
          finalProfiles = finalProfiles.filter((p) => p.id !== prev.id);
        }
      }
    }

    localStorage.setItem("profiles", JSON.stringify(finalProfiles));
    localStorage.setItem(
      "cloudProfilesSnapshot",
      JSON.stringify(finalProfiles),
    );

    let activeId = localStorage.getItem("activeProfileId");
    if (!activeId || !finalProfiles.some((p) => p.id === activeId)) {
      activeId = finalProfiles[0].id;
      localStorage.setItem("activeProfileId", activeId);
    }

    // Trae los datos más recientes del perfil activo (por si se editó desde otro dispositivo).
    await pullProfileData(userId, activeId);
  }

  // ---------------------------------------------------------------
  // Empuje automático de cambios: se engancha a localStorage.setItem
  // ---------------------------------------------------------------
  let pushTimer = null;
  function schedulePush(userId, profileId) {
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
      pushProfileData(userId, profileId).catch((e) =>
        console.error("Error sincronizando con Supabase:", e),
      );
    }, 1200);
  }

  function installStorageHook(userId) {
    const origSetItem = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function (key, value) {
      origSetItem(key, value);
      try {
        if (key === "profiles") {
          syncProfilesListChange(userId, safeParse(value, [])).catch((e) =>
            console.error("Error sincronizando perfiles:", e),
          );
          return;
        }
        const activeId = localStorage.getItem("activeProfileId");
        if (
          activeId &&
          DATA_KEYS.some((k) => key === pKey(activeId, k))
        ) {
          schedulePush(userId, activeId);
        }
      } catch (e) {
        console.error(e);
      }
    };

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        const activeId = localStorage.getItem("activeProfileId");
        if (activeId) pushProfileData(userId, activeId).catch(() => {});
      }
    });
  }

  // ---------------------------------------------------------------
  // Botón de cerrar sesión
  // ---------------------------------------------------------------
  function installLogoutButton() {
    const btn = document.getElementById("logoutBtn");
    if (!btn) return;
    btn.addEventListener("click", async () => {
      if (!confirm("¿Cerrar sesión?")) return;
      await sb.auth.signOut();
      location.reload();
    });
  }

  function loadMainScript() {
    const s = document.createElement("script");
    s.src = "script.js";
    document.body.appendChild(s);
  }

  async function startApp(userId) {
    showLoadingOverlay("Sincronizando tu calendario...");
    try {
      await reconcileProfilesAndBoot(userId);
    } catch (e) {
      console.error("Error de sincronización inicial:", e);
    }
    installStorageHook(userId);
    installLogoutButton();
    hideLoadingOverlay();
    loadMainScript();
  }

  async function boot() {
    const {
      data: { session },
    } = await sb.auth.getSession();

    if (session) {
      hideAuthOverlay();
      startApp(session.user.id);
      return;
    }

    showAuthOverlay();

    sb.auth.onAuthStateChange((event, newSession) => {
      if (event === "SIGNED_IN" && newSession) {
        hideAuthOverlay();
        startApp(newSession.user.id);
      }
    });
  }

  boot();
})();
