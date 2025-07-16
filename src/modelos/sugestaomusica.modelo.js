// src/modelos/sugestao_musica.modelo.js
const { Model, DataTypes } = require('sequelize');

class SugestaoMusica extends Model {
  static init(sequelize) {
    super.init({
      campo_sugerido: DataTypes.STRING,
      valor_sugerido: DataTypes.TEXT,
      status: DataTypes.ENUM('pendente', 'aprovada', 'rejeitada'),
    }, {
      sequelize,
      tableName: 'sugestao_musicas'
    })
  }

  static associate(models) {
    // Uma sugestão pertence a uma Música
    this.belongsTo(models.Musica, { foreignKey: 'musica_id', as: 'musica' });
    // Uma sugestão pertence a um Usuário
    this.belongsTo(models.Usuario, { foreignKey: 'usuario_id', as: 'autor' });
  }
}

module.exports = SugestaoMusica;