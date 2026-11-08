const STORAGE_KEYS = {
    users: "tokoBukuUsers",
    catalog: "tokoBukuCatalog",
    tracking: "tokoBukuTracking",
    orders: "tokoBukuOrders",
    currentUser: "tokoBukuCurrentUser"
};

function getStoredValue(key, fallback) {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
}

function getUsers() {
    return getStoredValue(STORAGE_KEYS.users, dataPengguna);
}

function getCatalog() {
    return getStoredValue(STORAGE_KEYS.catalog, dataKatalogBuku).map(book => {
        const defaultBook = dataKatalogBuku.find(item => item.kodeBarang === book.kodeBarang);
        return defaultBook ? { ...book, cover: defaultBook.cover } : book;
    });
}

function getTrackingData() {
    return getStoredValue(STORAGE_KEYS.tracking, dataTracking);
}

function getOrders() {
    return getStoredValue(STORAGE_KEYS.orders, []);
}

function formatRupiah(amount) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(Number(amount) || 0);
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

function loadGreeting() {
    const greetingEl = document.getElementById("greeting");
    if (!greetingEl) return;

    const hour = new Date().getHours();
    let greeting = "Selamat malam";
    if (hour >= 4 && hour < 11) greeting = "Selamat pagi";
    else if (hour >= 11 && hour < 15) greeting = "Selamat siang";
    else if (hour >= 15 && hour < 18) greeting = "Selamat sore";

    const user = getStoredValue(STORAGE_KEYS.currentUser, null);
    greetingEl.textContent = `${greeting}, ${user ? user.nama : "Selamat datang"}!`;
}

function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add("is-open");
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove("is-open");
}

function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    const user = getUsers().find(item =>
        item.email.toLowerCase() === email && item.password === password
    );

    if (!user) {
        document.getElementById("login-message").textContent = "Email atau kata sandi belum sesuai.";
        return;
    }

    localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify({
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role
    }));
    window.location.href = "dashboard.html";
}

function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById("register-name").value.trim();
    const email = document.getElementById("register-email").value.trim().toLowerCase();
    const password = document.getElementById("register-password").value;
    const users = getUsers();

    if (users.some(user => user.email.toLowerCase() === email)) {
        document.getElementById("register-message").textContent = "Email ini sudah terdaftar.";
        return;
    }

    users.push({
        id: Date.now(),
        nama: name,
        email,
        password,
        role: "User"
    });
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
    closeModal("modal-daftar");
    document.getElementById("email").value = email;
    document.getElementById("password").value = "";
    document.getElementById("login-message").textContent = "Akun berhasil dibuat. Silakan masuk.";
    document.getElementById("register-form").reset();
    document.getElementById("register-message").textContent = "";
}

function handlePasswordReset(event) {
    event.preventDefault();
    const email = document.getElementById("reset-email").value.trim().toLowerCase();
    const exists = getUsers().some(user => user.email.toLowerCase() === email);
    const message = document.getElementById("reset-message");
    message.textContent = exists
        ? "Akun ditemukan. Silakan hubungi admin untuk bantuan pemulihan kata sandi."
        : "Email tersebut belum terdaftar.";
}

function logout() {
    localStorage.removeItem(STORAGE_KEYS.currentUser);
    window.location.href = "index.html";
}

function loadKatalog() {
    const tbody = document.getElementById("katalog-body");
    if (!tbody) return;

    const catalog = getCatalog();
    tbody.innerHTML = catalog.map((book, index) => `
        <tr>
            <td class="table-number">${String(index + 1).padStart(2, "0")}</td>
            <td>
                <div class="book-cell">
                    <img class="book-cover" src="${escapeHtml(book.cover || "")}" alt="Sampul ${escapeHtml(book.namaBarang)}" loading="lazy">
                    <div><strong>${escapeHtml(book.namaBarang)}</strong><span class="table-subtitle">${escapeHtml(book.kodeBarang)}</span></div>
                </div>
            </td>
            <td>${escapeHtml(book.jenisBarang || "Buku Ajar")}<span class="table-subtitle">Edisi ${escapeHtml(book.edisi || "-")}</span></td>
            <td>${formatRupiah(book.harga)}</td>
            <td><span class="stock-badge ${book.stok < 10 ? "stock-low" : ""}">${Number(book.stok)} tersedia</span></td>
        </tr>
    `).join("");
}

function tambahStok(event) {
    event.preventDefault();
    const catalog = getCatalog();
    const code = document.getElementById("kode-buku").value.trim().toUpperCase();
    if (catalog.some(book => book.kodeBarang.toUpperCase() === code)) {
        document.getElementById("stock-message").textContent = "Kode buku sudah digunakan.";
        return;
    }

    catalog.push({
        kodeBarang: code,
        namaBarang: document.getElementById("judul").value.trim(),
        jenisBarang: document.getElementById("jenis").value.trim() || "Buku Ajar",
        edisi: document.getElementById("edisi").value.trim() || "1",
        harga: Number(document.getElementById("harga").value),
        stok: Number(document.getElementById("stok").value)
    });
    localStorage.setItem(STORAGE_KEYS.catalog, JSON.stringify(catalog));
    loadKatalog();
    document.getElementById("form-stok").reset();
    document.getElementById("stock-message").textContent = "";
    closeModal("modal-tambah");
}

function renderBookOptions() {
    const select = document.getElementById("buku-select");
    if (!select) return;
    const catalog = getCatalog();
    select.innerHTML = '<option value="">Pilih buku yang ingin dipesan</option>' +
        catalog.map(book => `
            <option value="${escapeHtml(book.kodeBarang)}" ${Number(book.stok) < 1 ? "disabled" : ""}>
                ${escapeHtml(book.namaBarang)} — ${formatRupiah(book.harga)} (stok ${Number(book.stok)})
            </option>
        `).join("");
    hitungTotal();
}

function hitungTotal() {
    const select = document.getElementById("buku-select");
    const quantityInput = document.getElementById("jumlah");
    const totalInput = document.getElementById("total-bayar");
    if (!select || !quantityInput || !totalInput) return;

    const book = getCatalog().find(item => item.kodeBarang === select.value);
    const quantity = Math.max(1, Number(quantityInput.value) || 1);
    totalInput.textContent = book ? formatRupiah(book.harga * quantity) : formatRupiah(0);
}

function submitPesanan(event) {
    event.preventDefault();
    const catalog = getCatalog();
    const code = document.getElementById("buku-select").value;
    const book = catalog.find(item => item.kodeBarang === code);
    const quantity = Number(document.getElementById("jumlah").value);
    const message = document.getElementById("order-message");

    if (!book || !Number.isInteger(quantity) || quantity < 1) {
        message.textContent = "Silakan pilih buku dan jumlah yang valid.";
        return;
    }
    if (quantity > Number(book.stok)) {
        message.textContent = `Stok tidak mencukupi. Tersedia ${book.stok} buku.`;
        return;
    }

    const tracking = getTrackingData();
    const nextNumber = Math.max(20230013, ...Object.keys(tracking).map(Number)) + 1;
    const nomorDO = String(nextNumber);
    const nama = document.getElementById("nama-pemesan").value.trim();
    const alamat = document.getElementById("alamat").value.trim();
    const total = Number(book.harga) * quantity;
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19).replace("T", " ");
    const payment = document.getElementById("metode-pembayaran").value;
    const order = {
        id: `TRX-${nomorDO}`,
        nomorDO,
        tanggal: now.toISOString().slice(0, 10),
        nama,
        alamat,
        namaBuku: book.namaBarang,
        jumlah: quantity,
        total,
        status: "Pesanan diproses",
        metodePembayaran: payment
    };

    book.stok = Number(book.stok) - quantity;
    tracking[nomorDO] = {
        nomorDO,
        nama,
        alamat,
        status: "Pesanan diproses",
        ekspedisi: "Menunggu konfirmasi",
        tanggalKirim: order.tanggal,
        paket: book.kodeBarang,
        total,
        perjalanan: [{
            waktu: timestamp,
            keterangan: `Pesanan diterima. ${quantity} buku ${book.namaBarang} sedang disiapkan.`
        }]
    };

    const orders = getOrders();
    orders.unshift(order);
    localStorage.setItem(STORAGE_KEYS.catalog, JSON.stringify(catalog));
    localStorage.setItem(STORAGE_KEYS.tracking, JSON.stringify(tracking));
    localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
    window.location.href = `tracking.html?do=${encodeURIComponent(nomorDO)}`;
}

function cariTracking() {
    const number = document.getElementById("input-do").value.trim();
    const result = document.getElementById("tracking-result");
    const item = getTrackingData()[number];

    if (!item) {
        result.innerHTML = '<div class="empty-state">Nomor DO tidak ditemukan. Periksa kembali nomor pesanan Anda.</div>';
        return;
    }

    const completed = item.status === "Selesai";
    const percentage = completed ? 100 : (item.status === "Dalam Perjalanan" ? 65 : 25);
    result.innerHTML = `
        <section class="tracking-card">
            <div class="tracking-heading">
                <div>
                    <span class="eyebrow">NOMOR PESANAN</span>
                    <h3>${escapeHtml(item.nomorDO)}</h3>
                </div>
                <span class="status-badge">${escapeHtml(item.status)}</span>
            </div>
            <div class="progress-container"><div class="progress-bar" style="width:${percentage}%"></div></div>
            <div class="tracking-details">
                <div><span>Penerima</span><strong>${escapeHtml(item.nama)}</strong></div>
                ${item.alamat ? `<div><span>Alamat tujuan</span><strong>${escapeHtml(item.alamat)}</strong></div>` : ""}
                <div><span>Ekspedisi</span><strong>${escapeHtml(item.ekspedisi)}</strong></div>
                <div><span>Tanggal kirim</span><strong>${escapeHtml(item.tanggalKirim)}</strong></div>
                <div><span>Kode paket</span><strong>${escapeHtml(item.paket)}</strong></div>
                <div><span>Total pembayaran</span><strong>${formatRupiah(item.total)}</strong></div>
            </div>
            <h4 class="timeline-title">Perjalanan pesanan</h4>
            <ol class="timeline">
                ${item.perjalanan.map(step => `
                    <li><span class="timeline-dot"></span><div><strong>${escapeHtml(step.keterangan)}</strong><time>${escapeHtml(step.waktu)}</time></div></li>
                `).join("")}
            </ol>
        </section>
    `;
}

function loadOrderHistory() {
    const tbody = document.getElementById("history-body");
    if (!tbody) return;
    const orders = getOrders();
    tbody.innerHTML = orders.length
        ? orders.map(order => `
            <tr>
                <td>${escapeHtml(order.id)}</td>
                <td>${escapeHtml(order.tanggal)}</td>
                <td>${escapeHtml(order.namaBuku)} <span class="table-subtitle">x${Number(order.jumlah)}</span></td>
                <td>${formatRupiah(order.total)}</td>
                <td><span class="status-badge">${escapeHtml(order.status)}</span></td>
            </tr>
        `).join("")
        : '<tr><td colspan="5" class="empty-table">Belum ada transaksi. Pesanan Anda akan tampil di sini.</td></tr>';
}

function loadDashboardSummary() {
    const catalog = getCatalog();
    const orders = getOrders();
    const booksEl = document.getElementById("summary-books");
    const ordersEl = document.getElementById("summary-orders");
    const stockEl = document.getElementById("summary-stock");
    if (booksEl) booksEl.textContent = catalog.length;
    if (ordersEl) ordersEl.textContent = orders.length;
    if (stockEl) stockEl.textContent = catalog.reduce((sum, book) => sum + Number(book.stok), 0);
    loadOrderHistory();
}

function initializePage() {
    const protectedPage = !["", "index.html"].includes(window.location.pathname.split("/").pop());
    if (protectedPage && !getStoredValue(STORAGE_KEYS.currentUser, null)) {
        window.location.replace("index.html");
        return;
    }

    loadGreeting();
    loadKatalog();
    renderBookOptions();
    loadDashboardSummary();

    const trackingInput = document.getElementById("input-do");
    const orderNumber = new URLSearchParams(window.location.search).get("do");
    if (trackingInput && orderNumber) {
        trackingInput.value = orderNumber;
        cariTracking();
    }
}

initializePage();
