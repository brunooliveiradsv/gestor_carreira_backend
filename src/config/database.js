// src/config/database.js
require('dotenv').config(); 
module.exports = {
  dialect: 'postgres',
  url: process.env.DATABASE_URL, // Correto, usa a variável do Render
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