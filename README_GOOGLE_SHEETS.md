# Google Sheets Integration Guide

Dokumentasi lengkap untuk integrasi Google Sheets di aplikasi LaporIkan.

## 📊 Fitur Integrasi

- ✅ Sync otomatis laporan harian ke Google Sheets
- ✅ Sync data ikan/tangkapan ke Google Sheets
- ✅ Ambil data dari Google Sheets
- ✅ Update data di Google Sheets
- ✅ Clear/reset data sheet

## 🏗️ Arsitektur

```
Frontend (HTML/JS)
    ↓
Express Server (REST API)
    ↓
googleSheets.js (API Handler)
    ↓
Google Sheets API
    ↓
Google Sheets Document
```

## 📁 File-File Terkait

- `googleSheets.js` - Class utama untuk handle Google Sheets API
- `routes/googleSheets.js` - Express routes untuk Google Sheets endpoints
- `service-account.json` - Credentials (jangan di-commit!)
- `SETUP_GOOGLE_SHEETS.md` - Panduan setup lengkap

## 🔌 API Endpoints

### 1. Sync Laporan Harian
```http
POST /api/data-sheet/sync-laporan-harian
Content-Type: application/json

{
  "id": "001",
  "tanggal": "2024-01-15",
  "dataTangkapan": {
    "bandeng": 50,
    "lele": 30
  },
  "dataLayanan": {
    "penyuluhan": 1,
    "pelatihan": 0
  },
  "catatan": "Cuaca baik"
}

Response (Success):
{
  "success": true,
  "message": "Data berhasil disync ke Google Sheets",
  "data": {...}
}
```

### 2. Sync Data Ikan
```http
POST /api/data-sheet/sync-ikan
Content-Type: application/json

{
  "id": "IK001",
  "namaIkan": "Ikan Bandeng",
  "hargaEstimasi": 50000,
  "stok": 100,
  "asal": "Tambak A"
}

Response (Success):
{
  "success": true,
  "message": "Data ikan berhasil disync ke Google Sheets",
  "data": {...}
}
```

### 3. Get Laporan Harian
```http
GET /api/data-sheet/laporan-harian

Response (Success):
{
  "success": true,
  "data": [
    ["2024-01-15 10:30:00", "2024-01-15", "{...}", "{...}", "Catatan..."],
    [...]
  ]
}
```

### 4. Get Data Ikan
```http
GET /api/data-sheet/ikan

Response (Success):
{
  "success": true,
  "data": [
    ["2024-01-15 10:30:00", "IK001", "Ikan Bandeng", "50000", "100", "Tambak A"],
    [...]
  ]
}
```

### 5. Update Data
```http
PUT /api/data-sheet/update-laporan
Content-Type: application/json

{
  "range": "Laporan Harian!A2:E5",
  "values": [
    ["2024-01-15 10:30:00", "2024-01-15", "Data baru", "Data baru", "Update"]
  ]
}

Response (Success):
{
  "success": true,
  "message": "Data berhasil diupdate di Google Sheets",
  "data": {...}
}
```

### 6. Clear Sheet
```http
DELETE /api/data-sheet/clear/Laporan%20Harian

Response (Success):
{
  "success": true,
  "message": "Sheet Laporan Harian berhasil dikosongkan",
  "data": {...}
}
```

## 💻 Contoh Penggunaan JavaScript

### Sync Laporan Harian
```javascript
async function syncLaporanKeSheet(laporan) {
  try {
    const response = await fetch('/api/data-sheet/sync-laporan-harian', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(laporan)
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Berhasil sync ke Google Sheets');
      return result.data;
    } else {
      console.error('❌ Error:', result.message);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

// Penggunaan
syncLaporanKeSheet({
  id: '001',
  tanggal: '2024-01-15',
  dataTangkapan: { bandeng: 50, lele: 30 },
  dataLayanan: { penyuluhan: 1 },
  catatan: 'Cuaca baik'
});
```

### Ambil Data dari Google Sheets
```javascript
async function getLaporanFromSheet() {
  try {
    const response = await fetch('/api/data-sheet/laporan-harian');
    const result = await response.json();
    
    if (result.success) {
      console.log('Laporan dari Sheet:', result.data);
      return result.data;
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Penggunaan
const laporan = await getLaporanFromSheet();
```

## 🔧 Konfigurasi Environment

File `.env` harus berisi:

```env
# Google Sheets
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here

# Server
PORT=3000
NODE_ENV=development

# Database (jika ada)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=lapor_ikan
```

## 🛡️ Error Handling

Semua endpoint akan return error response jika terjadi masalah:

```json
{
  "success": false,
  "message": "Deskripsi error",
  "error": "Detail error message"
}
```

Common errors:
- `Google Sheets API tidak terinisialisasi` - service-account.json tidak ditemukan atau .env tidak valid
- `Sheet tidak ditemukan` - Nama sheet di API tidak sesuai dengan Google Sheets
- `Permission denied` - Service account belum di-share ke Google Sheet

## 📝 Catatan Penting

1. **Service Account JSON**: File ini sensitive, sudah di-add ke `.gitignore`
2. **Spreadsheet ID**: Harus diset di `.env`, jangan hard-code di code
3. **Sheet Names**: Case-sensitive, harus sesuai dengan yang di Google Sheets
4. **Rate Limiting**: Google Sheets API memiliki rate limit, perhatikan saat bulk sync

## 🚀 Performance Tips

1. Batch multiple data syncs dalam satu request jika memungkinkan
2. Cache data lokal sebelum sync ke sheet
3. Gunakan pagination untuk get data yang banyak
4. Implement retry mechanism untuk failed syncs

## 📚 Dokumentasi Lanjutan

- [Setup Google Sheets](./SETUP_GOOGLE_SHEETS.md) - Panduan lengkap setup
- [Admin Google Sheets](./ADMIN_GOOGLE_SHEETS.md) - Fitur admin untuk manage data
- [Google Sheets API Docs](https://developers.google.com/sheets/api)
