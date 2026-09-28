const SHEET_URL = "https://script.google.com/macros/s/AKfycbwJD7Lx5_GmfrLiFCgWbX0eQ5k0zrItPPLUGfWVrKQv-bgxuEKbF_JcSprNqdi5Mc-L/exec";
const SHEET_URL_KEY = "umiya-sheet-url";
const PASSWORD_KEY = "umiya-admin-password";
const SESSION_KEY = "umiya-admin";
const DEFAULT_PASSWORD = "umiya";

const state = {
  items: [],
  brand: "all",
  q: "",
  inStockOnly: false,
  adminQ: "",
  loading: false,
  loaded: false,
  sheetError: false
};

function uid() {
  return "t-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
}

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function brandOf(vehicle) {
  if (vehicle.startsWith("Land Rover")) return "Land Rover";
  if (vehicle.startsWith("Mercedes")) return "Mercedes-Benz";
  return vehicle.split(" ")[0];
}

function brands() {
  const seen = [];
  state.items.forEach((item) => {
    const brand = brandOf(item.vehicle);
    if (!seen.includes(brand)) seen.push(brand);
  });
  return seen;
}

function qty(value) {
  const number = Math.floor(Number(value));
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(9999, number));
}

function totalOf(item) {
  return item.shop + item.godown;
}

function normalize(item) {
  const hasPlaces = Object.prototype.hasOwnProperty.call(item, "shop")
    || Object.prototype.hasOwnProperty.call(item, "godown");
  return {
    id: String(item.id || uid()),
    vehicle: String(item.vehicle || "").trim(),
    size: String(item.size || "").trim(),
    price: String(item.price || "").trim(),
    shop: hasPlaces ? qty(item.shop) : qty(item.stock),
    godown: hasPlaces ? qty(item.godown) : 0
  };
}

function isUsable(item) {
  return Boolean(item.vehicle && item.size && item.price);
}

function applySheetItems(items) {
  state.items = items.map(normalize).filter(isUsable);
  state.loaded = true;
  state.loading = false;
  state.sheetError = false;
}

function availability(stock) {
  if (stock <= 0) return { key: "out", label: "Out of stock" };
  if (stock <= 2) return { key: "low", label: "Only a few left" };
  return { key: "in", label: "In stock" };
}

function sameTyre(a, b) {
  return a.vehicle.trim().toLowerCase() === b.vehicle.trim().toLowerCase()
    && a.size.trim().toLowerCase() === b.size.trim().toLowerCase();
}

function getPassword() {
  return localStorage.getItem(PASSWORD_KEY) || DEFAULT_PASSWORD;
}

function isAuthed() {
  return sessionStorage.getItem(SESSION_KEY) === "yes";
}

function visibleItems() {
  return state.items.filter((item) => {
    if (state.brand !== "all" && brandOf(item.vehicle) !== state.brand) return false;
    if (state.inStockOnly && totalOf(item) <= 0) return false;
    if (!state.q) return true;
    const hay = (item.vehicle + " " + item.size + " " + item.price).toLowerCase();
    return hay.includes(state.q);
  });
}

function renderStats() {
  const ready = state.loaded && !state.loading && !state.sheetError;
  const shop = state.items.reduce((sum, item) => sum + item.shop, 0);
  const godown = state.items.reduce((sum, item) => sum + item.godown, 0);
  document.getElementById("stat-shop").textContent = ready ? String(shop) : "—";
  document.getElementById("stat-godown").textContent = ready ? String(godown) : "—";
  document.getElementById("stat-units").textContent = ready ? String(shop + godown) : "—";
}

function renderFilters() {
  if (state.brand !== "all" && !brands().includes(state.brand)) state.brand = "all";
  const names = ["all", ...brands()];
  document.getElementById("brand-filters").innerHTML = names.map((name) => {
    const label = name === "all" ? "All" : name;
    const pressed = state.brand === name ? "true" : "false";
    return `<button type="button" data-brand="${esc(name)}" aria-pressed="${pressed}">${esc(label)}</button>`;
  }).join("");
}

function boardMessage() {
  if (state.loading) return "Loading stock from the Google Sheet…";
  if (!sheetUrl()) return "Connect the Google Sheet in Admin. This page shows only that sheet.";
  if (state.sheetError) return "The Google Sheet could not be loaded.";
  if (!state.items.length) return "The Google Sheet has no tyre rows yet.";
  return "";
}

function renderBoard() {
  const items = visibleItems();
  const noun = items.length === 1 ? "size" : "sizes";
  const waiting = boardMessage();
  document.getElementById("result-count").textContent = waiting ? "" : `Showing ${items.length} ${noun}`;
  const board = document.getElementById("board");
  if (waiting) {
    board.innerHTML = `<p class="empty">${esc(waiting)}</p>`;
    return;
  }
  if (!items.length) {
    board.innerHTML = '<p class="empty">No tyres match that search.</p>';
    return;
  }
  board.innerHTML = items.map((item) => {
    const total = totalOf(item);
    const status = availability(total);
    return `<article class="tyre ${status.key}">
      <p class="vehicle">${esc(item.vehicle)}</p>
      <p class="size"><span class="k">Tyre size</span><span class="size-val">${esc(item.size)}</span></p>
      <p class="price"><span class="k">Price</span><span class="price-val">${esc(item.price)}</span></p>
      <p class="count"><span class="k">Total</span><span class="count-val">${total}</span><span class="badge ${status.key}">${status.label}</span></p>
      <p class="where"><span class="k">Where</span><span class="place shop"><span class="place-k">Shop</span>${item.shop}</span><span class="place godown"><span class="place-k">Godown</span>${item.godown}</span></p>
    </article>`;
  }).join("");
}

function adminItems() {
  if (!state.adminQ) return state.items;
  return state.items.filter((item) => {
    const hay = (item.vehicle + " " + item.size).toLowerCase();
    return hay.includes(state.adminQ);
  });
}

function renderAdminList() {
  const items = adminItems();
  const noun = items.length === 1 ? "size" : "sizes";
  document.getElementById("admin-count").textContent = `Editing ${items.length} ${noun}`;
  document.getElementById("admin-list").innerHTML = items.map((item) => {
    const label = `${item.vehicle} ${item.size}`;
    return `<div class="admin-row" data-id="${esc(item.id)}">
      <label class="field vehicle"><span>Vehicle</span><input data-field="vehicle" type="text" value="${esc(item.vehicle)}" aria-label="Vehicle for ${esc(label)}"></label>
      <label class="field"><span>Tyre size</span><input data-field="size" type="text" value="${esc(item.size)}" aria-label="Tyre size for ${esc(label)}"></label>
      <label class="field"><span>Price</span><input data-field="price" type="text" value="${esc(item.price)}" aria-label="Price for ${esc(label)}"></label>
      <div class="field qty-field">
        <span>Shop</span>
        <div class="qty">
          <button type="button" class="step" data-place="shop" data-step="-1" aria-label="Decrease shop stock for ${esc(label)}">−</button>
          <input data-field="shop" type="number" min="0" max="9999" step="1" value="${item.shop}" aria-label="Shop quantity for ${esc(label)}">
          <button type="button" class="step" data-place="shop" data-step="1" aria-label="Increase shop stock for ${esc(label)}">+</button>
        </div>
      </div>
      <div class="field qty-field">
        <span>Godown</span>
        <div class="qty">
          <button type="button" class="step" data-place="godown" data-step="-1" aria-label="Decrease godown stock for ${esc(label)}">−</button>
          <input data-field="godown" type="number" min="0" max="9999" step="1" value="${item.godown}" aria-label="Godown quantity for ${esc(label)}">
          <button type="button" class="step" data-place="godown" data-step="1" aria-label="Increase godown stock for ${esc(label)}">+</button>
        </div>
      </div>
      <div class="row-actions">
        <button type="button" class="btn small save">Update</button>
        <button type="button" class="btn small danger delete">Delete</button>
      </div>
    </div>`;
  }).join("");
}

function persist(options) {
  const rerenderAdmin = !options || options.rerenderAdmin !== false;
  const syncSheet = !options || options.sheet !== false;
  renderStats();
  renderFilters();
  renderBoard();
  const dialog = document.getElementById("admin-dialog");
  if (rerenderAdmin && dialog.open && isAuthed()) renderAdminList();
  if (syncSheet) queueSheetPush();
}

function sheetUrl() {
  const saved = (localStorage.getItem(SHEET_URL_KEY) || "").trim();
  return saved || SHEET_URL;
}

function updateSheetStatus(mode) {
  const connected = Boolean(sheetUrl());
  const status = document.getElementById("sheet-status");
  const live = document.getElementById("sheet-live");
  live.hidden = !(connected && state.loaded && !state.sheetError);
  if (!connected) {
    status.textContent = "This page shows only the Google Sheet. Paste the web app link to load stock.";
    return;
  }
  if (state.loading || mode === "loading") status.textContent = "Loading stock from the Google Sheet…";
  else if (mode === "saving") status.textContent = "Saving this list to the Google Sheet…";
  else if (mode === "error" || state.sheetError) status.textContent = "Connected, but the Google Sheet did not respond. Check the web app link.";
  else if (!state.items.length) status.textContent = "Connected. The Google Sheet has no tyre rows yet. Add a size here and it is written to the sheet.";
  else status.textContent = "Connected. The stock on this page is the Google Sheet.";
}

function pullFromSheet() {
  const url = sheetUrl();
  if (!url) return Promise.resolve(false);
  state.loading = true;
  state.sheetError = false;
  persist({ sheet: false });
  updateSheetStatus("loading");
  return new Promise((resolve, reject) => {
    const callback = "umiyaSheet_" + Date.now();
    const script = document.createElement("script");
    let settled = false;
    const finish = (error, items) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      delete window[callback];
      script.remove();
      if (error) {
        reject(error);
        return;
      }
      resolve(items);
    };
    const timer = setTimeout(() => finish(new Error("The sheet took too long")), 12000);
    window[callback] = (data) => {
      if (!Array.isArray(data)) {
        finish(new Error("The sheet did not return a stock list"));
        return;
      }
      finish(null, data);
    };
    script.onerror = () => finish(new Error("The sheet link could not be opened"));
    const join = url.includes("?") ? "&" : "?";
    script.src = url + join + "callback=" + callback;
    document.body.appendChild(script);
  }).then((items) => {
    applySheetItems(items);
    persist({ sheet: false });
    updateSheetStatus("saved");
    return true;
  }).catch((error) => {
    state.loading = false;
    state.loaded = false;
    state.sheetError = true;
    state.items = [];
    persist({ sheet: false });
    updateSheetStatus("error");
    throw error;
  });
}

let sheetTimer;
function queueSheetPush() {
  if (!sheetUrl()) return;
  updateSheetStatus("saving");
  clearTimeout(sheetTimer);
  sheetTimer = setTimeout(() => {
    pushToSheet().catch(() => updateSheetStatus("error"));
  }, 500);
}

function pushToSheet() {
  const url = sheetUrl();
  if (!url) return Promise.resolve(false);
  return new Promise((resolve) => {
    let settled = false;
    const iframe = document.createElement("iframe");
    const frameName = "umiyaSheetPost" + Date.now();
    iframe.name = frameName;
    iframe.hidden = true;
    const form = document.createElement("form");
    form.method = "POST";
    form.action = url;
    form.target = frameName;
    form.acceptCharset = "UTF-8";
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "payload";
    input.value = JSON.stringify({ items: state.items });
    form.appendChild(input);
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      form.remove();
      iframe.remove();
      updateSheetStatus(ok ? "saved" : "error");
      resolve(ok);
    };
    let primed = false;
    iframe.addEventListener("load", () => {
      if (!primed) {
        primed = true;
        form.submit();
        return;
      }
      finish(true);
    });
    document.body.append(iframe, form);
    iframe.src = "about:blank";
    setTimeout(() => finish(false), 10000);
  });
}

function readQty(row, field) {
  const raw = row.querySelector(`[data-field="${field}"]`).value.trim();
  if (!/^\d+$/.test(raw) || Number(raw) > 9999) return null;
  return Number(raw);
}

function readRow(row) {
  const vehicle = row.querySelector('[data-field="vehicle"]').value.trim();
  const size = row.querySelector('[data-field="size"]').value.trim();
  const price = row.querySelector('[data-field="price"]').value.trim();
  const shop = readQty(row, "shop");
  const godown = readQty(row, "godown");
  if (!vehicle || !size || !price || shop === null || godown === null) return null;
  return { vehicle, size, price, shop, godown };
}

function requireSheet() {
  if (sheetUrl()) return true;
  toast("Connect the Google Sheet first. Stock is stored only there.");
  return false;
}

function saveRow(row, id, options) {
  if (!requireSheet()) {
    renderAdminList();
    return false;
  }
  const next = readRow(row);
  if (!next) {
    toast("Enter vehicle, size, price, and shop and godown numbers from 0 to 9999");
    return false;
  }
  const item = state.items.find((entry) => entry.id === id);
  if (!item) return false;
  item.vehicle = next.vehicle;
  item.size = next.size;
  item.price = next.price;
  item.shop = next.shop;
  item.godown = next.godown;
  const announce = !options || options.toast !== false;
  const rerenderAdmin = !options || options.rerenderAdmin !== false;
  persist({ rerenderAdmin });
  if (announce) toast("Stock updated");
  return true;
}

function showAdminState() {
  const authed = isAuthed();
  document.getElementById("login-view").hidden = authed;
  document.getElementById("panel-view").hidden = !authed;
  if (authed) renderAdminList();
  else document.getElementById("password").focus();
}

let toastTimer;
function toast(message) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}

function syncHeaderHeight() {
  const header = document.getElementById("site-header");
  document.documentElement.style.setProperty("--header-h", header.offsetHeight + "px");
}

function setCurrent(id) {
  document.querySelectorAll("[data-nav]").forEach((link) => {
    if (link.dataset.nav === id) link.setAttribute("aria-current", "true");
    else link.removeAttribute("aria-current");
  });
}

function init() {
  localStorage.removeItem("umiya-tyre-stock-v1");
  if (sheetUrl()) state.loading = true;
  renderStats();
  renderFilters();
  renderBoard();
  syncHeaderHeight();

  document.getElementById("brand-filters").addEventListener("click", (event) => {
    const button = event.target.closest("[data-brand]");
    if (!button) return;
    state.brand = button.dataset.brand;
    renderFilters();
    renderBoard();
  });

  const search = document.getElementById("search");
  const clearSearch = document.getElementById("clear-search");
  search.addEventListener("input", () => {
    state.q = search.value.trim().toLowerCase();
    clearSearch.hidden = search.value.length === 0;
    renderBoard();
  });
  clearSearch.addEventListener("click", () => {
    search.value = "";
    state.q = "";
    clearSearch.hidden = true;
    renderBoard();
    search.focus();
  });

  document.getElementById("in-stock-only").addEventListener("change", (event) => {
    state.inStockOnly = event.target.checked;
    renderBoard();
  });

  const dialog = document.getElementById("admin-dialog");
  document.getElementById("open-admin").addEventListener("click", () => {
    if (!dialog.open) dialog.showModal();
    showAdminState();
  });
  document.getElementById("close-admin").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    const rect = dialog.getBoundingClientRect();
    const inside = event.clientX >= rect.left && event.clientX <= rect.right
      && event.clientY >= rect.top && event.clientY <= rect.bottom;
    if (!inside) dialog.close();
  });

  document.getElementById("login-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const entered = document.getElementById("password").value;
    const error = document.getElementById("login-error");
    if (entered !== getPassword()) {
      error.hidden = false;
      return;
    }
    error.hidden = true;
    document.getElementById("password").value = "";
    sessionStorage.setItem(SESSION_KEY, "yes");
    showAdminState();
    toast("Stock desk unlocked");
  });

  document.getElementById("sign-out").addEventListener("click", () => {
    sessionStorage.removeItem(SESSION_KEY);
    showAdminState();
  });

  document.getElementById("add-form").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!requireSheet()) return;
    const vehicle = document.getElementById("add-vehicle").value.trim();
    const size = document.getElementById("add-size").value.trim();
    const price = document.getElementById("add-price").value.trim();
    const shopRaw = document.getElementById("add-shop").value.trim();
    const godownRaw = document.getElementById("add-godown").value.trim();
    if (!vehicle || !size || !price || !/^\d+$/.test(shopRaw) || !/^\d+$/.test(godownRaw)) {
      toast("Enter vehicle, size, price, and shop and godown numbers from 0 to 9999");
      return;
    }
    const shop = Number(shopRaw);
    const godown = Number(godownRaw);
    const existing = state.items.find((item) => sameTyre(item, { vehicle, size }));
    if (existing) {
      existing.shop = Math.min(9999, existing.shop + shop);
      existing.godown = Math.min(9999, existing.godown + godown);
      existing.price = price;
      persist();
      toast("That size is already listed. Shop and godown counts were increased.");
    } else {
      state.items.push({ id: uid(), vehicle, size, price, shop, godown });
      state.adminQ = "";
      document.getElementById("admin-search").value = "";
      persist();
      toast("Tyre added to stock");
    }
    event.target.reset();
    document.getElementById("add-shop").value = "1";
    document.getElementById("add-godown").value = "0";
  });

  document.getElementById("admin-list").addEventListener("click", (event) => {
    const row = event.target.closest(".admin-row");
    if (!row) return;
    const id = row.dataset.id;
    const step = event.target.closest("[data-step]");
    if (step) {
      const input = row.querySelector(`[data-field="${step.dataset.place}"]`);
      const current = /^\d+$/.test(input.value) ? Number(input.value) : 0;
      const next = Math.min(9999, Math.max(0, current + Number(step.dataset.step)));
      input.value = String(next);
      saveRow(row, id, { toast: false, rerenderAdmin: false });
      return;
    }
    if (event.target.closest(".save")) {
      saveRow(row, id);
      return;
    }
    if (event.target.closest(".delete")) {
      if (!requireSheet()) return;
      const button = event.target.closest(".delete");
      document.querySelectorAll(".delete[data-confirm]").forEach((other) => {
        if (other === button) return;
        other.removeAttribute("data-confirm");
        other.textContent = "Delete";
      });
      if (button.dataset.confirm !== "yes") {
        button.dataset.confirm = "yes";
        button.textContent = "Confirm";
        return;
      }
      state.items = state.items.filter((entry) => entry.id !== id);
      persist();
      toast("Tyre removed");
    }
  });

  document.getElementById("admin-search").addEventListener("input", (event) => {
    state.adminQ = event.target.value.trim().toLowerCase();
    renderAdminList();
  });

  document.getElementById("export-stock").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state.items, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "umiya-tyre-stock.json";
    link.click();
    URL.revokeObjectURL(link.href);
  });

  document.getElementById("import-file").addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 1000000) {
      toast("That file is too large");
      return;
    }
    if (!requireSheet()) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!Array.isArray(parsed)) throw new Error("not a list");
        const items = parsed.map(normalize).filter(isUsable);
        if (!items.length) throw new Error("empty");
        state.items = items;
        state.loaded = true;
        state.sheetError = false;
        persist();
        toast("Backup sent to the Google Sheet");
      } catch {
        toast("That file is not a Umiya stock backup");
      }
    };
    reader.readAsText(file);
  });

  const sheetInput = document.getElementById("sheet-url");
  sheetInput.value = sheetUrl();
  updateSheetStatus();
  document.getElementById("sheet-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const url = sheetInput.value.trim();
    if (url && !/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec\/?$/.test(url)) {
      toast("Paste the web app link that ends in /exec");
      return;
    }
    if (url) localStorage.setItem(SHEET_URL_KEY, url.replace(/\/$/, ""));
    else localStorage.removeItem(SHEET_URL_KEY);
    updateSheetStatus();
    if (!url) {
      state.items = [];
      state.loaded = false;
      state.loading = false;
      state.sheetError = false;
      persist({ sheet: false });
      updateSheetStatus();
      toast("Google Sheet disconnected");
      return;
    }
    pullFromSheet()
      .then((loaded) => {
        if (loaded) toast("Connected. Stock loaded from the Google Sheet.");
      })
      .catch(() => toast("That link did not return the stock list"));
  });
  document.getElementById("sheet-pull").addEventListener("click", () => {
    if (!sheetUrl()) {
      toast("Connect a Google Sheet first");
      return;
    }
    pullFromSheet()
      .then((loaded) => {
        if (loaded) toast("Stock reloaded from the Google Sheet");
      })
      .catch(() => toast("Could not reload the Google Sheet"));
  });
  document.getElementById("sheet-push").addEventListener("click", () => {
    if (!sheetUrl()) {
      toast("Connect a Google Sheet first");
      return;
    }
    pushToSheet().then((ok) => {
      toast(ok ? "This list was sent to the Google Sheet" : "The sheet did not confirm the save");
    });
  });
  if (sheetUrl()) {
    pullFromSheet().catch(() => toast("Could not load the Google Sheet."));
  }

  document.getElementById("password-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const next = document.getElementById("new-password").value;
    if (next.trim().length < 4) {
      toast("Use at least 4 characters");
      return;
    }
    localStorage.setItem(PASSWORD_KEY, next);
    event.target.reset();
    toast("Password changed for this browser");
  });

  const header = document.getElementById("site-header");
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", syncHeaderHeight);

  const observed = ["stock", "about", "services"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setCurrent(entry.target.id);
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0.01 });
    observed.forEach((section) => observer.observe(section));
  }
}

init();
