// src/config/database.js
module.exports = {
  dialect: 'postgres',
  host: 'localhost',
  username: 'postgres',
  password: '4682', // <<< LEMBRE-SE DE COLOCAR SUA SENHA AQUI
  database: 'gestor_carreira',
  define: {
    timestamps: true,
    underscored: true,
  },
};