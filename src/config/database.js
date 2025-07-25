// src/config/database.js
require('dotenv').config();
const path = require('path');

// Verifica se o ambiente atual é o de teste
if (process.env.NODE_ENV === 'test') {
  // Se for 'test', exporta a configuração para uma base de dados SQLite em memória.
  // Isto garante que os seus testes são rápidos e não afetam a sua base de dados real.
  module.exports = {
    dialect: 'sqlite',
    storage: ':memory:', // Chave para usar a base de dados em memória
    logging: false,      // Desliga os logs de SQL para manter a saída dos testes limpa
    define: {
      timestamps: true,
      underscored: true,
    },
  };
} else {
  // Caso contrário (para desenvolvimento ou produção), usa a configuração normal do PostgreSQL.
  const dialectOptions = {
    // Outras opções do dialectOptions podem ir aqui, se houver
  };

  // Adiciona a configuração SSL APENAS se DB_SSL_REQUIRED for 'true' no seu ficheiro .env
  // Isto é muito útil para bases de dados alojadas na nuvem (como Render, Heroku, etc.)
  if (process.env.DB_SSL_REQUIRED === 'true') {
    dialectOptions.ssl = {
      require: true,
      rejectUnauthorized: false
    };
  }

  module.exports = {
    dialect: 'postgres',
    host: process.env.DB_HOST,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    define: {
      timestamps: true,
      underscored: true,
    },
    dialectOptions: dialectOptions // Usa o objeto dialectOptions construído condicionalmente
  };
}