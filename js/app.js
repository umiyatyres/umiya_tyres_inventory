const STORAGE_KEY = "umiya-tyre-stock-v1";
const PASSWORD_KEY = "umiya-admin-password";
const SESSION_KEY = "umiya-admin";
const DEFAULT_PASSWORD = "umiya";

const SEED = [
  ["brezza-205-60-r16", "Maruti Brezza", "205/60 R16", "₹2,500", 8],
  ["ertiga-185-65-r15", "Maruti Ertiga", "185/65 R15", "₹2,300–₹2,500", 6],
  ["nios-175-60-r15", "Hyundai Grand i10 Nios", "175/60 R15", "₹2,300–₹2,500", 5],
  ["i20-195-55-r16", "Hyundai i20", "195/55 R16", "₹2,500", 7],
  ["venue-215-60-r16", "Hyundai Venue", "215/60 R16", "₹2,500", 4],
  ["creta-205-65-r16", "Hyundai Creta", "205/65 R16", "₹2,500", 9],
  ["creta-215-60-r17", "Hyundai Creta", "215/60 R17", "₹3,000–₹3,500", 3],
  ["sonet-215-60-r16", "Kia Sonet", "215/60 R16", "₹2,500", 6],
  ["seltos-215-60-r17", "Kia Seltos", "215/60 R17", "₹3,000–₹3,500", 2],
  ["punch-195-60-r16", "Tata Punch", "195/60 R16", "₹2,500", 10],
  ["nexon-215-60-r16", "Tata Nexon", "215/60 R16", "₹2,500", 5],
  ["xuv300-215-55-r17", "Mahindra XUV300", "215/55 R17", "₹3,000–₹3,500", 4],
  ["xuv700-235-65-r17", "Mahindra XUV700", "235/65 R17", "₹3,000–₹3,500", 3],
  ["xuv700-235-60-r18", "Mahindra XUV700", "235/60 R18", "₹4,000–₹5,000", 2],
  ["scorpio-245-65-r17", "Mahindra Scorpio-N", "245/65 R17", "₹3,000–₹3,500", 4],
  ["scorpio-255-60-r18", "Mahindra Scorpio-N", "255/60 R18", "₹4,000–₹5,000", 1],
  ["innova-205-65-r16", "Toyota Innova Crysta", "205/65 R16", "₹2,500", 7],
  ["hyryder-215-60-r17", "Toyota Hyryder", "215/60 R17", "₹3,000–₹3,500", 5],
  ["city-185-55-r16", "Honda City", "185/55 R16", "₹2,500", 6],
  ["amaze-175-65-r15", "Honda Amaze", "175/65 R15", "₹2,300–₹2,500", 8],
  ["hector-215-60-r17", "MG Hector", "215/60 R17", "₹3,000–₹3,500", 3],
  ["hector-215-55-r18", "MG Hector", "215/55 R18", "₹4,000–₹5,000", 2],
  ["cclass-225-50-r17", "Mercedes-Benz C-Class", "225/50 R17", "₹3,000–₹3,500", 2],
  ["cclass-225-45-r18", "Mercedes-Benz C-Class", "225/45 R18", "₹4,000–₹5,000", 1],
  ["eclass-245-45-r18", "Mercedes-Benz E-Class", "245/45 R18", "₹4,000–₹5,000", 2],
  ["bmw3-225-45-r18", "BMW 3 Series", "225/45 R18", "₹4,000–₹5,000", 3],
  ["bmw3-255-40-r18", "BMW 3 Series", "255/40 R18", "₹4,000–₹5,000", 1],
  ["bmw5-245-45-r18", "BMW 5 Series", "245/45 R18", "₹4,000–₹5,000", 2],
  ["bmw5-275-40-r18", "BMW 5 Series", "275/40 R18", "₹4,000–₹5,000", 0],
  ["a4-245-40-r18", "Audi A4", "245/40 R18", "₹4,000–₹5,000", 2],
  ["q3-235-55-r18", "Audi Q3", "235/55 R18", "₹4,000–₹5,000", 3],
  ["q5-235-60-r18", "Audi Q5", "235/60 R18", "₹4,000–₹5,000", 2],
  ["q5-255-45-r20", "Audi Q5", "255/45 R20", "₹6,000", 1],
  ["x1-225-55-r18", "BMW X1", "225/55 R18", "₹4,000–₹5,000", 4],
  ["glc-235-60-r18", "Mercedes GLC", "235/60 R18", "₹4,000–₹5,000", 2],
  ["glc-255-45-r20", "Mercedes GLC", "255/45 R20", "₹6,000", 1],
  ["fortuner-265-65-r17", "Toyota Fortuner", "265/65 R17", "₹3,000–₹3,500", 3],
  ["fortuner-265-60-r18", "Toyota Fortuner", "265/60 R18", "₹4,000–₹5,000", 2],
  ["defender-255-60-r20", "Land Rover Defender", "255/60 R20", "₹6,000", 1],
  ["defender-255-55-r21", "Land Rover Defender", "255/55 R21", "Price on Request", 0]
].map(([id, vehicle, size, price, stock]) => ({ id, vehicle, size, price, stock }));

const state = {
  items: loadStock(),
  brand: "all",
  q: "",
  inStockOnly: false,
  adminQ: ""
};

function cloneSeed() {
  return SEED.map((item) => ({ ...item }));
}

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

function normalize(item) {
  const stock = Math.floor(Number(item.stock));
  return {
    id: String(item.id || uid()),
    vehicle: String(item.vehicle || "").trim(),
    size: String(item.size || "").trim(),
    price: String(item.price || "").trim(),
    stock: Number.isFinite(stock) ? Math.max(0, stock) : 0
  };
}

function isUsable(item) {
  return Boolean(item.vehicle && item.size && item.price);
}

function loadStock() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return cloneSeed();
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return cloneSeed();
    return parsed.map(normalize).filter(isUsable);
  } catch {
    return cloneSeed();
  }
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
    if (state.inStockOnly && item.stock <= 0) return false;
    if (!state.q) return true;
    const hay = (item.vehicle + " " + item.size + " " + item.price).toLowerCase();
    return hay.includes(state.q);
  });
}

function renderStats() {
  const available = state.items.filter((item) => item.stock > 0).length;
  const units = state.items.reduce((sum, item) => sum + item.stock, 0);
  document.getElementById("stat-sizes").textContent = String(state.items.length);
  document.getElementById("stat-available").textContent = String(available);
  document.getElementById("stat-units").textContent = String(units);
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

function renderBoard() {
  const items = visibleItems();
  const noun = items.length === 1 ? "size" : "sizes";
  document.getElementById("result-count").textContent = `Showing ${items.length} ${noun}`;
  const board = document.getElementById("board");
  if (!items.length) {
    board.innerHTML = '<p class="empty">No tyres match that search.</p>';
    return;
  }
  board.innerHTML = items.map((item) => {
    const status = availability(item.stock);
    return `<article class="tyre ${status.key}">
      <p class="vehicle">${esc(item.vehicle)}</p>
      <p class="size"><span class="k">Tyre size</span><span class="size-val">${esc(item.size)}</span></p>
      <p class="price"><span class="k">Price</span><span class="price-val">${esc(item.price)}</span></p>
      <p class="avail"><span class="badge ${status.key}">${status.label}</span></p>
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
        <span>Qty</span>
        <div class="qty">
          <button type="button" class="step" data-step="-1" aria-label="Decrease stock for ${esc(label)}">−</button>
          <input data-field="stock" type="number" min="0" max="9999" step="1" value="${item.stock}" aria-label="Stock quantity for ${esc(label)}">
          <button type="button" class="step" data-step="1" aria-label="Increase stock for ${esc(label)}">+</button>
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
  renderStats();
  renderFilters();
  renderBoard();
  const dialog = document.getElementById("admin-dialog");
  if (rerenderAdmin && dialog.open && isAuthed()) renderAdminList();
}

function readRow(row) {
  const vehicle = row.querySelector('[data-field="vehicle"]').value.trim();
  const size = row.querySelector('[data-field="size"]').value.trim();
  const price = row.querySelector('[data-field="price"]').value.trim();
  const stockRaw = row.querySelector('[data-field="stock"]').value.trim();
  if (!vehicle || !size || !price || !/^\d+$/.test(stockRaw)) return null;
  return { vehicle, size, price, stock: Number(stockRaw) };
}

function saveRow(row, id, options) {
  const next = readRow(row);
  if (!next || next.stock > 9999) {
    toast("Enter vehicle, size, price, and a stock number from 0 to 9999");
    return false;
  }
  const item = state.items.find((entry) => entry.id === id);
  if (!item) return false;
  item.vehicle = next.vehicle;
  item.size = next.size;
  item.price = next.price;
  item.stock = next.stock;
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
    const vehicle = document.getElementById("add-vehicle").value.trim();
    const size = document.getElementById("add-size").value.trim();
    const price = document.getElementById("add-price").value.trim();
    const stockRaw = document.getElementById("add-stock").value.trim();
    if (!vehicle || !size || !price || !/^\d+$/.test(stockRaw)) {
      toast("Enter vehicle, size, price, and a stock number from 0 to 9999");
      return;
    }
    const stock = Number(stockRaw);
    const existing = state.items.find((item) => sameTyre(item, { vehicle, size }));
    if (existing) {
      existing.stock = Math.min(9999, existing.stock + stock);
      existing.price = price;
      persist();
      toast("That size is already listed. Stock increased and price updated.");
    } else {
      state.items.push({ id: uid(), vehicle, size, price, stock });
      state.adminQ = "";
      document.getElementById("admin-search").value = "";
      persist();
      toast("Tyre added to stock");
    }
    event.target.reset();
    document.getElementById("add-stock").value = "1";
  });

  document.getElementById("admin-list").addEventListener("click", (event) => {
    const row = event.target.closest(".admin-row");
    if (!row) return;
    const id = row.dataset.id;
    const step = event.target.closest("[data-step]");
    if (step) {
      const input = row.querySelector('[data-field="stock"]');
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
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!Array.isArray(parsed)) throw new Error("not a list");
        const items = parsed.map(normalize).filter(isUsable);
        if (!items.length) throw new Error("empty");
        state.items = items;
        persist();
        toast("Backup restored");
      } catch {
        toast("That file is not a Umiya stock backup");
      }
    };
    reader.readAsText(file);
  });

  const resetButton = document.getElementById("reset-stock");
  resetButton.addEventListener("click", () => {
    if (resetButton.dataset.confirm !== "yes") {
      resetButton.dataset.confirm = "yes";
      resetButton.textContent = "Confirm restore";
      return;
    }
    resetButton.removeAttribute("data-confirm");
    resetButton.textContent = "Restore samples";
    state.items = cloneSeed();
    persist();
    toast("Sample stock restored");
  });

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
