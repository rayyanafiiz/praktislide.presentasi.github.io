
// ============================================
// PRAKTISLIDE.PRESENTASI
// Versi awal dengan penyimpanan IndexedDB
// ============================================

// DATABASE LOKAL

const DB_NAME = "PraktislideDatabase";
const DB_VERSION = 1;
let db;

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      ["backgrounds", "elements", "fonts", "projects"].forEach(name => {
        if (!database.objectStoreNames.contains(name)) {
          database.createObjectStore(name, { keyPath: "id" });
        }
      });
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onerror = () => reject(request.error);
  });
}

function dbAction(store, mode, action) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const objectStore = tx.objectStore(store);
    const request = action(objectStore);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

const getAll = store => dbAction(store, "readonly", s => s.getAll());
const getOne = (store, id) => dbAction(store, "readonly", s => s.get(id));
const putOne = (store, data) => dbAction(store, "readwrite", s => s.put(data));
const deleteOne = (store, id) => dbAction(store, "readwrite", s => s.delete(id));

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  })[c]);
}

function notify(message) {
  alert(message);
}

// ============================================
// DATA BAWAAN
// ============================================

function decorativeCorner(kind, position) {
  const palettes = {
    ice: ["#8ED8F2", "#D9F5FF", "#5BA6D2"],
    desert: ["#D8A45D", "#F4D7A1", "#B9793D"],
    forest: ["#7BAA79", "#D4E8C8", "#386B4B"]
  };
  const [a,b,c] = palettes[kind] || palettes.ice;
  const rotate = ({tl:0,tr:90,br:180,bl:270})[position] || 0;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><g transform="rotate(${rotate} 200 200)"><path d="M0 0H400V38C250 55 140 120 38 400H0Z" fill="${a}" opacity=".82"/><path d="M0 0H300C180 45 90 125 0 300Z" fill="${b}" opacity=".9"/><path d="M0 0L180 0L0 180Z" fill="${c}" opacity=".72"/><path d="M20 20Q160 65 65 205" fill="none" stroke="#FFFFFF" stroke-width="8" opacity=".7"/><circle cx="82" cy="82" r="13" fill="#FFFFFF" opacity=".8"/></g></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
function makeElementPack(id,name,kind) {
  return {id,name,corners:Object.fromEntries(["tl","tr","bl","br"].map(pos=>[pos,decorativeCorner(kind,pos)]))};
}
const defaultBackgrounds = [
  {id:"bg-white",name:"Putih Bersih",color:"#FFFFFF"},
  {id:"bg-cream",name:"Cream",color:"#F2EADF"},
  {id:"bg-blue-white",name:"Putih Kebiruan",color:"#EEF5FB"},
  {id:"bg-gold-white",name:"Putih Keemasan",color:"#FBF5E8"},
  {id:"bg-green-white",name:"Putih Kehijauan",color:"#EFF6EE"},
  {id:"bg-red",name:"Soft Red",color:"#F8E7E7"},
  {id:"bg-dark",name:"Dark",color:"#242424"}
];
const defaultElements = [
  {id:"el-none",name:"Tanpa Elemen",corners:{}},
  makeElementPack("el-ice","Ice","ice"),
  makeElementPack("el-desert","Desert","desert"),
  makeElementPack("el-forest","Forest","forest"),
  {id:"el-red",name:"Merah Minimalis",corners:{}}
];
const defaultFonts = [
  {id:"font-modern",name:"Modern",heading:"Plus Jakarta Sans",subheading:"DM Sans",body:"DM Sans"},
  {id:"font-classic",name:"Klasik",heading:"Playfair Display",subheading:"Lora",body:"Lora"},
  {id:"font-clean",name:"Bersih",heading:"Montserrat",subheading:"Montserrat",body:"Montserrat"},
  {id:"font-rounded",name:"Rounded",heading:"Poppins",subheading:"Poppins",body:"Poppins"},
  {id:"font-tech",name:"Tech",heading:"Space Grotesk",subheading:"DM Sans",body:"DM Sans"},
  {id:"font-editorial",name:"Editorial",heading:"Lora",subheading:"Playfair Display",body:"Lora"},
  {id:"font-outfit",name:"Outfit",heading:"Outfit",subheading:"Outfit",body:"Outfit"}
];

const defaultLayouts = [
  { id: "left", name: "Teks Rata Kiri", description: "Teks berada di kiri", icon: "≡" },
  { id: "center", name: "Teks Rata Tengah", description: "Teks berada di tengah", icon: "☰" },
  { id: "right", name: "Teks Rata Kanan", description: "Teks berada di kanan", icon: "≡" },
  { id: "points-number", name: "Poin Angka", description: "Daftar bernomor", icon: "1." },
  { id: "points-bullet", name: "Poin Titik", description: "Daftar bertitik", icon: "•" },
  { id: "points-dash", name: "Poin Strip", description: "Daftar dengan strip", icon: "–" },
  { id: "picture-left", name: "Gambar Kiri", description: "Gambar kiri dan teks kanan", icon: "▧" },
  { id: "picture-right", name: "Gambar Kanan", description: "Teks kiri dan gambar kanan", icon: "▨" },
  { id: "columns", name: "Dua Kolom", description: "Materi dibagi menjadi dua", icon: "▦", columns: 2 },
  { id: "columns3", name: "Tiga Kolom", description: "Materi dibagi menjadi tiga", icon: "▦", columns: 3 },
  { id: "columns4", name: "Empat Kolom", description: "Materi dibagi menjadi empat", icon: "▦", columns: 4 }
];

// ============================================
// STATUS APLIKASI
// ============================================

let selectedBackground = defaultBackgrounds[0];
let selectedElement = defaultElements[0];
let selectedFont = defaultFonts[0];
let selectedLayout = defaultLayouts[0];

let currentStep = 0;
let activeSlide = 0;
let previewIndex = 0;
let slides = [];
let currentProjectId = null;
let projectTitle = "Presentasi Baru";

let managerTab = "backgrounds";
let selectedPicture = null;
let slideshowIndex = 0;

// Riwayat perubahan untuk fitur Urungkan / Ulangi.
let undoStack = [];
let redoStack = [];
let historyRestoring = false;
const HISTORY_LIMIT = 60;

function cloneState(value) {
  return JSON.parse(JSON.stringify(value));
}

function captureAppState() {
  return cloneState({
    selectedBackground, selectedElement, selectedFont, selectedLayout,
    currentStep, activeSlide, previewIndex, slides, currentProjectId, projectTitle
  });
}

function updateHistoryButtons() {
  const undoEnabled = undoStack.length > 0;
  const redoEnabled = redoStack.length > 0;
  ["undoButton", "undoButtonPreview", "undoButtonBuilder"].forEach(id => {
    const button = document.getElementById(id);
    if (button) button.disabled = !undoEnabled;
  });
  ["redoButton", "redoButtonPreview", "redoButtonBuilder"].forEach(id => {
    const button = document.getElementById(id);
    if (button) button.disabled = !redoEnabled;
  });
}

function recordUndoState() {
  if (historyRestoring) return;
  undoStack.push(captureAppState());
  if (undoStack.length > HISTORY_LIMIT) undoStack.shift();
  redoStack = [];
  updateHistoryButtons();
}

async function restoreAppState(state) {
  historyRestoring = true;
  try {
  selectedBackground = state.selectedBackground || defaultBackgrounds[0];
  selectedElement = state.selectedElement || defaultElements[0];
  selectedFont = state.selectedFont || defaultFonts[0];
  selectedLayout = state.selectedLayout || defaultLayouts[0];
  currentStep = state.currentStep ?? 0;
  activeSlide = state.activeSlide ?? 0;
  previewIndex = state.previewIndex ?? 0;
  slides = state.slides || [];
  currentProjectId = state.currentProjectId || null;
  projectTitle = state.projectTitle || "Presentasi Baru";
  activeSlide = Math.max(0, Math.min(activeSlide, Math.max(0, slides.length - 1)));
  previewIndex = Math.max(0, Math.min(previewIndex, Math.max(0, slides.length - 1)));

  await activateFont(selectedFont);
  const activePage = document.querySelector(".page.active")?.id;
  if (activePage === "builder") await renderWizard();
  if (activePage === "editor" && slides.length) {
    document.getElementById("projectTitle").value = projectTitle;
    renderSlideEditor();
  }
  if (activePage === "preview" && slides.length) {
    document.getElementById("previewTitle").textContent = projectTitle;
    renderPreview();
  }
  } finally {
    historyRestoring = false;
    updateHistoryButtons();
  }
}

async function undoAction() {
  if (!undoStack.length) return;
  redoStack.push(captureAppState());
  const previous = undoStack.pop();
  await restoreAppState(previous);
}

async function redoAction() {
  if (!redoStack.length) return;
  undoStack.push(captureAppState());
  const next = redoStack.pop();
  await restoreAppState(next);
}

// Simpan satu titik riwayat saat pengguna mulai mengedit kolom teks.
document.addEventListener("focusin", event => {
  if (event.target.matches("#slideTitle, #slideSubtitle, #slideBody, #pointStyle, #projectTitle")) {
    recordUndoState();
  }
}, true);

document.addEventListener("input", event => {
  if (event.target?.id === "projectTitle") projectTitle = event.target.value;
});

// ============================================
// NAVIGASI
// ============================================

function showPage(id) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  document.getElementById(id).classList.add("active");
  window.scrollTo(0, 0);
}

function goHome() {
  renderHome();
  showPage("home");
}

function showHistory() {
  renderHistory();
  showPage("history");
}

function showPackages(tab = "backgrounds") {
  managerTab = tab;
  showPage("packages");
  renderPackageManager();
}

function startNew() {
  currentProjectId = null;
  projectTitle = "Presentasi Baru";

  selectedBackground = defaultBackgrounds[0];
  selectedElement = defaultElements[0];
  selectedFont = defaultFonts[0];
  selectedLayout = defaultLayouts[0];

  slides = [];
  undoStack = [];
  redoStack = [];
  updateHistoryButtons();

  activeSlide = 0;
  currentStep = 0;

  renderWizard();
  showPage("builder");
}

// ============================================
// GAMBAR DAN BACKGROUND
// ============================================

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

// Memotong gambar ke rasio 16:9

async function cropBackground(file) {
  const src = await readFile(file);
  const image = await loadImage(src);

  const canvas = document.createElement("canvas");
  canvas.width = 1920;
  canvas.height = 1080;

  const ctx = canvas.getContext("2d");

  const scale = Math.max(
    canvas.width / image.width,
    canvas.height / image.height
  );

  const width = image.width * scale;
  const height = image.height * scale;

  ctx.drawImage(
    image,
    (canvas.width - width) / 2,
    (canvas.height - height) / 2,
    width,
    height
  );

  return canvas.toDataURL("image/jpeg", 0.88);
}

async function compressSquare(file) {
  const src = await readFile(file);
  const image = await loadImage(src);

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;

  const ctx = canvas.getContext("2d");
  const size = Math.min(image.width, image.height);

  ctx.drawImage(
    image,
    (image.width - size) / 2,
    (image.height - size) / 2,
    size,
    size,
    0,
    0,
    512,
    512
  );

  return canvas.toDataURL("image/png");
}

// ============================================
// RENDER PILIHAN PAKET
// ============================================

function packageCard(item, selected, category, visual) {
  return `
    <button class="package-card ${selected ? "selected" : ""}"
      data-category="${category}"
      data-id="${escapeHTML(item.id)}">
      ${visual}
      <h3>${escapeHTML(item.name)}</h3>
      <p>${selected ? "✓ Terpilih" : "Pilih paket"}</p>
    </button>
  `;
}



// Kontrol file seragam: nama file dan tombol batal/hapus.
function setupFileControls(root = document) {
  root.querySelectorAll('input[type="file"]').forEach(input => {
    if (input.dataset.fileControlReady) return;
    input.dataset.fileControlReady = "true";
    const control = document.createElement("div");
    control.className = "file-control";
    const name = document.createElement("span");
    name.className = "file-name";
    name.textContent = "Belum ada file dipilih";
    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "file-clear";
    clear.textContent = "Batal / Hapus";
    clear.hidden = true;
    control.append(name, clear);
    input.insertAdjacentElement("afterend", control);
    const refresh = () => {
      const file = input.files && input.files[0];
      name.textContent = file ? file.name : "Belum ada file dipilih";
      clear.hidden = !file;
    };
    input.addEventListener("change", refresh);
    clear.addEventListener("click", () => {
      input.value = "";
      input.dispatchEvent(new Event("change", { bubbles: true }));
      if (input.id === "slideImage" && slides[activeSlide]) {
        slides[activeSlide].image = null;
        renderSlideEditor();
      }
    });
    refresh();
  });
}

async function renderWizard() {
  document.querySelectorAll(".wizard").forEach((panel, index) => {
    panel.classList.toggle("active", index === currentStep);
  });

  document.querySelectorAll(".steps:not(.editor-steps) .step").forEach((step, index) => {
    step.classList.toggle("active", index === currentStep);
  });

  document.getElementById("prevStep").hidden = currentStep === 0;

  document.getElementById("nextStep").textContent =
    currentStep === 3 ? "Isi Materi →" : "Selanjutnya →";

  await renderBackgrounds();
  await renderElements();
  await renderFonts();
  renderLayouts();
}

async function renderBackgrounds() {
  const custom = await getAll("backgrounds");
  const all = [...defaultBackgrounds, ...custom];

  document.getElementById("backgroundPackages").innerHTML = all.map(item => {
    const visual = item.image
      ? `<img class="package-image" src="${item.image}">`
      : `<div class="color-sample" style="background:${item.color};color:${item.color === "#242424" ? "white" : "#333"}">Aa</div>`;

    return packageCard(
      item,
      selectedBackground.id === item.id,
      "background",
      visual
    );
  }).join("");
}

async function renderElements() {
  const custom = await getAll("elements");
  const all = [...defaultElements, ...custom];

  document.getElementById("elementPackages").innerHTML = all.map(item => {
    const visual = item.corners?.tr
      ? `<img class="package-image" src="${item.corners.tr}">`
      : `<div class="color-sample">✦</div>`;

    return packageCard(item, selectedElement.id === item.id, "element", visual);
  }).join("");
}

async function renderFonts() {
  const custom = await getAll("fonts");
  const all = [...defaultFonts, ...custom];

  document.getElementById("fontPackages").innerHTML = all.map(item => `
    ${packageCard(
      item,
      selectedFont.id === item.id,
      "font",
      `<div class="color-sample" style="font-family:${escapeHTML(item.heading)}">Aa</div>`
    )}
  `).join("");
}

function renderLayouts() {
  const picker = document.getElementById("layoutPackages");
  picker.innerHTML = defaultLayouts.map(item => `
    <button type="button" class="package-card layout-choice" onclick="addSlidesWithLayout('${item.id}')">
      <div class="layout-art ${item.id.startsWith("columns") ? "columns" : item.id.startsWith("picture") ? "picture" : item.id.startsWith("points") ? "points" : item.id}"><b></b><i></i><i></i></div>
      <h3>${item.icon} ${escapeHTML(item.name)}</h3>
      <p>${escapeHTML(item.description)}</p>
      <span class="add-hint">＋ Klik untuk menambahkan</span>
    </button>
  `).join("");
  renderLayoutRail();
}

function addSlidesWithLayout(layoutId) {
  recordUndoState();
  const layout = defaultLayouts.find(item => item.id === layoutId);
  if (!layout) return;
  slides.push({
    title: layout.name, subtitle: "", body: "", image: null, layout: layoutId,
    pointStyle: layoutId === "points-number" ? "number" : layoutId === "points-dash" ? "dash" : "bullet"
  });
  renderLayoutRail();
}

function renderLayoutRail() {
  const rail = document.getElementById("layoutRail");
  const count = document.getElementById("railCount");
  if (!rail || !count) return;
  count.textContent = `${slides.length} slide`;
  if (!slides.length) {
    rail.innerHTML = '<div class="rail-empty">Rel masih kosong. Klik pilihan gerbong di atas untuk mulai menyusun.</div>';
    return;
  }
  rail.innerHTML = slides.map((slide, index) => {
    const layout = defaultLayouts.find(item => item.id === slide.layout) || defaultLayouts[0];
    return `
      <div class="rail-car" draggable="true" data-rail-index="${index}">
        <div class="rail-car-icon">${layout.icon}</div>
        <strong>${index + 1}. ${escapeHTML(layout.name)}</strong>
        <small>Gerbong slide</small>
        <div class="rail-car-actions">
          <button type="button" onclick="moveRailCar(${index},-1)" ${index === 0 ? "disabled" : ""}>←</button>
          <button type="button" onclick="moveRailCar(${index},1)" ${index === slides.length - 1 ? "disabled" : ""}>→</button>
          <button type="button" class="remove-car" onclick="removeRailCar(${index})">Hapus</button>
        </div>
      </div>`;
  }).join("");
  bindRailDragDrop();
}

function moveRailCar(index, direction) {
  const target = index + direction;
  if (target < 0 || target >= slides.length) return;
  recordUndoState();
  [slides[index], slides[target]] = [slides[target], slides[index]];
  renderLayoutRail();
}

function removeRailCar(index) {
  recordUndoState();
  slides.splice(index, 1);
  renderLayoutRail();
}

function bindRailDragDrop() {
  const rail = document.getElementById("layoutRail");
  let draggedIndex = null;
  rail.querySelectorAll(".rail-car").forEach(car => {
    car.addEventListener("dragstart", event => {
      draggedIndex = Number(car.dataset.railIndex);
      event.dataTransfer.effectAllowed = "move";
      car.classList.add("dragging");
    });
    car.addEventListener("dragend", () => car.classList.remove("dragging"));
    car.addEventListener("dragover", event => event.preventDefault());
    car.addEventListener("drop", event => {
      event.preventDefault();
      const target = Number(car.dataset.railIndex);
      if (draggedIndex === null || draggedIndex === target) return;
      recordUndoState();
      const [moved] = slides.splice(draggedIndex, 1);
      slides.splice(target, 0, moved);
      renderLayoutRail();
    });
  });
}


// ============================================
// MEMILIH PAKET
// ============================================

document.addEventListener("click", async event => {
  const button = event.target.closest("[data-category]");
  if (!button) return;

  recordUndoState();
  const id = button.dataset.id;
  const category = button.dataset.category;

  if (category === "background") {
    selectedBackground =
      defaultBackgrounds.find(x => x.id === id) ||
      await getOne("backgrounds", id);
  }

  if (category === "element") {
    selectedElement =
      defaultElements.find(x => x.id === id) ||
      await getOne("elements", id);
  }

  if (category === "font") {
    selectedFont =
      defaultFonts.find(x => x.id === id) ||
      await getOne("fonts", id);

    await activateFont(selectedFont);
  }

  renderWizard();
});

// ============================================
// FONT KHUSUS
// ============================================

async function activateFont(font) {
  if (!font) return;

  for (const key of ["heading", "subheading", "body"]) {
    const data = font[key + "Data"];
    if (!data) continue;

    const family = font[key] || font.name;

    try {
      const face = new FontFace(family, `url(${data})`);
      await face.load();
      document.fonts.add(face);
    } catch (error) {
      console.warn("Font tidak berhasil dimuat:", family);
    }
  }
}

// ============================================
// NAVIGASI LANGKAH
// ============================================


async function changeStep(direction) {
  if (direction === 1 && currentStep === 3) {
    if (!slides.length) return notify("Tambahkan minimal satu slide pada langkah Susunan.");
    openEditor();
    return;
  }

  const next = currentStep + direction;

  if (next < 0 || next > 3) return;

  currentStep = next;

  await renderWizard();
  window.scrollTo(0, 0);
}


// ============================================
// UPLOAD BACKGROUND
// ============================================

document.getElementById("backgroundUpload").addEventListener("change", async event => {
  const file = event.target.files[0];
  if (!file) return;
  recordUndoState();

  if (!file.type.startsWith("image/")) {
    notify("Pilih file gambar.");
    return;
  }

  try {
    const image = await cropBackground(file);
    const item = {
      id: makeId(),
      name: file.name.replace(/\.[^/.]+$/, ""),
      image,
      created: Date.now()
    };

    await putOne("backgrounds", item);
    selectedBackground = item;

    await renderWizard();
    notify("Background berhasil diunggah.");
  } catch (error) {
    notify("Gambar gagal diproses. Coba gambar yang lebih kecil.");
  }

});

// ============================================
// PENGELOLAAN PAKET SENDIRI
// ============================================

function selectPackageTab(tab, button) {
  managerTab = tab;

  document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
  button.classList.add("active");

  renderPackageManager();
}

async function renderPackageManager() {
  const container = document.getElementById("packageManager");

  if (managerTab === "backgrounds") {
    container.innerHTML = `
      <div class="manager-form">
        <h3>Tambah background</h3>
        <label>Nama paket</label>
        <input id="newBackgroundName" placeholder="Contoh: Sunset">
        <label>Gambar background (16:9)</label>
        <input id="newBackgroundFile" type="file" accept="image/*">
        <button class="primary" onclick="createBackground()">Simpan background</button>
      </div>
    `;
  }

  if (managerTab === "elements") {
    container.innerHTML = `
      <div class="manager-form">
        <h3>Tambah paket elemen</h3>
        <p>Unggah PNG persegi untuk masing-masing sudut. Kosongkan posisi yang tidak digunakan.</p>
        <label>Nama paket</label>
        <input id="newElementName" placeholder="Contoh: Floral">
        ${["tl","tr","bl","br"].map((position,index) => `
          <label>${["Kiri atas","Kanan atas","Kiri bawah","Kanan bawah"][index]}</label>
          <input type="file" id="element-${position}" accept="image/*">
        `).join("")}
        <button class="primary" onclick="createElementPackage()">Simpan elemen</button>
      </div>
    `;
  }

  if (managerTab === "fonts") {
    container.innerHTML = `
      <div class="manager-form">
        <h3>Tambah paket font</h3>
        <label>Nama paket</label>
        <input id="newFontName" placeholder="Contoh: Elegant">
        <label>Font judul</label>
        <input id="fontHeading" type="file" accept=".ttf,.otf,.woff,.woff2">
        <label>Font subjudul</label>
        <input id="fontSubheading" type="file" accept=".ttf,.otf,.woff,.woff2">
        <label>Font isi</label>
        <input id="fontBody" type="file" accept=".ttf,.otf,.woff,.woff2">
        <button class="primary" onclick="createFontPackage()">Simpan paket font</button>
      </div>
    `;
  }

  const items = await getAll(managerTab);

  container.innerHTML += `
    <h3 style="margin:20px 0 12px">Paket tersimpan</h3>
    ${items.length ? items.map(item => `
      <div class="manager-card">
        <div>
          <strong>${escapeHTML(item.name)}</strong>
          <p>${escapeHTML(managerTab)}</p>
        </div>
        <button class="danger" onclick="removePackage('${item.id}')">Hapus</button>
      </div>
    `).join("") : '<div class="empty-state">Belum ada paket buatan sendiri.</div>'}
  `;
  setupFileControls(container);
}

async function createBackground() {
  const name = document.getElementById("newBackgroundName").value.trim();
  const file = document.getElementById("newBackgroundFile").files[0];

  if (!name || !file) return notify("Isi nama dan pilih gambar.");

  try {
    const image = await cropBackground(file);
    await putOne("backgrounds", { id: makeId(), name, image });
    notify("Background berhasil disimpan.");
    renderPackageManager();
  } catch (error) {
    notify("Gagal menyimpan gambar.");
  }
}

async function createElementPackage() {
  const name = document.getElementById("newElementName").value.trim();
  if (!name) return notify("Masukkan nama paket.");

  const corners = {};

  try {
    for (const position of ["tl","tr","bl","br"]) {
      const file = document.getElementById("element-" + position).files[0];

      if (file) {
        corners[position] = await compressSquare(file);
      }
    }

    if (!Object.keys(corners).length) {
      return notify("Unggah minimal satu gambar elemen.");
    }

    await putOne("elements", { id: makeId(), name, corners });
    notify("Paket elemen berhasil disimpan.");
    renderPackageManager();
  } catch (error) {
    notify("Gagal menyimpan elemen.");
  }
}

async function createFontPackage() {
  const name = document.getElementById("newFontName").value.trim();
  if (!name) return notify("Masukkan nama paket.");

  const files = {
    heading: document.getElementById("fontHeading").files[0],
    subheading: document.getElementById("fontSubheading").files[0],
    body: document.getElementById("fontBody").files[0]
  };

  if (!files.heading || !files.subheading || !files.body) {
    return notify("Pilih ketiga file font.");
  }

  try {
    const packageData = {
      id: makeId(),
      name,
      heading: name + " Heading",
      subheading: name + " Subheading",
      body: name + " Body"
    };

    for (const key of ["heading","subheading","body"]) {
      packageData[key + "Data"] = await readFile(files[key]);
    }

    await putOne("fonts", packageData);
    await activateFont(packageData);

    notify("Paket font berhasil disimpan.");
    renderPackageManager();
  } catch (error) {
    notify("Gagal menyimpan font.");
  }
}

async function removePackage(id) {
  if (!confirm("Hapus paket ini secara permanen dari perangkat?")) return;

  await deleteOne(managerTab, id);

  if (managerTab === "backgrounds" && selectedBackground.id === id) {
    selectedBackground = defaultBackgrounds[0];
  }

  if (managerTab === "elements" && selectedElement.id === id) {
    selectedElement = defaultElements[0];
  }

  if (managerTab === "fonts" && selectedFont.id === id) {
    selectedFont = defaultFonts[0];
  }

  renderPackageManager();
  renderHome();
}

// ============================================
// EDITOR MATERI
// ============================================

function openEditor() {
  document.getElementById("projectTitle").value = projectTitle;
  activeSlide = 0;
  renderSlideEditor();
  showPage("editor");
}

function renderSlideEditor() {
  document.getElementById("slideList").innerHTML = slides.map((slide,index) => `
    <button type="button" draggable="true" data-slide-index="${index}"
      class="slide-item ${index === activeSlide ? "selected" : ""}">
      <span class="drag-grip" aria-hidden="true">⠿</span>
      <span>${index + 1}. ${escapeHTML(slide.title || "Slide baru")}</span>
      <small>${escapeHTML(defaultLayouts.find(x => x.id === (slide.layout || "left"))?.name || "Teks")}</small>
    </button>
  `).join("");
  bindSlideDragDrop();
  document.querySelectorAll(".slide-item").forEach(button => button.addEventListener("click", () => selectSlide(Number(button.dataset.slideIndex))));

  const layout = slides[activeSlide].layout || "left";
  let fields = `
    <div class="form-group">
      <label>Judul slide</label>
      <input id="slideTitle" value="${escapeHTML(slides[activeSlide].title)}"
        placeholder="Judul slide">
    </div>
    <div class="form-group">
      <label>Subjudul (opsional)</label>
      <input id="slideSubtitle" value="${escapeHTML(slides[activeSlide].subtitle)}"
        placeholder="Subjudul">
    </div>
  `;

  if (layout.startsWith("points")) {
    fields += `
      <div class="form-group">
        <label>Jenis poin</label>
        <select id="pointStyle">
          <option value="bullet">Titik (•)</option>
          <option value="number">Angka (1, 2, 3)</option>
          <option value="dash">Strip (-)</option>
        </select>
      </div>
      <div class="form-group">
        <label>Materi (satu poin per baris)</label>
        <textarea id="slideBody" rows="9"
          placeholder="Contoh universitas A&#10;Contoh universitas B&#10;Contoh universitas C">${escapeHTML(slides[activeSlide].body)}</textarea>
      </div>
    `;
  } else if (layout.startsWith("columns")) {
    fields += `
      <div class="form-group">
        <label>Materi (pisahkan setiap kolom dengan satu baris kosong)</label>
        <textarea id="slideBody" rows="9"
          placeholder="Kolom pertama&#10;&#10;Kolom kedua&#10;&#10;Kolom ketiga&#10;&#10;Kolom keempat">${escapeHTML(slides[activeSlide].body)}</textarea>
      </div>
    `;
  } else if (layout.startsWith("picture")) {
    fields += `
      <div class="form-group">
        <label>Materi</label>
        <textarea id="slideBody" rows="7">${escapeHTML(slides[activeSlide].body)}</textarea>
      </div>
      <div class="form-group">
        <label>Gambar slide</label>
        <input id="slideImage" type="file" accept="image/*">
        ${slides[activeSlide].image ? '<small>Gambar sudah dipilih. Unggah lagi untuk mengganti.</small>' : ""}
      </div>
    `;
  } else {
    fields += `
      <div class="form-group">
        <label>Materi</label>
        <textarea id="slideBody" rows="10"
          placeholder="Tuliskan materi di sini...">${escapeHTML(slides[activeSlide].body)}</textarea>
      </div>
    `;
  }

  document.getElementById("contentFields").innerHTML = fields;
  setupFileControls(document.getElementById("contentFields"));

  document.getElementById("slideTitle").addEventListener("input", e => {
    slides[activeSlide].title = e.target.value;
    const titleLabel = document.querySelector(`.slide-item[data-slide-index="${activeSlide}"] span:nth-child(2)`);
    if (titleLabel) titleLabel.textContent = `${activeSlide + 1}. ${e.target.value || "Slide baru"}`;
  });

  document.getElementById("slideSubtitle").addEventListener("input", e => {
    slides[activeSlide].subtitle = e.target.value;
  });

  const body = document.getElementById("slideBody");
  if (body) {
    body.addEventListener("input", e => {
      slides[activeSlide].body = e.target.value;
    });
  }

  const pointStyle = document.getElementById("pointStyle");
  if (pointStyle) {
    pointStyle.value = slides[activeSlide].pointStyle || (layout === "points-number" ? "number" : layout === "points-dash" ? "dash" : "bullet");
    pointStyle.addEventListener("change", e => {
      slides[activeSlide].pointStyle = e.target.value;
    });
  }

  const picture = document.getElementById("slideImage");
  if (picture) {
    picture.addEventListener("change", async e => {
      const file = e.target.files[0];
      if (file) {
        recordUndoState();
        slides[activeSlide].image = await readFile(file);
      }
    });
  }
}

function bindSlideDragDrop() {
  const list = document.getElementById("slideList");
  let dragged = null;
  list.querySelectorAll(".slide-item").forEach(item => {
    item.addEventListener("dragstart", event => {
      dragged = Number(item.dataset.slideIndex);
      item.classList.add("dragging");
      event.dataTransfer.effectAllowed = "move";
    });
    item.addEventListener("dragend", () => item.classList.remove("dragging"));
    item.addEventListener("dragover", event => { event.preventDefault(); item.classList.add("drag-over"); });
    item.addEventListener("dragleave", () => item.classList.remove("drag-over"));
    item.addEventListener("drop", event => {
      event.preventDefault();
      item.classList.remove("drag-over");
      const target = Number(item.dataset.slideIndex);
      if (dragged === null || dragged === target) return;
      recordUndoState();
      const [moved] = slides.splice(dragged, 1);
      slides.splice(target, 0, moved);
      if (activeSlide === dragged) activeSlide = target;
      else if (dragged < activeSlide && target >= activeSlide) activeSlide--;
      else if (dragged > activeSlide && target <= activeSlide) activeSlide++;
      dragged = null;
      renderSlideEditor();
    });
  });
}

function selectSlide(index) {
  activeSlide = index;
  renderSlideEditor();
}

function addSlide() {
  recordUndoState();
  slides.push({
    title: "Slide Baru",
    subtitle: "",
    body: "",
    image: null,
    layout: selectedLayout.id || "left"
  });

  activeSlide = slides.length - 1;
  renderSlideEditor();
}

function deleteSlide() {
  if (slides.length <= 1) return notify("Minimal harus ada satu slide.");

  if (!confirm("Hapus slide ini?")) return;

  recordUndoState();
  slides.splice(activeSlide, 1);
  activeSlide = Math.max(0, activeSlide - 1);
  renderSlideEditor();
}

// ============================================
// MEMBUAT TAMPILAN SLIDE
// ============================================

function getBackgroundStyle() {
  if (selectedBackground.image) {
    return `background-image:url("${selectedBackground.image}")`;
  }

  return `background-color:${selectedBackground.color || "#FFFFFF"}`;
}

function renderCorners() {
  if (!selectedElement.corners) return "";

  return Object.entries(selectedElement.corners).map(([position,image]) => `
    <img class="corner ${position}" src="${image}" alt="">
  `).join("");
}

function renderSlide(slide,index) {
  const layout = slide.layout || "left";
  const font = selectedFont;
  const title = escapeHTML(slide.title);
  const subtitle = escapeHTML(slide.subtitle);
  const body = slide.body || "";

  let content = "";

  if (layout.startsWith("points")) {
    const lines = body.split("\n").filter(x => x.trim());
    const style = slide.pointStyle || "bullet";

    const marker = style === "number"
      ? (i => `${i + 1}.`)
      : style === "dash"
      ? (() => "-")
      : (() => "•");

    content = lines.map((line,i) => `
      <p>${marker(i)} ${escapeHTML(line)}</p>
    `).join("");
  } else if (layout.startsWith("columns")) {
    const count = Number(layout.replace("columns","")) || 2;
    const items = body.split(/\n\s*\n/).map(item => item.trim()).filter(Boolean);

    content = `
      <div class="column-content" style="--columns:${count}">
        ${Array.from({length:count},(_,i) => `
          <p>${escapeHTML(items[i] || "")}</p>
        `).join("")}
      </div>
    `;
  } else {
    content = `<p>${escapeHTML(body)}</p>`;
  }

  let image = "";

  if (layout.startsWith("picture") && slide.image) {
    image = `<img class="slide-image" src="${slide.image}" alt="Gambar materi">`;
  }

  const layoutClasses = [
    `layout-${layout}`,
    layout.startsWith("columns") ? "layout-columns" : "",
    layout.startsWith("points") ? "layout-points" : "",
    layout.startsWith("picture") ? `layout-picture ${layout}` : ""
  ].filter(Boolean).join(" ");

  return `
    <article class="slide ${layoutClasses}"
      style="${getBackgroundStyle()};
      font-family:'${escapeHTML(font.body)}',Arial,sans-serif">

      ${renderCorners()}

      <div class="slide-content">
        <h1 style="font-family:'${escapeHTML(font.heading)}',Arial,sans-serif">
          ${index === 0 ? escapeHTML(projectTitle) : title}
        </h1>

        ${index === 0 && title ? `<h2>${title}</h2>` : ""}
        ${subtitle ? `<h2 style="font-family:'${escapeHTML(font.subheading)}',Arial,sans-serif">${subtitle}</h2>` : ""}

        ${content}
      </div>

      ${image}
    </article>
  `;
}

// ============================================
// PREVIEW
// ============================================


async function finishProject() {
  projectTitle = document.getElementById("projectTitle").value.trim()
    || "Presentasi Baru";

  previewIndex = 0;

  document.getElementById("previewTitle").textContent = projectTitle;
  renderPreview();

  showPage("preview");

  // Simpan otomatis tanpa menampilkan notifikasi.
  await saveProject(true);
}


function renderPreview() {
  const container = document.getElementById("slidePreview");

  container.innerHTML = slides.map((slide,index) =>
    `<div class="preview-slide" data-index="${index}" style="display:${index === previewIndex ? "block" : "none"}">
      ${renderSlide(slide,index)}
    </div>`
  ).join("");

  document.getElementById("previewCounter").textContent =
    `${previewIndex + 1} / ${slides.length}`;
}

function movePreview(direction) {
  previewIndex = Math.max(0, Math.min(slides.length - 1, previewIndex + direction));
  renderPreview();
}

// ============================================
// SIMPAN DAN RIWAYAT PRESENTASI
// ============================================

function makeProjectData() {
  return {
    id: currentProjectId || makeId(),
    title: projectTitle,
    slides,
    background: selectedBackground,
    element: selectedElement,
    font: selectedFont,
    layout: selectedLayout,
    updated: Date.now()
  };
}


async function saveProject(silent = false) {
  try {
    const titleInput = document.getElementById("projectTitle");
    if (titleInput && titleInput.value.trim()) projectTitle = titleInput.value.trim();
    const data = makeProjectData();

    await putOne("projects", data);
    currentProjectId = data.id;

    if (!silent) {
      notify("Presentasi berhasil disimpan.");
    }

    renderHome();
  } catch (error) {
    notify("Penyimpanan gagal. Periksa kapasitas penyimpanan browser.");
  }
}


async function renderHistory() {
  const projects = (await getAll("projects"))
    .sort((a,b) => b.updated - a.updated);

  const container = document.getElementById("historyList");

  if (!projects.length) {
    container.innerHTML = '<div class="empty-state">Belum ada presentasi tersimpan.</div>';
    return;
  }

  container.innerHTML = projects.map(project => `
    <div class="package-card">
      <div class="color-sample" style="background:#fff0ef;color:#bd2633">P</div>
      <h3>${escapeHTML(project.title)}</h3>
      <p>${project.slides.length} slide</p>
      <small>${new Date(project.updated).toLocaleString("id-ID")}</small>
      <div style="display:flex;gap:7px;margin-top:12px">
        <button class="primary" onclick="openProject('${project.id}')">Edit kembali</button>
        <button class="danger" onclick="deleteProject('${project.id}')">Hapus</button>
      </div>
    </div>
  `).join("");
}

async function openProject(id) {
  const project = await getOne("projects", id);
  if (!project) return notify("Proyek tidak ditemukan.");

  currentProjectId = project.id;
  projectTitle = project.title || "Presentasi Baru";
  slides = (project.slides || []).map(slide => ({ ...slide, layout: slide.layout || project.layout?.id || "left" }));
  selectedBackground = project.background || defaultBackgrounds[0];
  selectedElement = project.element || defaultElements[0];
  selectedFont = project.font || defaultFonts[0];
  selectedLayout = project.layout || defaultLayouts[0];
  undoStack = [];
  redoStack = [];
  updateHistoryButtons();

  await activateFont(selectedFont);
  document.getElementById("projectTitle").value = projectTitle;
  openEditor();
}

async function deleteProject(id) {
  if (!confirm("Hapus riwayat presentasi ini?")) return;

  await deleteOne("projects", id);
  renderHistory();
  renderHome();
}

// ============================================
// BERANDA
// ============================================

async function renderHome() {
  const backgrounds = await getAll("backgrounds");
  const projects = (await getAll("projects"))
    .sort((a,b) => b.updated - a.updated);

  const all = [...defaultBackgrounds, ...backgrounds];

  document.getElementById("homePackages").innerHTML = all.slice(0,6).map(item => `
    <div class="package-card">
      ${item.image
        ? `<img class="package-image" src="${item.image}">`
        : `<div class="color-sample" style="background:${item.color}">Aa</div>`}
      <h3>${escapeHTML(item.name)}</h3>
    </div>
  `).join("");

  document.getElementById("recentProjects").innerHTML = projects.slice(0,3).map(item => `
    <div class="package-card">
      <div class="color-sample">P</div>
      <h3>${escapeHTML(item.title)}</h3>
      <p>${item.slides.length} slide</p>
      <button class="secondary" onclick="openProject('${item.id}')">Edit kembali</button>
    </div>
  `).join("") || '<div class="empty-state">Belum ada proyek tersimpan.</div>';
}

// ============================================
// MODE PRESENTASI LAYAR PENUH
// ============================================

async function startSlideshow() {
  slideshowIndex = 0;

  document.getElementById("presentationMode").classList.add("active");

  if (document.documentElement.requestFullscreen) {
    try {
      await document.documentElement.requestFullscreen();
    } catch (error) {
      console.warn("Fullscreen tidak tersedia.");
    }
  }

  renderSlideshow();
}

function renderSlideshow() {
  document.getElementById("fullscreenSlide").innerHTML =
    renderSlide(slides[slideshowIndex], slideshowIndex);

  document.getElementById("screenCounter").textContent =
    `${slideshowIndex + 1} / ${slides.length}`;
}

function moveSlideshow(direction) {
  slideshowIndex = Math.max(
    0,
    Math.min(slides.length - 1, slideshowIndex + direction)
  );

  renderSlideshow();
}

async function stopSlideshow() {
  document.getElementById("presentationMode").classList.remove("active");

  if (document.fullscreenElement) {
    await document.exitFullscreen();
  }
}

document.addEventListener("keydown", event => {
  if (!document.getElementById("presentationMode").classList.contains("active")) return;

  if (event.key === "ArrowRight" || event.key === " ") moveSlideshow(1);
  if (event.key === "ArrowLeft") moveSlideshow(-1);
  if (event.key === "Escape") stopSlideshow();
});

// ============================================
// EKSPOR POWERPOINT
// ============================================

async function downloadPPT() {
  if (!slides.length) return notify("Tambahkan minimal satu slide sebelum mengunduh.");
  if (typeof PptxGenJS === "undefined") return notify("Mesin PowerPoint lokal belum termuat. Pastikan pptxgen.bundle.js berada di folder yang sama.");
  if (typeof html2canvas === "undefined") return notify("Mesin render slide belum termuat. Periksa koneksi internet lalu muat ulang halaman.");

  const button = document.getElementById("downloadPptButton");
  if (button) { button.disabled = true; button.textContent = "Menyiapkan PPTX..."; }
  let stage;
  try {
    await document.fonts.ready;
    const currentSlide = document.querySelector("#slidePreview .slide");
    const measuredWidth = currentSlide?.getBoundingClientRect().width || 1280;
    const renderWidth = Math.max(320, Math.round(measuredWidth));
    const renderHeight = Math.round(renderWidth * 9 / 16);
    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE";
    pptx.author = "Praktislide.Presentasi";
    pptx.subject = projectTitle;
    pptx.title = projectTitle;
    pptx.lang = "id-ID";

    stage = document.createElement("div");
    stage.className = "pptx-render-stage";
    stage.style.width = `${renderWidth}px`;
    stage.style.height = `${renderHeight}px`;
    document.body.appendChild(stage);

    for (let i = 0; i < slides.length; i++) {
      stage.innerHTML = renderSlide(slides[i], i);
      const node = stage.querySelector(".slide");
      node.style.width = `${renderWidth}px`;
      node.style.height = `${renderHeight}px`;
      node.style.aspectRatio = "16 / 9";
      node.style.boxSizing = "border-box";

      await Promise.all(Array.from(node.querySelectorAll("img")).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
      }));
      const canvas = await html2canvas(node, {
        backgroundColor: null, scale: 2, useCORS: true, allowTaint: false,
        logging: false, width: renderWidth, height: renderHeight,
        windowWidth: Math.max(window.innerWidth, renderWidth),
        windowHeight: Math.max(window.innerHeight, renderHeight)
      });
      const pptSlide = pptx.addSlide();
      pptSlide.addImage({data:canvas.toDataURL("image/png"),x:0,y:0,w:13.333333,h:7.5});
    }

    const safeTitle = (projectTitle || "Praktislide-Presentasi").replace(/[\\/:*?"<>|]/g,"-").trim() || "Praktislide-Presentasi";
    const blob = await pptx.write({outputType:"blob"});
    if (!(blob instanceof Blob)) throw new Error("File PPTX tidak berhasil dibuat.");
    const url = URL.createObjectURL(new Blob([blob],{type:"application/vnd.openxmlformats-officedocument.presentationml.presentation"}));
    const link = document.getElementById("pptxDownloadFallback");
    if (!link) throw new Error("Tautan unduh cadangan tidak ditemukan.");
    if (window.lastPptxObjectUrl) URL.revokeObjectURL(window.lastPptxObjectUrl);
    window.lastPptxObjectUrl = url;
    link.href = url;
    link.download = `${safeTitle}.pptx`;
    link.hidden = false;
    link.textContent = `Unduh ${safeTitle}.pptx`;
    link.click();
    notify("PPTX berhasil dibuat. Setiap slide disimpan sebagai gambar agar tampilannya mengikuti pratinjau website.");
  } catch (error) {
    console.error("Ekspor PPTX gagal:",error);
    notify(`PPTX gagal dibuat: ${error?.message || "Terjadi kesalahan"}.`);
  } finally {
    if (stage) stage.remove();
    if (button) { button.disabled = false; button.textContent = "↓ Download PPTX"; }
  }
}

// ============================================
// BAGIKAN PRESENTASI MELALUI SUPABASE STORAGE
// ============================================
const SHARE_BUCKET = "praktislide-shares";
const MAX_SHARE_BYTES = 15 * 1024 * 1024;

function getSupabaseClient() {
  if (!window.praktislideSupabase) {
    throw new Error("Konfigurasi Supabase belum diisi. Lengkapi supabase-config.js.");
  }
  return window.praktislideSupabase;
}

function makeShareId() {
  if (window.crypto?.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === "x" ? r : (r & 3 | 8)).toString(16);
  });
}

async function sharePresentation() {
  if (!slides.length) return notify("Belum ada slide untuk dibagikan.");

  try {
    const supabase = getSupabaseClient();
    const payload = {
      version: 2,
      title: projectTitle || "Presentasi Praktislide",
      slides,
      background: selectedBackground,
      element: selectedElement,
      font: selectedFont,
      layout: selectedLayout,
      createdAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    if (blob.size > MAX_SHARE_BYTES) {
      return notify("Ukuran presentasi melebihi batas 15 MB. Kecilkan gambar atau hapus gambar yang tidak diperlukan.");
    }

    const shareId = makeShareId();
    const filePath = `${shareId}.json`;
    const { error: uploadError } = await supabase.storage
      .from(SHARE_BUCKET)
      .upload(filePath, blob, {
        contentType: "application/json",
        cacheControl: "3600",
        upsert: false
      });

    if (uploadError) throw uploadError;

    const url = `${location.origin}${location.pathname}#share=${shareId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: payload.title,
          text: "Lihat presentasi Praktislide saya",
          url
        });
      } catch (shareError) {
        if (shareError?.name === "AbortError") return;
        throw shareError;
      }
    } else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      notify("Tautan presentasi berhasil disalin. Kirim tautan itu kepada orang lain.");
    } else {
      window.prompt("Salin tautan presentasi ini:", url);
    }
  } catch (error) {
    console.error("Gagal membagikan presentasi:", error);
    const message = error?.message || "Periksa koneksi dan konfigurasi Supabase.";
    notify(`Tautan gagal dibuat: ${message}`);
  }
}

async function loadSharedPresentation() {
  const match = location.hash.match(/^#share=([a-f0-9-]{20,})$/i);
  if (!match) return false;

  try {
    const supabase = getSupabaseClient();
    const filePath = `${match[1]}.json`;
    const { data } = supabase.storage.from(SHARE_BUCKET).getPublicUrl(filePath);
    if (!data?.publicUrl) throw new Error("Alamat presentasi tidak ditemukan.");

    const response = await fetch(data.publicUrl, { cache: "no-store" });
    if (!response.ok) throw new Error("Presentasi tidak ditemukan atau tautannya sudah tidak tersedia.");

    const shared = await response.json();
    if (!shared || shared.version !== 2 || !Array.isArray(shared.slides) || !shared.slides.length) {
      throw new Error("Data presentasi tidak valid.");
    }

    projectTitle = shared.title || "Presentasi dibagikan";
    slides = shared.slides;
    selectedBackground = shared.background || defaultBackgrounds[0];
    selectedElement = shared.element || defaultElements[0];
    selectedFont = shared.font || defaultFonts[0];
    selectedLayout = shared.layout || defaultLayouts[0];
    currentProjectId = null;
    previewIndex = 0;

    await activateFont(selectedFont);
    document.getElementById("previewTitle").textContent = projectTitle;
    renderPreview();
    showPage("preview");
    return true;
  } catch (error) {
    console.warn("Tautan berbagi tidak dapat dibuka:", error);
    notify(`Presentasi tidak dapat dibuka: ${error?.message || "Tautan tidak valid."}`);
    return false;
  }
}

// AWAL APLIKASI
// ============================================

async function initialize() {
  try {
    await openDatabase();
    setupFileControls(document);

    await renderHome();
    await renderWizard();
    updateHistoryButtons();
    const sharedLoaded = await loadSharedPresentation();
    if (!sharedLoaded) console.log("Praktislide berhasil dijalankan.");
  } catch (error) {
    console.error(error);
    notify("Database browser tidak dapat dibuka. Coba gunakan Chrome dengan Live Server.");
  }
}

initialize();
