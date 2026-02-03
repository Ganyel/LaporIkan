-- =====================================================
-- Database: perikanan_db
-- Sistem Laporan Harian PPN Tegalsari
-- =====================================================

CREATE DATABASE IF NOT EXISTS perikanan_db;
USE perikanan_db;

-- =====================================================
-- Tabel: laporan_harian
-- =====================================================
CREATE TABLE IF NOT EXISTS laporan_harian (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tanggal DATE NOT NULL UNIQUE,
    stblkk INT DEFAULT 0,
    pb INT DEFAULT 0,
    asuransi_baru INT DEFAULT 0,
    asuransi_lama INT DEFAULT 0,
    bbm_subsidi_surat INT DEFAULT 0,
    bbm_non_surat INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tanggal (tanggal)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Tabel: ikan
-- =====================================================
CREATE TABLE IF NOT EXISTS ikan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_ikan VARCHAR(100) NOT NULL,
    jumlah INT NOT NULL,
    foto VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Sample Data (opsional, untuk testing)
-- =====================================================
INSERT INTO laporan_harian (tanggal, stblkk, pb, asuransi_baru, asuransi_lama, bbm_subsidi_surat, bbm_non_surat)
VALUES
('2025-01-01', 12, 8, 5, 3, 2, 1),
('2025-01-02', 15, 10, 6, 4, 3, 2),
('2025-01-03', 10, 7, 4, 2, 1, 1),
('2025-01-04', 18, 12, 7, 5, 4, 3),
('2025-01-05', 14, 9, 5, 3, 2, 2),
('2025-01-06', 16, 11, 6, 4, 3, 2),
('2025-01-07', 13, 8, 5, 3, 2, 1),
('2025-01-08', 19, 13, 8, 6, 5, 3),
('2025-01-09', 11, 7, 4, 2, 1, 1),
('2025-01-10', 17, 11, 6, 4, 3, 2),
('2025-01-15', 20, 14, 9, 7, 6, 4),
('2025-02-01', 12, 8, 5, 3, 2, 1),
('2025-02-05', 15, 10, 6, 4, 3, 2),
('2025-02-10', 18, 12, 7, 5, 4, 3),
('2025-02-15', 14, 9, 5, 3, 2, 2),
('2025-02-20', 16, 11, 6, 4, 3, 2);

INSERT INTO ikan (nama_ikan, jumlah)
VALUES
('Ikan Lele', 150),
('Ikan Nila', 200),
('Ikan Patin', 120),
('Ikan Mujair', 180),
('Ikan Tawes', 90);
