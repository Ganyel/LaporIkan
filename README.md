# Laporan PPN Tegalsari

Sistem pelaporan harian untuk PPN Tegalsari dengan fitur dashboard dan admin panel.

## 🎯 Fitur Utama

- ✅ **Pelaporan Harian**: Input data layanan per hari
- ✅ **Dashboard Publik**: Visualisasi data dengan grafik
- ✅ **Rekap Bulanan**: Agregasi otomatis dari data harian
- ✅ **Rekap Tahunan**: Ringkasan data per tahun
- ✅ **Admin Panel**: Kelola data dengan CRUD
- ✅ **Responsive Design**: Tampil sempurna di semua device

## 📊 Stack Teknologi

- **Backend**: Node.js + Express.js
- **Database**: MySQL
- **Frontend**: HTML5 + Bootstrap 5 + Vanilla JavaScript
- **Grafik**: Chart.js
- **API**: REST API

## 📁 Struktur Folder

```
LaporIkan/
├── public/
│   ├── css/
│   │   └── style.css          # Styling profesional
│   ├── js/
│   │   ├── dashboard.js       # Logic dashboard
│   │   └── admin.js           # Logic admin panel
│   ├── index.html             # Dashboard publik
│   └── admin.html             # Admin panel
├── routes/
│   └── laporanHarian.js       # API routes
├── server.js                  # Express server
├── db.js                      # Database connection
├── database.sql               # Database schema
├── package.json               # Dependencies
├── .env.example               # Environment variables template
└── README.md                  # Dokumentasi
```

## 🚀 Cara Menjalankan

### 1. Prasyarat
- Node.js (v14+)
- MySQL Server
- npm atau yarn

### 2. Setup Database

```bash
# Buka MySQL
mysql -u root -p

# Jalankan SQL script
SOURCE /path/to/database.sql
```

Atau jika menggunakan command line:
```bash
mysql -u root -p < database.sql
```

### 3. Setup Project

```bash
# Clone atau download project
cd LaporIkan

# Install dependencies
npm install

# Buat file .env
cp .env.example .env

# Edit .env sesuai konfigurasi MySQL Anda
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=perikanan_db
```

### 4. Jalankan Server

```bash
npm start
```

Output:
```
✅ Server berjalan di http://localhost:3000

📊 Akses Aplikasi:
   Dashboard: http://localhost:3000
   Admin: http://localhost:3000/admin
```

### 5. Akses Aplikasi

- **Dashboard**: [http://localhost:3000](http://localhost:3000)
- **Admin Panel**: [http://localhost:3000/admin](http://localhost:3000/admin)

## 📋 Panduan Penggunaan

### Admin Panel

1. Buka [http://localhost:3000/admin](http://localhost:3000/admin)
2. **Input Data**:
   - Pilih tanggal
   - Isi nilai untuk masing-masing layanan
   - Klik "Simpan Data"
3. **Edit Data**:
   - Klik "Edit" pada data yang ingin diubah
   - Ubah nilai dan simpan kembali
4. **Hapus Data**:
   - Klik "Hapus" dan konfirmasi

### Dashboard Publik

1. Buka [http://localhost:3000](http://localhost:3000)
2. **Lihat Statistik**:
   - Total STBLKK, PB, Asuransi, BBM tampil otomatis
3. **Filter Data**:
   - Pilih rentang tanggal dan klik "Terapkan Filter"
4. **Lihat Grafik**:
   - **Harian**: Line chart total layanan per hari
   - **Bulanan**: Bar chart agregasi per bulan
   - **Tahunan**: Bar chart agregasi per tahun

## 🔌 API Endpoints

### POST /api/laporan-harian
Tambah atau update data harian

```bash
curl -X POST http://localhost:3000/api/laporan-harian \
  -H "Content-Type: application/json" \
  -d '{
    "tanggal": "2025-01-20",
    "stblkk": 10,
    "pb": 5,
    "asuransi_baru": 3,
    "asuransi_lama": 2,
    "bbm_subsidi_surat": 4,
    "bbm_non_surat": 1
  }'
```

### GET /api/laporan-harian?start=YYYY-MM-DD&end=YYYY-MM-DD
Ambil data dalam range tanggal

```bash
curl "http://localhost:3000/api/laporan-harian?start=2025-01-01&end=2025-01-31"
```

### GET /api/laporan-harian/detail/:tanggal
Ambil detail satu hari

```bash
curl "http://localhost:3000/api/laporan-harian/detail/2025-01-20"
```

### GET /api/laporan-harian/rekap/bulanan/:tahun
Rekap per bulan

```bash
curl "http://localhost:3000/api/laporan-harian/rekap/bulanan/2025"
```

### GET /api/laporan-harian/rekap/tahunan
Rekap per tahun

```bash
curl "http://localhost:3000/api/laporan-harian/rekap/tahunan"
```

### DELETE /api/laporan-harian/:tanggal
Hapus data

```bash
curl -X DELETE "http://localhost:3000/api/laporan-harian/2025-01-20"
```

## 🎨 Desain & UI

- **Warna Profesional**: Menggunakan skema warna biru navy (#1e3a8a)
- **Typography**: Font system modern dengan line-height optimal
- **Responsive**: Mobile-first design, responsive di semua ukuran layar
- **Accessibility**: Semantic HTML, good contrast, keyboard navigation

## 📦 Dependencies

```json
{
  "express": "^4.18.2",
  "mysql2": "^3.6.5",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1",
  "body-parser": "^1.20.2"
}
```

## 🐛 Troubleshooting

### Error: Port 3000 sudah digunakan
```bash
# Ubah PORT di .env
PORT=3001

# Atau kill process yang menggunakan port 3000
# Windows:
taskkill /F /IM node.exe

# Linux/Mac:
lsof -ti:3000 | xargs kill -9
```

### Error: Database connection failed
- Pastikan MySQL running
- Check DB_HOST, DB_USER, DB_PASSWORD di .env
- Pastikan database `perikanan_db` sudah dibuat

### Error: Cannot find module
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

## 📄 Database Schema

### Table: laporan_harian

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | INT PK | Primary key auto increment |
| tanggal | DATE UNIQUE | Tanggal laporan |
| stblkk | INT | Jumlah STBLKK |
| pb | PB | Jumlah PB |
| asuransi_baru | INT | Asuransi baru |
| asuransi_lama | INT | Asuransi lama |
| bbm_subsidi_surat | INT | BBM subsidi dengan surat |
| bbm_non_surat | INT | BBM tanpa surat |
| created_at | TIMESTAMP | Waktu dibuat |
| updated_at | TIMESTAMP | Waktu diupdate |

## 📧 Support

Hubungi admin untuk bantuan lebih lanjut.

## 📜 License

MIT License - 2025

---

**Dibuat dengan ❤️ untuk PPN Tegalsari**
