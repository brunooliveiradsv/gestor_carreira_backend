// src/modelos/setlist_musica.modelo.js
const { Model, DataTypes } = require('sequelize');

class SetlistMusica extends Model {
  static init(sequelize) {
    super.init({
      setlist_id: { type: DataTypes.INTEGER, primaryKey: true },
      musica_id: { type: DataTypes.INTEGER, primaryKey: true },
      ordem: DataTypes.INTEGER,
    }, { 
      sequelize, 
      tableName: 'setlist_musicas', 
      timestamps: true, // Sequelize gerencia 'created_at' e 'updated_at'
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    })
  }
}

module.exports = SetlistMusica;