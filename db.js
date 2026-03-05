const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '.env')
});

const isProduction = process.env.NODE_ENV === 'production';
let lastDbError = null;
let dbConnected = false;
let poolInstance = null;

function getEnv(name, fallbackValue) {
  const value = process.env[name];
  if (value === undefined || value === null || String(value).trim() === '') {
    if (!isProduction && fallbackValue !== undefined) {
      console.warn(`⚠️ Env ${name} kosong, fallback ke default: ${fallbackValue}`);
      return fallbackValue;
    }
    throw new Error(`Environment variable ${name} belum di-set`);
  }
  return String(value).trim();
}

function getDbConfig() {
  return {
    host: getEnv('DB_HOST', '127.0.0.1'),
    user: getEnv('DB_USER', 'root'),
    password: process.env.DB_PASSWORD || '',
    database: getEnv('DB_NAME', 'perikanan_db'),
    port: Number(getEnv('DB_PORT', 3306)),
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  };
}

function createDbUnavailableError(rootError) {
  const err = new Error('Database belum siap atau konfigurasi tidak valid');
  err.code = 'DB_NOT_READY';
  err.statusCode = 503;
  if (rootError) {
    err.cause = rootError;
  }
  return err;
}

function initPool() {
  try {
    const config = getDbConfig();
    poolInstance = mysql.createPool(config);
    return poolInstance;
  } catch (error) {
    poolInstance = null;
    dbConnected = false;
    lastDbError = {
      message: error.message,
      code: error.code || 'DB_CONFIG_ERROR'
    };
    console.error('❌ Gagal inisialisasi konfigurasi database:', lastDbError);
    return null;
  }
}

function ensurePool() {
  if (!poolInstance) {
    initPool();
  }
  if (!poolInstance) {
    throw createDbUnavailableError(lastDbError);
  }
  return poolInstance;
}

const pool = {
  async query(sql, values) {
    const instance = ensurePool();
    return instance.query(sql, values);
  },
  async getConnection() {
    const instance = ensurePool();
    return instance.getConnection();
  },
  async end() {
    if (poolInstance) {
      await poolInstance.end();
    }
  }
};

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    try {
      await connection.ping();
      const [rows] = await connection.query('SELECT 1 AS ok');
      dbConnected = true;
      lastDbError = null;
      return rows[0]?.ok === 1;
    } finally {
      connection.release();
    }
  } catch (error) {
    dbConnected = false;
    lastDbError = {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState
    };
    const details = {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState
    };
    console.error('❌ Database connection test gagal:', details);
    throw error;
  }
}

function getDbStatus() {
  return {
    connected: dbConnected,
    lastError: lastDbError
  };
}

module.exports = {
  pool,
  testConnection,
  getDbStatus
};