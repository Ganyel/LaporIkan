# Admin Google Sheets Dashboard

Fitur admin untuk mengelola Google Sheets dari dashboard aplikasi.

## 🎯 Fitur

- 📊 View data dari Google Sheets
- ✏️ Edit data di Google Sheets
- ➕ Tambah data baru
- 🗑️ Hapus data
- 📥 Sync data dari aplikasi ke Sheet
- 📤 Import data dari Google Sheets ke aplikasi
- 📈 Analisis dan reporting

## 🔌 Admin Endpoints

Endpoints khusus untuk admin yang require authentication.

### Get Sheet Status
```http
GET /api/admin/sheet-status
Authorization: Bearer {token}

Response:
{
  "success": true,
  "status": {
    "connected": true,
    "spreadsheetId": "xxxxx",
    "sheets": [
      {
        "name": "Laporan Harian",
        "rowCount": 150
      },
      {
        "name": "Data Ikan",
        "rowCount": 50
      }
    ]
  }
}
```

### Bulk Sync
```http
POST /api/admin/bulk-sync
Authorization: Bearer {token}
Content-Type: application/json

{
  "type": "laporan",  // atau "ikan"
  "startDate": "2024-01-01",
  "endDate": "2024-01-31"
}

Response:
{
  "success": true,
  "message": "Sync berhasil",
  "recordsSynced": 45,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Export to Google Sheets
```http
POST /api/admin/export-to-sheet
Authorization: Bearer {token}
Content-Type: application/json

{
  "type": "laporan",
  "format": "full",  // atau "summary"
  "period": "monthly"
}
```

### Import from Google Sheets
```http
POST /api/admin/import-from-sheet
Authorization: Bearer {token}
Content-Type: application/json

{
  "sheetName": "Laporan Harian",
  "targetTable": "laporan_harian",
  "startRow": 2
}
```

### Get Sheet Data Preview
```http
GET /api/admin/sheet-preview/:sheetName?limit=10
Authorization: Bearer {token}

Response:
{
  "success": true,
  "sheetName": "Laporan Harian",
  "totalRows": 150,
  "preview": [...]
}
```

## 🛠️ Admin Panel Setup

Tambahkan ke `server.js`:

```javascript
// Admin Google Sheets routes
const adminGoogleSheetsRoutes = require('./routes/adminGoogleSheets');
app.use('/api/admin/sheets', adminGoogleSheetsRoutes);
```

## 👤 Authentication

Semua admin endpoints memerlukan token:

```javascript
// Request example
const response = await fetch('/api/admin/sheet-status', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## 📱 Admin UI Components

### Sheet Viewer Component
```html
<div id="sheet-viewer">
  <div class="sheet-selector">
    <select id="sheet-list">
      <option value="">-- Pilih Sheet --</option>
    </select>
  </div>
  
  <div class="sheet-data">
    <table id="sheet-table">
      <!-- Data dari API -->
    </table>
  </div>
  
  <div class="sheet-actions">
    <button onclick="syncToSheet()">Sync ke Sheet</button>
    <button onclick="importFromSheet()">Import dari Sheet</button>
    <button onclick="clearSheet()">Clear Data</button>
  </div>
</div>
```

### Sheet Editor Component
```html
<div id="sheet-editor">
  <form id="edit-form">
    <div class="form-group">
      <label>Sheet Name</label>
      <input type="text" id="sheet-name" readonly>
    </div>
    
    <div class="form-group">
      <label>Range</label>
      <input type="text" id="range-input" placeholder="A1:E10">
    </div>
    
    <div class="form-group">
      <label>Data (JSON)</label>
      <textarea id="data-input"></textarea>
    </div>
    
    <button type="submit">Update Data</button>
  </form>
</div>
```

## 💾 Implementation Example

Buat file `routes/adminGoogleSheets.js`:

```javascript
const express = require('express');
const router = express.Router();
const googleSheetsAPI = require('../googleSheets');
const db = require('../db');

// Check admin auth middleware
const checkAdminAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token === process.env.ADMIN_TOKEN) {
    next();
  } else {
    res.status(401).json({ success: false, message: 'Unauthorized' });
  }
};

// Apply middleware
router.use(checkAdminAuth);

// Get sheet status
router.get('/status', async (req, res) => {
  try {
    // Implementasi logic
    res.json({ success: true, status: 'connected' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bulk sync
router.post('/bulk-sync', async (req, res) => {
  try {
    // Implementasi logic
    res.json({ success: true, recordsSynced: 0 });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
```

## 🔐 Security Considerations

1. **Admin Token**: Gunakan token yang aman dan kompleks
2. **Access Control**: Batasi akses hanya ke admin yang authorized
3. **Audit Log**: Catat semua aktivitas admin
4. **Rate Limiting**: Implement rate limit untuk bulk operations
5. **Data Validation**: Validate semua input sebelum update ke Sheet

## 📊 Monitoring

Setup monitoring untuk Google Sheets integration:

```javascript
// Log semua aktivitas
const logSheetActivity = (action, status, details) => {
  console.log(`[Sheet ${action}] ${status}:`, details);
  // Simpan ke database atau log file
};
```

## 🚀 Best Practices

1. **Backup Data**: Selalu backup spreadsheet sebelum bulk operations
2. **Test di Development**: Test semua fitur di development terlebih dahulu
3. **Schedule Syncs**: Gunakan cron jobs untuk automatic sync
4. **Error Handling**: Implement robust error handling dan retry logic
5. **Documentation**: Update dokumentasi ketika ada perubahan API

## 📝 Troubleshooting

### Data tidak sync ke Sheet
- Check koneksi internet
- Verify service account credentials
- Check GOOGLE_SPREADSHEET_ID di .env
- Lihat logs untuk error details

### Permission Error
- Pastikan service account sudah di-share ke spreadsheet
- Verify service account email
- Check Google Cloud IAM permissions

### API Rate Limit
- Implement exponential backoff
- Cache data untuk reduce API calls
- Batch operations jika memungkinkan
