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
      timestamps: true, // Apenas o createdAt é necessário
      updatedAt: false, // Não precisamos de updatedAt para um registo de "gosto"
    })
  }

  static associate(models) {
    // Define as associações a partir deste modelo de junção
    this.belongsTo(models.Fa, { foreignKey: 'fa_id' });
    this.belongsTo(models.Musica, { foreignKey: 'musica_id' });
  }
}

module.exports = MusicaFaLike;