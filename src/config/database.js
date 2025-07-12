// src/config/database.js
require('dotenv').config();

module.exports = {
  dialect: 'postgres',
  url: process.env.DATABASE_URL,
  define: {
    timestamps: true,
    underscored: true,
  },
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    },
    // --- NOVA LINHA PARA FORÇAR O USO DE IPv4 ---
    family: 4
    // -----------------------------------------
  }
};