// src/modelos/interacao.modelo.js
const { Model, DataTypes } = require('sequelize');

class Interacao extends Model {
  static init(sequelize) {
    super.init({
      tipo: DataTypes.ENUM('APLAUSO', 'LIKE_MUSICA', 'VOTO_ENQUETE'),
      entidade_id: DataTypes.STRING,
      pontos: DataTypes.INTEGER,
    }, {
      sequelize,
      tableName: 'interacoes'
    })
  }

  static associate(models) {
    // Uma interação pertence a um Fã
    this.belongsTo(models.Fa, { foreignKey: 'fa_id', as: 'fa' });
    // Uma interação pertence a um Artista (que é um Usuário)
    this.belongsTo(models.Usuario, { foreignKey: 'artista_id', as: 'artista' });
  }
}

module.exports = Interacao;