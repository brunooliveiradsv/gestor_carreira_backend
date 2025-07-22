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
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    })
  }

  // --- ADICIONADO AQUI ---
  // Define as associações deste modelo de ligação
  static associate(models) {
    this.belongsTo(models.Setlist, { foreignKey: 'setlist_id', as: 'setlist' });
    this.belongsTo(models.Musica, { foreignKey: 'musica_id', as: 'musica' });
  }
}

module.exports = SetlistMusica;