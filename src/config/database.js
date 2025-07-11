// src/config/database.js
require('dotenv').config(); // Permite usar variáveis de ambiente
module.exports = {
  dialect: 'postgres',
  url: process.env.DATABASE_URL, // Vai ler a URL do Render
  define: {
    timestamps: true,
    underscored: true,
  },
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // Necessário para a conexão no Render
    }
  }
};
