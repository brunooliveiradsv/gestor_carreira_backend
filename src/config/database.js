// src/config/database.js

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
  }
};