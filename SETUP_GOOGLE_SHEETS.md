# Setup Google Sheets Integration

Panduan lengkap untuk mengintegrasikan aplikasi LaporIkan dengan Google Sheets.

## 📋 Prasyarat

1. Google Cloud Account (gratis)
2. Google Sheets sudah dibuat
3. Service Account JSON key

## 🔧 Langkah-Langkah Setup

### 1. Buat Project di Google Cloud Console

1. Buka [Google Cloud Console](https://console.cloud.google.com)
2. Buat project baru dengan nama "LaporIkan"
3. Tunggu hingga project tercipta

### 2. Enable Google Sheets API

1. Di Google Cloud Console, buka **APIs & Services** → **Library**
2. Cari **Google Sheets API**
3. Klik dan tekan **ENABLE**
4. Tunggu hingga selesai

### 3. Buat Service Account

1. Di **APIs & Services**, pilih **Credentials**
2. Klik **+ CREATE CREDENTIALS**
3. Pilih **Service Account**
4. Isi nama service account: `lapor-ikan-service`
5. Klik **CREATE AND CONTINUE**
6. Skip optional steps, klik **DONE**

### 4. Generate JSON Key

1. Di halaman **Service Accounts**, klik service account yang baru dibuat
2. Buka tab **KEYS**
3. Klik **ADD KEY** → **Create new key**
4. Pilih **JSON**
5. Klik **CREATE**
6. File JSON akan otomatis di-download

### 5. Copy JSON Key ke Project

1. Rename file JSON menjadi `service-account.json`
2. Copy ke folder root project `/LaporIkan`

### 6. Buat Google Sheet untuk Data

1. Buka [Google Sheets](https://sheets.google.com)
2. Buat spreadsheet baru dengan nama "LaporIkan Data"
3. Buat sheet dengan nama:
   - `Laporan Harian` - untuk data laporan harian
   - `Data Ikan` - untuk data ikan/tangkapan

### 7. Share Sheet dengan Service Account

1. Buka file JSON yang di-download
2. Copy value dari key `client_email`
3. Buka Google Sheet yang dibuat
4. Klik **Share** 
5. Paste email service account
6. Berikan akses **Editor**

### 8. Konfigurasi .env

Tambahkan ke file `.env`:

```env
GOOGLE_SPREADSHEET_ID=<ganti-dengan-spreadsheet-id>
```

Cara mendapatkan Spreadsheet ID:
- Buka Google Sheet
- ID ada di URL: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`
- Copy bagian `{SPREADSHEET_ID}`

### 9. Setup Header Sheet

Buat header di setiap sheet:

**Laporan Harian:**
```
A1: Waktu
B1: Tanggal
C1: Data Tangkapan
D1: Data Layanan
E1: Catatan
```

**Data Ikan:**
```
A1: Waktu Sync
B1: ID Ikan
C1: Nama Ikan
D1: Harga Estimasi
E1: Stok
F1: Asal
```

## 🚀 Penggunaan API

### Sync Laporan Harian

```bash
POST /api/data-sheet/sync-laporan-harian
Content-Type: application/json

{
  "id": "001",
  "tanggal": "2024-01-15",
  "dataTangkapan": {...},
  "dataLayanan": {...},
  "catatan": "..."
}
```

### Sync Data Ikan

```bash
POST /api/data-sheet/sync-ikan
Content-Type: application/json

{
  "id": "IK001",
  "namaIkan": "Ikan Bandeng",
  "hargaEstimasi": 50000,
  "stok": 100,
  "asal": "Tambak A"
}
```

### Get Data Laporan Harian

```bash
GET /api/data-sheet/laporan-harian
```

### Get Data Ikan

```bash
GET /api/data-sheet/ikan
```

### Update Data

```bash
PUT /api/data-sheet/update-laporan
Content-Type: application/json

{
  "range": "Laporan Harian!A2:E10",
  "values": [...]
}
```

### Clear Sheet

```bash
DELETE /api/data-sheet/clear/{sheetName}
```

## 🔒 Keamanan

- File `service-account.json` sudah di-add ke `.gitignore`
- Jangan pernah share JSON key ke public
- Gunakan environment variables untuk sensitive data

## ❌ Troubleshooting

### Service Account tidak bisa akses Sheet

- Pastikan email service account sudah di-share ke Sheet
- Pastikan GOOGLE_SPREADSHEET_ID benar di .env

### API Error 404

- Pastikan sheet dengan nama yang benar sudah ada di spreadsheet
- Check spelling nama sheet (case-sensitive)

### Dependency Issue

```bash
npm install googleapis
```

## 📚 Referensi

- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [Service Account Authentication](https://cloud.google.com/docs/authentication/gcloud)
