// src/config/database.js
const dialectOptions = {
  // Outras opções do dialectOptions podem ir aqui, se houver
};

// Adiciona a configuração SSL APENAS se DB_SSL_REQUIRED for 'true'
if (process.env.DB_SSL_REQUIRED === 'true') {
  dialectOptions.ssl = {
    require: true,
    rejectUnauthorized: false // Para produção, talvez você queira true com certificado CA
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