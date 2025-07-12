// src/config/database.js
require('dotenv').config();

module.exports = {
  dialect: 'postgres',
  url: process.env.DATABASE_URL, // Voltar a usar a variável de ambiente
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