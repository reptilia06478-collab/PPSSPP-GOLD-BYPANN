// PANN STATION — PPSSPP Gold Style
// Developer: PANN

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const state = {
  library: JSON.parse(localStorage.getItem("pann_lib") || "[]"),
  recent: JSON.parse(localStorage.getItem("pann_recent") || "[]"),
  emuReady: false,
  currentGame: null,
  paused: false,
  musicOn: false,
  settings: JSON.parse(localStorage.getItem("pann_set") || "null") || {
    resolution: "2", frameskip: "2", touch: true, fps: true, music: true,
  },
};

const bgMusic = $("#bg-music");

// ═══ SPLASH ═══
const splashSteps = ["Initializing core...", "Loading PPSSPP...", "Setup graphics...", "Ready!"];
let sIdx = 0;
const sTimer = setInterval(() => {
  sIdx++;
  const pct = Math.min(100, (sIdx / splashSteps.length) * 100);
  $("#splash-bar").style.width = pct + "%";
  $("#splash-text").textContent = splashSteps[sIdx - 1] || "Ready!";
  if (sIdx >= splashSteps.length) {
    clearInterval(sTimer);
    setTimeout(() => {
      $("#splash").classList.add("hide");
      $("#app").classList.add("show");
      setTimeout(() => $("#splash").style.display = "none", 600);
    }, 500);
  }
}, 400);

// ═══ MUSIC ═══
function initMusic() {
  document.addEventListener("click", () => {
    if (state.settings.music && !state.musicOn) {
      bgMusic.volume = 0.4;
      bgMusic.play().then(() => { state.musicOn = true; }).catch(() => {});
    }
  }, { once: true });
}

// ═══ TABS ═══
$$(".topbar-tab").forEach(tab => {
  tab.onclick = () => {
    $$(".topbar-tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    $$(".lib-panel").forEach(p => p.classList.remove("active"));
    $(`.lib-panel[data-panel="${tab.dataset.tab}"]`)?.classList.add("active");
    const name = tab.dataset.tab;
    if (name === "recent") renderRecent();
    else if (name === "games") renderGames();
    else if (name === "homebrew") renderHomebrew();
  };
});

// ═══ LIBRARY ═══
function renderGames() {
  const grid = $("#grid-games");
  if (!state.library.length) {
    grid.innerHTML = `<div class="lib-empty">
      <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor"><path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2z"/></svg>
      <p>Belum ada game. Tap + untuk tambah.</p>
    </div>`;
    return;
  }
  grid.innerHTML = "";
  state.library.forEach((g, i) => {
    const div = document.createElement("div");
    div.className = "lib-card";
    div.innerHTML = `
      <div class="lib-card-cover">${getIcon(g)}</div>
      <div class="lib-card-title">${g.name}</div>
      <button class="lib-card-remove" data-idx="${i}">✕</button>
    `;
    div.onclick = (e) => {
      if (e.target.classList.contains("lib-card-remove")) return;
      loadGame(g);
    };
    div.querySelector(".lib-card-remove").onclick = (e) => {
      e.stopPropagation();
      state.library.splice(i, 1);
      saveLib();
      renderGames();
    };
    grid.appendChild(div);
  });
}

function renderRecent() {
  const grid = $("#grid-recent");
  if (!state.recent.length) {
    grid.innerHTML = `<div class="lib-empty">
      <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
      <p>Belum ada history.</p>
    </div>`;
    return;
  }
  grid.innerHTML = "";
  state.recent.forEach(g => {
    const div = document.createElement("div");
    div.className = "lib-card";
    div.innerHTML = `
      <div class="lib-card-cover">${getIcon(g)}</div>
      <div class="lib-card-title">${g.name}</div>
    `;
    div.onclick = () => {
      const full = state.library.find(x => x.name === g.name);
      if (full) loadGame(full);
    };
    grid.appendChild(div);
  });
}

function renderHomebrew() {
  const grid = $("#grid-homebrew");
  const list = [
    { name: "Cave Story", icon: "CS" },
    { name: "Doom PSP", icon: "DM" },
    { name: "Quake PSP", icon: "QK" },
    { name: "Wagic", icon: "WG" },
    { name: "OpenTyrian", icon: "OT" },
    { name: "PSP Revolution", icon: "PR" },
  ];
  grid.innerHTML = "";
  list.forEach(g => {
    const div = document.createElement("div");
    div.className = "lib-card";
    div.innerHTML = `<div class="lib-card-cover">${g.icon}</div><div class="lib-card-title">${g.name}</div>`;
    div.onclick = () => alert(`Homebrew "${g.name}" — cari file .iso/.cso di internet`);
    grid.appendChild(div);
  });
}

function getIcon(g) {
  const n = (g.name || "").toUpperCase();
  return n.slice(0, 2).replace(/[^A-Z0-9]/g, "") || "GM";
}

function saveLib() {
  try { localStorage.setItem("pann_lib", JSON.stringify(state.library)); } catch (e) {}
}

function addRecent(game) {
  state.recent = state.recent.filter(g => g.name !== game.name);
  state.recent.unshift({ name: game.name });
  if (state.recent.length > 20) state.recent.pop();
  try { localStorage.setItem("pann_recent", JSON.stringify(state.recent)); } catch (e) {}
}

// ═══ ADD GAME ═══
$("#fab-add").onclick = () => $("#modal-add").classList.add("active");
$("#btn-close-add").onclick = () => $("#modal-add").classList.remove("active");
$("#btn-cancel-add").onclick = () => $("#modal-add").classList.remove("active");

$("#add-file").onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  const game = {
    name: file.name.replace(/\.[^.]+$/, ""),
    url,
    ext: file.name.split(".").pop().toUpperCase(),
  };
  state.library.push(game);
  saveLib();
  renderGames();
  $("#modal-add").classList.remove("active");
  $("#add-file").value = "";
  loadGame(game);
};

$("#btn-save-add").onclick = () => {
  const name = $("#add-name").value.trim();
  const url = $("#add-url").value.trim();
  if (!name || !url) return alert("Nama dan URL harus diisi");
  state.library.push({ name, url, ext: "URL" });
  saveLib();
  renderGames();
  $("#modal-add").classList.remove("active");
  $("#add-name").value = "";
  $("#add-url").value = "";
};

// ═══ LOAD GAME ═══
function loadGame(game) {
  state.currentGame = game;
  $("#emu-title").textContent = game.name;
  $("#screen-emulator").classList.add("active");

  window.EJS_player = "#emu-view";
  window.EJS_core = "psp";
  window.EJS_gameUrl = game.url;
  window.EJS_pathtodata = "https://cdn.emulatorjs.org/stable/data/";
  window.EJS_startOnLoaded = true;
  window.EJS_language = "id-ID";
  window.EJS_defaultOptions = {
    "shader": "disabled",
    "frameskip": state.settings.frameskip,
    "resolution": state.settings.resolution + "x",
  };
  window.EJS_ready = () => {
    state.emuReady = true;
    startFps();
  };

  if (window.EJS_emulator?.destroy) {
    try { window.EJS_emulator.destroy(); } catch (e) {}
  }
  $("#emu-view").innerHTML = "";

  if (typeof EJS_loadEmulator === "function") EJS_loadEmulator();
  else if (typeof EJS?.loadEmulator === "function") EJS.loadEmulator();
  else {
    const s = document.createElement("script");
    s.src = "https://cdn.emulatorjs.org/stable/data/loader.js";
    s.onload = () => {
      if (typeof EJS_loadEmulator === "function") EJS_loadEmulator();
      else if (typeof EJS?.loadEmulator === "function") EJS.loadEmulator();
    };
    document.head.appendChild(s);
  }

  addRecent(game);
  $("#touch").classList.toggle("active", state.settings.touch);
}

// ═══ EMU CONTROLS ═══
$("#emu-exit").onclick = () => {
  try { window.EJS_emulator?.destroy?.(); } catch (e) {}
  $("#emu-view").innerHTML = "";
  state.emuReady = false;
  state.currentGame = null;
  $("#screen-emulator").classList.remove("active");
  stopFps();
};
$("#emu-pause").onclick = () => {
  state.paused = !state.paused;
  if (state.paused) window.EJS_emulator?.pause?.();
  else window.EJS_emulator?.play?.();
};
$("#emu-save").onclick = () => { try { window.EJS_emulator?.gameManager?.saveState?.(); } catch (e) {} };
$("#emu-load").onclick = () => { try { window.EJS_emulator?.gameManager?.loadState?.(); } catch (e) {} };
$("#emu-full").onclick = () => {
  const el = $("#screen-emulator");
  if (!document.fullscreenElement) el.requestFullscreen?.();
  else document.exitFullscreen?.();
};

$("#screen-emulator").addEventListener("touchstart", () => {
  $("#screen-emulator").classList.add("touched");
  clearTimeout(window._t);
  window._t = setTimeout(() => $("#screen-emulator").classList.remove("touched"), 3000);
});

// ═══ FPS ═══
let fpsInt = null;
function startFps() {
  if (fpsInt) clearInterval(fpsInt);
  let frames = 0, last = performance.now();
  fpsInt = setInterval(() => {
    frames++;
    const now = performance.now();
    if (now - last >= 1000) {
      $("#fps-val").textContent = frames;
      frames = 0; last = now;
    }
  }, 50);
}
function stopFps() { if (fpsInt) { clearInterval(fpsInt); fpsInt = null; } }

// ═══ TOUCH ═══
const KEYMAP = { up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight", cross: "x", circle: "c", square: "s", triangle: "v", l: "q", r: "e", start: "Enter", select: "Shift" };
function sendKey(key, down) {
  const code = KEYMAP[key] || key;
  const evt = new KeyboardEvent(down ? "keydown" : "keyup", { key: code, code, bubbles: true, cancelable: true });
  $("#emu-view")?.dispatchEvent(evt);
  document.dispatchEvent(evt);
}
$$(".dbtn, .fbtn, .sbtn, .sysbtn").forEach(btn => {
  const key = btn.dataset.key;
  const press = (e) => { e.preventDefault(); btn.style.background = "var(--blue)"; btn.style.color = "#fff"; sendKey(key, true); };
  const release = (e) => { e.preventDefault(); btn.style.background = ""; btn.style.color = ""; sendKey(key, false); };
  btn.addEventListener("touchstart", press, { passive: false });
  btn.addEventListener("touchend", release, { passive: false });
  btn.addEventListener("mousedown", press);
  btn.addEventListener("mouseup", release);
  btn.addEventListener("mouseleave", release);
});

// Analog
const stick = $("#analog-stick");
const stickBase = stick?.parentElement;
if (stickBase) {
  let active = false;
  const move = (x, y) => {
    const r = stickBase.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let dx = x - cx, dy = y - cy;
    const maxR = r.width / 2 - 12;
    const d = Math.hypot(dx, dy);
    if (d > maxR) { dx = dx / d * maxR; dy = dy / d * maxR; }
    stick.style.transform = `translate(${dx}px, ${dy}px)`;
  };
  stickBase.addEventListener("touchstart", (e) => { active = true; const t = e.touches[0]; move(t.clientX, t.clientY); }, { passive: false });
  stickBase.addEventListener("touchmove", (e) => { if (!active) return; e.preventDefault(); const t = e.touches[0]; move(t.clientX, t.clientY); }, { passive: false });
  stickBase.addEventListener("touchend", () => { active = false; stick.style.transform = ""; });
}

// ═══ RIGHT PANEL ═══
$$(".rp-item").forEach(btn => {
  btn.onclick = () => {
    const a = btn.dataset.action;
    if (a === "load") { renderLoadList(); $("#modal-load").classList.add("active"); }
    else if (a === "settings") $("#modal-settings").classList.add("active");
    else if (a === "credits") $("#modal-credits").classList.add("active");
    else if (a === "exit") { if (confirm("Keluar dari PANN STATION?")) window.close(); }
  };
});

$("#btn-close-settings").onclick = () => $("#modal-settings").classList.remove("active");
$("#btn-close-credits").onclick = () => $("#modal-credits").classList.remove("active");
$("#btn-close-load").onclick = () => $("#modal-load").classList.remove("active");

function renderLoadList() {
  const list = $("#load-list");
  if (!state.library.length) { list.innerHTML = `<div class="empty-mini">Belum ada game</div>`; return; }
  list.innerHTML = "";
  state.library.forEach(g => {
    const div = document.createElement("div");
    div.className = "load-item";
    div.innerHTML = `<div class="load-item-name">${g.name}</div><div class="load-item-meta">${g.ext || ""}</div>`;
    div.onclick = () => { $("#modal-load").classList.remove("active"); loadGame(g); };
    list.appendChild(div);
  });
}

// ═══ SETTINGS ═══
$("#btn-save-settings").onclick = () => {
  state.settings = {
    resolution: $("#set-res").value,
    frameskip: $("#set-frameskip").value,
    touch: $("#set-touch").checked,
    fps: $("#set-fps").checked,
    music: $("#set-music").checked,
  };
  localStorage.setItem("pann_set", JSON.stringify(state.settings));
  $("#touch").classList.toggle("active", state.settings.touch);
  $("#fps-badge").style.display = state.settings.fps ? "block" : "none";
  $("#modal-settings").classList.remove("active");
};

function loadSettingsToUI() {
  $("#set-res").value = state.settings.resolution;
  $("#set-frameskip").value = state.settings.frameskip;
  $("#set-touch").checked = state.settings.touch;
  $("#set-fps").checked = state.settings.fps;
  $("#set-music").checked = state.settings.music;
}

// ═══ INIT ═══
initMusic();
renderGames();
renderRecent();
renderHomebrew();
loadSettingsToUI();
console.log("[PANN STATION] Ready");
