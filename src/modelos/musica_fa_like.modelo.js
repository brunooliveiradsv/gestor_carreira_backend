// src/modelos/musica_fa_like.modelo.js
const { Model, DataTypes } = require('sequelize');

class MusicaFaLike extends Model {
  static init(sequelize) {
    super.init({
      fa_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
      },
      musica_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
      },
    }, {
      sequelize,
      tableName: 'musica_fa_likes',
      timestamps: true,
      updatedAt: false,
    })
  }

  static associate(models) {
    this.belongsTo(models.Fa, { foreignKey: 'fa_id' });
    
    // --- CORREÇÃO AQUI ---
    // Adicionamos o 'as: "musica"' para corresponder à query do controlador.
    this.belongsTo(models.Musica, { foreignKey: 'musica_id', as: 'musica' });
  }
}

module.exports = MusicaFaLike;