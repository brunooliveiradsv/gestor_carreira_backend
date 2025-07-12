// src/config/database.js
// require('dotenv').config(); // Não precisamos disto para o teste

module.exports = {
  dialect: 'postgres',
  
  // --- TESTE: URL COLOCADA DIRETAMENTE NO CÓDIGO ---
  url: 'postgresql://admin:a1tNds4uPmlrIH8XZZzkunU4xmtRO2B3@dpg-d1ojed7fte5s73be9c90-a/gestor_carreira',
  // --------------------------------------------------

  define: {
    timestamps: true,
    underscored: true,
  },
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
};