// SIMULASI DATABASE
const menuData = [
    { id: 1, nama: "Nasi Goreng", harga: 25000, kategori: "Makanan" },
    { id: 2, nama: "Ayam Bakar", harga: 30000, kategori: "Makanan" },
    { id: 3, nama: "Es Jeruk", harga: 7000, kategori: "Minuman" },
    { id: 4, nama: "Sate Ayam", harga: 22000, kategori: "Makanan" }
];

let cart = [];
let currentUser = null;

// FUNGSI LOGIN
function handleLogin() {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;

    if (user === "admin" && pass === "admin123") {
        currentUser = { username: "Admin", role: "admin" };
        showView('admin-page');
        renderAdmin();
    } else if (user === "user" && pass === "user123") {
        currentUser = { username: "Pelanggan", role: "user" };
        showView('user-page');
        renderMenu();
    } else {
        alert("Akun tidak terdaftar!");
    }
}

function showView(id) {
    document.querySelectorAll('.view-section').forEach(s => s.classList.add('d-none'));
    document.getElementById(id).classList.remove('d-none');
}

// LOGIKA KATALOG USER
function renderMenu() {
    const list = document.getElementById('menu-list');
    const search = document.getElementById('search').value.toLowerCase();
    list.innerHTML = '';

    menuData.filter(m => m.nama.toLowerCase().includes(search)).forEach(item => {
        list.innerHTML += `
            <div class="col-md-4 mb-3">
                <div class="card border-0 shadow-sm p-3 rounded-4">
                    <small class="text-danger fw-bold">${item.kategori}</small>
                    <h5 class="fw-bold">${item.nama}</h5>
                    <h6 class="text-muted">Rp ${item.harga.toLocaleString()}</h6>
                    <button onclick="addToCart(${item.id})" class="btn btn-outline-danger btn-sm rounded-pill mt-2">+ Keranjang</button>
                </div>
            </div>`;
    });
}

function addToCart(id) {
    cart.push(menuData.find(m => m.id === id));
    document.getElementById('cart-count').innerText = cart.length;
}

// LOGIKA PEMBAYARAN & STRUK
function showCart() {
    if (cart.length === 0) return alert("Keranjang kosong!");
    let total = cart.reduce((sum, item) => sum + item.harga, 0);
    
    let content = `
        <div class="p-3">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=KULINERKU-PAY" class="mb-3">
            <h6>Scan QRIS untuk membayar</h6>
            <hr class="dashed">
            <h4 class="fw-bold text-danger">Total: Rp ${total.toLocaleString()}</h4>
        </div>`;
    
    document.getElementById('payment-content').innerHTML = content;
    document.getElementById('btn-pay').onclick = () => processPayment(total);
    new bootstrap.Modal(document.getElementById('paymentModal')).show();
}

function processPayment(total) {
    // Simpan Transaksi ke LocalStorage (Simulasi DB Pesanan)
    let history = JSON.parse(localStorage.getItem('riwayat_pesanan')) || [];
    let trans = {
        id: "TRX" + Math.floor(Math.random() * 1000),
        pembeli: currentUser.username,
        total: total,
        tanggal: new Date().toLocaleString()
    };
    history.push(trans);
    localStorage.setItem('riwayat_pesanan', JSON.stringify(history));

    // Tampilkan Struk
    let struk = `
        <div class="text-start small font-monospace">
            <h5 class="text-center fw-bold">STRUK PEMBAYARAN</h5>
            <p class="text-center">KulinerKu Resto</p>
            <hr>
            <p>ID: ${trans.id}<br>User: ${trans.pembeli}<br>Tgl: ${trans.tanggal}</p>
            <hr>
            ${cart.map(i => `<div class="d-flex justify-content-between"><span>${i.nama}</span><span>${i.harga}</span></div>`).join('')}
            <hr>
            <div class="d-flex justify-content-between fw-bold"><span>TOTAL</span><span>Rp ${total.toLocaleString()}</span></div>
            <p class="text-center mt-3">LUNAS - TERIMA KASIH</p>
        </div>
        <button onclick="location.reload()" class="btn btn-dark w-100 rounded-pill mt-3">Selesai</button>
    `;
    document.getElementById('payment-content').innerHTML = struk;
    document.getElementById('btn-pay').classList.add('d-none');
    cart = [];
}

// LOGIKA ADMIN
function renderAdmin() {
    let history = JSON.parse(localStorage.getItem('riwayat_pesanan')) || [];
    let income = history.reduce((sum, t) => sum + t.total, 0);
    
    document.getElementById('stat-menu').innerText = menuData.length;
    document.getElementById('stat-income').innerText = "Rp " + income.toLocaleString();
    
    document.getElementById('history-table').innerHTML = history.map(t => `
        <tr><td>${t.id}</td><td>${t.pembeli}</td><td>Rp ${t.total.toLocaleString()}</td><td>${t.tanggal}</td></tr>
    `).join('');
}

function logout() { location.reload(); }