/**
 * 1. DATABASE SIMULATION (Model Layer)
 * Mengelola data menu dan riwayat transaksi di LocalStorage
 */
const db = {
    getMenu: () => {
        const localMenu = JSON.parse(localStorage.getItem('kulinerku_menu'));
        if (!localMenu) {
            const defaultMenu = [
                { id: 1, nama: "Nasi Goreng Spesial", harga: 25000, kategori: "Makanan" },
                { id: 2, nama: "Ayam Bakar Taliwang", harga: 35000, kategori: "Makanan" },
                { id: 3, nama: "Es Jeruk Peras", harga: 10000, kategori: "Minuman" },
                { id: 4, nama: "Sate Kambing", harga: 45000, kategori: "Makanan" },
                { id: 5, nama: "Jus Alpukat", harga: 15000, kategori: "Minuman" },
                { id: 6, nama: "Mie Goreng Jawa", harga: 22000, kategori: "Makanan" }
            ];
            localStorage.setItem('kulinerku_menu', JSON.stringify(defaultMenu));
            return defaultMenu;
        }
        return localMenu;
    },
    saveMenu: (data) => localStorage.setItem('kulinerku_menu', JSON.stringify(data)),
    
    getHistory: () => JSON.parse(localStorage.getItem('kulinerku_orders')) || [],
    saveOrder: (order) => {
        const history = db.getHistory();
        history.unshift(order);
        localStorage.setItem('kulinerku_orders', JSON.stringify(history));
    }
};

/**
 * 2. AUTH CONTROLLER
 * Mengatur akses masuk berdasarkan role
 */
const authController = {
    login: () => {
        const user = document.getElementById('in-user').value;
        const pass = document.getElementById('in-pass').value;

        if (user === "admin" && pass === "admin123") {
            sessionStorage.setItem('session', JSON.stringify({user: 'Admin', role: 'admin'}));
            uiController.redirect('v-admin');
            adminController.index();
        } else if (user === "user" && pass === "user123") {
            sessionStorage.setItem('session', JSON.stringify({user: 'Pelanggan', role: 'user'}));
            uiController.redirect('v-makanan');
            makananController.index();
        } else {
            alert("Username atau Password Salah!");
        }
    },
    logout: () => {
        sessionStorage.clear();
        location.reload();
    }
};

/**
 * 3. MAKANAN CONTROLLER (User View)
 */
let cart = [];
const makananController = {
    index: () => {
        const keyword = document.getElementById('search-bar').value.toLowerCase();
        const container = document.getElementById('menu-container');
        container.innerHTML = '';

        const menu = db.getMenu(); 
        const filtered = menu.filter(m => m.nama.toLowerCase().includes(keyword));
        
        filtered.forEach(m => {
            container.innerHTML += `
                <div class="col-md-4 mb-4">
                    <div class="card card-menu shadow-sm h-100 border-0">
                        <div class="card-body p-4 text-center">
                            <span class="badge bg-light text-danger mb-2 px-3 rounded-pill">${m.kategori}</span>
                            <h5 class="fw-bold">${m.nama}</h5>
                            <h5 class="text-danger fw-bold">Rp ${m.harga.toLocaleString()}</h5>
                            <button onclick="makananController.addToCart(${m.id})" class="btn btn-danger w-100 rounded-pill mt-3 py-2 fw-bold">+ Keranjang</button>
                        </div>
                    </div>
                </div>`;
        });
    },
    addToCart: (id) => {
        const menu = db.getMenu();
        const item = menu.find(m => m.id === id);
        cart.push(item);
        document.getElementById('cart-badge').innerText = cart.length;
    }
};

/**
 * 4. ADMIN CONTROLLER (Management View)
 */
const adminController = {
    index: () => {
        const history = db.getHistory();
        const menu = db.getMenu();
        const totalOmzet = history.reduce((sum, t) => sum + t.total, 0);
        
        document.getElementById('st-menu').innerText = menu.length;
        document.getElementById('st-omzet').innerText = "Rp " + totalOmzet.toLocaleString();
        
        // Render Tabel Riwayat (Muncul otomatis setelah User Checkout)
        const table = document.getElementById('admin-history');
        table.innerHTML = history.map(t => `
            <tr>
                <td class="small fw-bold">${t.id}</td>
                <td>${t.pembeli}</td>
                <td class="text-danger fw-bold">Rp ${t.total.toLocaleString()}</td>
            </tr>
        `).join('');

        // Render Tabel Edit Menu
        const menuTable = document.getElementById('admin-menu-manage');
        if(menuTable) {
            menuTable.innerHTML = menu.map(m => `
                <tr>
                    <td>${m.nama}</td>
                    <td>Rp ${m.harga.toLocaleString()}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-warning rounded-pill px-2" onclick="adminController.editMenu(${m.id})"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-sm btn-danger rounded-pill px-2" onclick="adminController.deleteMenu(${m.id})"><i class="bi bi-trash"></i></button>
                    </td>
                </tr>
            `).join('');
        }
    },

    addMenu: () => {
        const nama = prompt("Nama Menu:");
        const harga = parseInt(prompt("Harga:"));
        if (!nama || isNaN(harga)) return;

        const menu = db.getMenu();
        menu.push({ id: Date.now(), nama, harga, kategori: "Umum" });
        db.saveMenu(menu);
        adminController.index();
    },

    editMenu: (id) => {
        const menu = db.getMenu();
        const item = menu.find(m => m.id === id);
        const newNama = prompt("Edit Nama Menu:", item.nama);
        const newHarga = parseInt(prompt("Edit Harga:", item.harga));

        if (newNama && !isNaN(newHarga)) {
            item.nama = newNama;
            item.harga = newHarga;
            db.saveMenu(menu);
            adminController.index();
        }
    },

    deleteMenu: (id) => {
        if (confirm("Hapus menu ini?")) {
            const menu = db.getMenu().filter(m => m.id !== id);
            db.saveMenu(menu);
            adminController.index();
        }
    }
};

/**
 * 5. UI & CHECKOUT SYSTEM
 */
const uiController = {
    // Fungsi pindah halaman (Tanpa Scroll ke bawah)
    redirect: (id) => {
        document.querySelectorAll('.view-section').forEach(s => {
            s.style.display = 'none';
            s.classList.remove('view-active');
        });
        
        const target = document.getElementById(id);
        // Cek jika halaman adalah Login agar tetap menggunakan Flexbox
        target.style.display = (id === 'v-login') ? 'flex' : 'block';
        target.classList.add('view-active');
        window.scrollTo(0, 0);
    },

    showCart: () => {
        if (cart.length === 0) return alert("Keranjang masih kosong!");
        const total = cart.reduce((s, i) => s + i.harga, 0);
        
        const content = `
            <div class="text-center">
                <h5 class="fw-bold mb-4">Total Pembayaran</h5>
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=KULINERKU" class="mb-3 rounded shadow-sm">
                <p class="text-muted small">Scan QRIS di atas</p>
                <h4 class="text-danger fw-bold mb-4">Rp ${total.toLocaleString()}</h4>
                <button onclick="uiController.processPay(${total})" class="btn btn-danger w-100 rounded-pill py-3 fw-bold shadow">SUDAH BAYAR</button>
                <button class="btn btn-link text-muted btn-sm mt-2" data-bs-dismiss="modal">Batal</button>
            </div>`;
        document.getElementById('checkout-body').innerHTML = content;
        new bootstrap.Modal(document.getElementById('modalCheckout')).show();
    },

    processPay: (total) => {
        const session = JSON.parse(sessionStorage.getItem('session'));
        const order = {
            id: "TRX-" + Date.now().toString().slice(-4),
            pembeli: session.user,
            total: total,
            waktu: new Date().toLocaleTimeString(),
            items: [...cart]
        };
        db.saveOrder(order);

        // Tampilan Struk
        document.getElementById('checkout-body').innerHTML = `
            <div class="font-monospace p-2 text-start">
                <h6 class="text-center fw-bold">KULINERKU RESTO</h6>
                <hr style="border-top: 1px dashed black">
                <div class="small mb-2">ID: ${order.id}<br>USER: ${order.pembeli}</div>
                ${cart.map(i => `<div class="d-flex justify-content-between small"><span>${i.nama}</span><span>${i.harga.toLocaleString()}</span></div>`).join('')}
                <hr style="border-top: 1px dashed black">
                <div class="d-flex justify-content-between fw-bold"><span>TOTAL</span><span>Rp ${total.toLocaleString()}</span></div>
                <button onclick="location.reload()" class="btn btn-dark w-100 rounded-pill mt-4">SELESAI</button>
            </div>`;
        cart = [];
        document.getElementById('cart-badge').innerText = "0";
    }
};