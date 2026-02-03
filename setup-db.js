const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function importDatabase() {
    try {
        console.log('🔄 Membaca file database.sql...');
        const sqlFile = fs.readFileSync(path.join(__dirname, 'database.sql'), 'utf-8');

        console.log('📡 Menghubungkan ke MySQL...');
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            multipleStatements: true
        });

        console.log('⚙️  Menjalankan SQL statements...');
        try {
            await connection.query(sqlFile);
        } catch (error) {
            if (error.message.includes('Duplicate entry')) {
                console.log('⚠️  Database sudah ada (data tidak akan duplikasi)');
            } else {
                throw error;
            }
        }

        console.log('✅ Database siap digunakan!');
        console.log('\n📊 Database: perikanan_db');
        console.log('📋 Tabel: laporan_harian');
        console.log('📝 Sample data: tersedia');

        // Cek data yang ada
        const [rows] = await connection.query('SELECT COUNT(*) as count FROM perikanan_db.laporan_harian');
        console.log(`📈 Total records: ${rows[0].count}`);

        await connection.end();
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

importDatabase();
