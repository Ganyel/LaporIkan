/**
 * Contoh Penggunaan Google Sheets Integration
 * File ini menunjukkan berbagai cara menggunakan Google Sheets API
 */

// ============================================
// 1. SYNC LAPORAN HARIAN KE GOOGLE SHEETS
// ============================================

async function contohSyncLaporanHarian() {
  const laporanData = {
    id: 'LH-2024-001',
    tanggal: '2024-01-15',
    dataTangkapan: {
      bandeng: 50,
      lele: 30,
      nila: 20,
      patin: 15
    },
    dataLayanan: {
      penyuluhan: 1,
      pelatihan: 0,
      konsultasi: 2
    },
    catatan: 'Cuaca cerah, hasil tangkapan baik'
  };

  try {
    const response = await fetch('/api/data-sheet/sync-laporan-harian', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(laporanData)
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Laporan berhasil disync ke Google Sheets');
      console.log('Data:', result.data);
      alert('Data berhasil disimpan ke Google Sheets');
    } else {
      console.error('❌ Error:', result.message);
      alert('Error: ' + result.message);
    }
  } catch (error) {
    console.error('Network error:', error);
    alert('Terjadi kesalahan koneksi');
  }
}


// ============================================
// 2. SYNC DATA IKAN KE GOOGLE SHEETS
// ============================================

async function contohSyncDataIkan() {
  const ikanData = {
    id: 'IK-001',
    namaIkan: 'Ikan Bandeng',
    hargaEstimasi: 50000,
    stok: 100,
    asal: 'Tambak A'
  };

  try {
    const response = await fetch('/api/data-sheet/sync-ikan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ikanData)
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Data ikan berhasil disync');
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Gagal sync data ikan: ' + error.message);
  }
}


// ============================================
// 3. AMBIL DATA LAPORAN DARI GOOGLE SHEETS
// ============================================

async function contohGetLaporanFromSheet() {
  try {
    const response = await fetch('/api/data-sheet/laporan-harian');
    const result = await response.json();

    if (result.success) {
      console.log('✅ Data laporan dari Google Sheets:');
      
      // result.data adalah array 2D
      // Baris pertama adalah header
      // Baris selanjutnya adalah data
      
      const headers = result.data[0];
      const dataRows = result.data.slice(1);

      console.log('Headers:', headers);
      console.log('Data rows:', dataRows);

      // Proses data
      dataRows.forEach((row, index) => {
        console.log(`Laporan ${index + 1}:`, {
          waktu: row[0],
          tanggal: row[1],
          dataTangkapan: JSON.parse(row[2]),
          dataLayanan: JSON.parse(row[3]),
          catatan: row[4]
        });
      });

      return result.data;
    }
  } catch (error) {
    console.error('Error:', error);
  }
}


// ============================================
// 4. AMBIL DATA IKAN DARI GOOGLE SHEETS
// ============================================

async function contohGetIkanFromSheet() {
  try {
    const response = await fetch('/api/data-sheet/ikan');
    const result = await response.json();

    if (result.success) {
      console.log('✅ Data ikan dari Google Sheets:');
      
      const headers = result.data[0];
      const dataRows = result.data.slice(1);

      // Buat object dari data
      const ikanList = dataRows.map(row => ({
        waktuSync: row[0],
        id: row[1],
        nama: row[2],
        harga: row[3],
        stok: row[4],
        asal: row[5]
      }));

      console.log('List Ikan:', ikanList);
      return ikanList;
    }
  } catch (error) {
    console.error('Error:', error);
  }
}


// ============================================
// 5. UPDATE DATA DI GOOGLE SHEETS
// ============================================

async function contohUpdateDataSheet() {
  try {
    const updateData = {
      range: 'Laporan Harian!A2:E2',  // Update baris kedua
      values: [
        [
          '2024-01-15 14:30:00',
          '2024-01-15',
          JSON.stringify({ bandeng: 100, lele: 50 }),
          JSON.stringify({ penyuluhan: 1 }),
          'Update data'
        ]
      ]
    };

    const response = await fetch('/api/data-sheet/update-laporan', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Data berhasil diupdate');
      return result.data;
    }
  } catch (error) {
    console.error('Error:', error);
  }
}


// ============================================
// 6. CLEAR DATA DI GOOGLE SHEETS
// ============================================

async function contohClearSheet() {
  try {
    const sheetName = 'Laporan Harian';
    
    const response = await fetch(`/api/data-sheet/clear/${encodeURIComponent(sheetName)}`, {
      method: 'DELETE'
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Sheet berhasil dikosongkan');
      return result.data;
    }
  } catch (error) {
    console.error('Error:', error);
  }
}


// ============================================
// 7. SYNC DENGAN VALIDASI DATA
// ============================================

async function contohSyncDenganValidasi() {
  // Validasi data sebelum sync
  const laporanData = {
    id: 'LH-2024-001',
    tanggal: '2024-01-15',
    dataTangkapan: {
      bandeng: 50,
      lele: 30
    },
    dataLayanan: {
      penyuluhan: 1
    },
    catatan: 'Test data'
  };

  // Validasi
  if (!laporanData.tanggal) {
    alert('Tanggal harus diisi');
    return false;
  }

  if (Object.keys(laporanData.dataTangkapan).length === 0) {
    alert('Minimal ada satu jenis ikan');
    return false;
  }

  // Data valid, lakukan sync
  try {
    const response = await fetch('/api/data-sheet/sync-laporan-harian', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(laporanData)
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Sync dengan validasi berhasil');
      return true;
    } else {
      alert('Error: ' + result.message);
      return false;
    }
  } catch (error) {
    alert('Terjadi kesalahan: ' + error.message);
    return false;
  }
}


// ============================================
// 8. SYNC MULTIPLE DATA (BATCH)
// ============================================

async function contohSyncBatch() {
  const dataArray = [
    {
      id: 'IK-001',
      namaIkan: 'Ikan Bandeng',
      hargaEstimasi: 50000,
      stok: 100,
      asal: 'Tambak A'
    },
    {
      id: 'IK-002',
      namaIkan: 'Ikan Lele',
      hargaEstimasi: 30000,
      stok: 150,
      asal: 'Tambak B'
    },
    {
      id: 'IK-003',
      namaIkan: 'Ikan Nila',
      hargaEstimasi: 40000,
      stok: 80,
      asal: 'Tambak C'
    }
  ];

  let successCount = 0;
  let failureCount = 0;

  // Sync satu per satu
  for (const ikan of dataArray) {
    try {
      const response = await fetch('/api/data-sheet/sync-ikan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ikan)
      });

      const result = await response.json();
      
      if (result.success) {
        successCount++;
        console.log(`✅ ${ikan.namaIkan} berhasil disync`);
      } else {
        failureCount++;
        console.error(`❌ ${ikan.namaIkan} gagal disync`);
      }
    } catch (error) {
      failureCount++;
      console.error(`❌ Error sync ${ikan.namaIkan}:`, error);
    }

    // Delay antara requests untuk avoid rate limit
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n📊 Sync Summary:');
  console.log(`✅ Berhasil: ${successCount}`);
  console.log(`❌ Gagal: ${failureCount}`);
}


// ============================================
// 9. HANDLE ERROR DENGAN RETRY
// ============================================

async function contohSyncDenganRetry(data, maxRetries = 3) {
  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      const response = await fetch('/api/data-sheet/sync-laporan-harian', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Sync berhasil setelah', attempts + 1, 'percobaan');
        return result;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      attempts++;
      console.warn(`⚠️ Percobaan ${attempts} gagal:`, error.message);

      if (attempts < maxRetries) {
        // Wait sebelum retry (exponential backoff)
        const waitTime = Math.pow(2, attempts) * 1000;
        console.log(`⏳ Retry dalam ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  console.error(`❌ Sync gagal setelah ${maxRetries} percobaan`);
  return null;
}


// ============================================
// 10. INTEGRASI DENGAN FORM HTML
// ============================================

function setupFormIntegration() {
  // Contoh: Auto-sync saat form disubmit
  const form = document.getElementById('laporanForm');
  
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Collect form data
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);

      // Parse JSON fields
      data.dataTangkapan = JSON.parse(formData.get('dataTangkapan') || '{}');
      data.dataLayanan = JSON.parse(formData.get('dataLayanan') || '{}');

      // Sync ke Google Sheets
      const success = await contohSyncDenganValidasi();

      if (success) {
        form.reset();
        alert('Data tersimpan dan disync ke Google Sheets');
      }
    });
  }
}


// ============================================
// EKSEKUSI CONTOH (uncomment untuk test)
// ============================================

// Uncomment salah satu untuk test:
// contohSyncLaporanHarian();
// contohSyncDataIkan();
// contohGetLaporanFromSheet();
// contohGetIkanFromSheet();
// contohUpdateDataSheet();
// contohClearSheet();
// contohSyncDenganValidasi();
// contohSyncBatch();

// Untuk retry:
// contohSyncDenganRetry({
//   id: 'LH-2024-001',
//   tanggal: '2024-01-15',
//   dataTangkapan: { bandeng: 50 },
//   dataLayanan: { penyuluhan: 1 },
//   catatan: 'Test'
// });
