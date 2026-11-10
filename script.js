
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

const defaultBackgrounds = [
  { id: "bg-white", name: "Putih Bersih", color: "#FFFFFF" },
  { id: "bg-cream", name: "Cream", color: "#F2EADF" },
  { id: "bg-red", name: "Soft Red", color: "#F8E7E7" },
  { id: "bg-dark", name: "Dark", color: "#242424" }
];

const defaultElements = [
  { id: "el-none", name: "Tanpa Elemen", corners: {} },
  { id: "el-red", name: "Merah Minimalis", corners: {} }
];

const defaultFonts = [
  {
    id: "font-modern",
    name: "Modern",
    heading: "Plus Jakarta Sans",
    subheading: "DM Sans",
    body: "DM Sans"
  },
  {
    id: "font-classic",
    name: "Klasik",
    heading: "Georgia",
    subheading: "Arial",
    body: "Arial"
  },
  {
    id: "font-clean",
    name: "Sederhana",
    heading: "Arial",
    subheading: "Arial",
    body: "Arial"
  }
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
  [slides[index], slides[target]] = [slides[target], slides[index]];
  renderLayoutRail();
}

function removeRailCar(index) {
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
          placeholder="Kolom pertama&#10;&#10;Kolom kedua">${escapeHTML(slides[activeSlide].body)}</textarea>
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
      if (file) slides[activeSlide].image = await readFile(file);
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
    const items = body.split(/\n\s*\n/);

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

  return `
    <article class="slide layout-${layout}"
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
        <button class="primary" onclick="openProject('${project.id}')">Buka</button>
        <button class="danger" onclick="deleteProject('${project.id}')">Hapus</button>
      </div>
    </div>
  `).join("");
}

async function openProject(id) {
  const project = await getOne("projects", id);
  if (!project) return notify("Proyek tidak ditemukan.");

  currentProjectId = project.id;
  projectTitle = project.title;
  slides = (project.slides || []).map(slide => ({ ...slide, layout: slide.layout || project.layout?.id || "left" }));
  selectedBackground = project.background;
  selectedElement = project.element;
  selectedFont = project.font;
  selectedLayout = project.layout;

  await activateFont(selectedFont);

  document.getElementById("projectTitle").value = projectTitle;

  finishProject();
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
      <button class="secondary" onclick="openProject('${item.id}')">Buka</button>
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
  if (typeof pptxgen === "undefined") {
    return notify("Library PowerPoint belum termuat. Periksa koneksi internet.");
  }

  try {
    const pptx = new pptxgen();

    pptx.layout = "LAYOUT_WIDE";
    pptx.author = "Praktislide.Presentasi";
    pptx.subject = projectTitle;
    pptx.title = projectTitle;
    pptx.lang = "id-ID";

    for (let i = 0; i < slides.length; i++) {
      const data = slides[i];
      const slide = pptx.addSlide();

      slide.background = { color: "FFFFFF" };

      if (selectedBackground.image) {
        slide.addImage({
          data: selectedBackground.image,
          x: 0, y: 0, w: 13.333, h: 7.5
        });
      } else {
        slide.background = {
          color: (selectedBackground.color || "#FFFFFF").replace("#","")
        };
      }

      if (selectedElement.corners) {
        for (const [position,image] of Object.entries(selectedElement.corners)) {
          const coordinates = {
            tl: [0,0], tr: [11.75,0],
            bl: [0,6.18], br: [11.75,6.18]
          };

          const [x,y] = coordinates[position];

          slide.addImage({
            data: image,
            x, y, w: 1.55, h: 1.3,
            sizingCrop: false
          });
        }
      }

      const layout = data.layout || "left";
      const align =
        layout === "center" ? "center" :
        layout === "right" ? "right" : "left";

      const dark = selectedBackground.color === "#242424";
      const textColor = dark ? "FFFFFF" : "292626";

      const title = i === 0 ? projectTitle : data.title;

      slide.addText(title, {
        x: 0.8, y: 1.2, w: 11.7, h: 1.0,
        fontFace: selectedFont.heading,
        fontSize: 30,
        bold: true,
        color: textColor,
        align
      });

      if (data.subtitle) {
        slide.addText(data.subtitle, {
          x: 0.8, y: 2.3, w: 11.7, h: 0.6,
          fontFace: selectedFont.subheading,
          fontSize: 19,
          color: textColor,
          align
        });
      }

      const bodyY = data.subtitle ? 3.05 : 2.55;
      if (layout.startsWith("picture") && data.image) {
        const imageX = layout === "picture-left" ? 0.8 : 7.1;
        const textX = layout === "picture-left" ? 6.8 : 0.8;

        slide.addImage({
          data: data.image,
          x: imageX, y: bodyY, w: 5.3, h: 3.3,
          sizingCrop: true
        });

        slide.addText(data.body, {
          x: textX, y: bodyY, w: 5.4, h: 3.5,
          fontFace: selectedFont.body,
          fontSize: 17,
          color: textColor,
          valign: "mid",
          breakLine: false
        });
      } else if (layout.startsWith("columns")) {
        const count = Number(layout.replace("columns","")) || 2;
        const parts = data.body.split(/\n\s*\n/);
        const width = 11.7 / count;

        parts.slice(0,count).forEach((part,index) => {
          slide.addText(part, {
            x: 0.8 + index * width,
            y: bodyY,
            w: width - 0.2,
            h: 3.8,
            fontFace: selectedFont.body,
            fontSize: 16,
            color: textColor,
            valign: "top",
            margin: 0.1
          });
        });
      } else if (layout.startsWith("points")) {
        const lines = data.body.split("\n").filter(x => x.trim());
        const style = data.pointStyle || "bullet";

        const text = lines.map((line,index) => ({
          text: (style === "number" ? `${index + 1}. ` : style === "dash" ? "- " : "• ") + line,
          options: { breakLine: true }
        }));

        slide.addText(text, {
          x: 0.8, y: bodyY, w: 11.7, h: 3.8,
          fontFace: selectedFont.body,
          fontSize: 18,
          color: textColor,
          valign: "top"
        });
      } else {
        slide.addText(data.body, {
          x: 0.8, y: bodyY, w: 11.7, h: 3.8,
          fontFace: selectedFont.body,
          fontSize: 18,
          color: textColor,
          align,
          valign: "top",
          breakLine: false,
          paraSpaceAfterPt: 12
        });
      }

      slide.addText(String(i + 1), {
        x: 12.1, y: 7.0, w: 0.5, h: 0.2,
        fontSize: 9,
        color: textColor,
        align: "right"
      });
    }

    await pptx.writeFile({
      fileName: `${projectTitle.replace(/[\\/:*?"<>|]/g,"-")}.pptx`
    });

  } catch (error) {
    console.error(error);
    notify("PPTX gagal dibuat. Periksa isi materi dan gambar.");
  }
}

// ============================================
// AWAL APLIKASI
// ============================================

async function initialize() {
  try {
    await openDatabase();
    setupFileControls(document);

    await renderHome();
    await renderWizard();

    console.log("Praktislide berhasil dijalankan.");
  } catch (error) {
    console.error(error);
    notify("Database browser tidak dapat dibuka. Coba gunakan Chrome dengan Live Server.");
  }
}

initialize();
