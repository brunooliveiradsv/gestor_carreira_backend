// src/modelos/feedback.modelo.js
const { Model, DataTypes } = require('sequelize');

class Feedback extends Model {
  static init(conexao) {
    super.init({
      // As colunas da tabela são definidas aqui
      nota: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
        },
      },
      comentario: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    }, {
      sequelize: conexao,
      tableName: 'Feedbacks',
    });
  }

  static associate(models) {
    // Define as associações (relações) com outras tabelas
    this.belongsTo(models.Fa, { foreignKey: 'fa_id', as: 'fa' });
    this.belongsTo(models.Usuario, { foreignKey: 'artista_id', as: 'artista' });
  }
}

module.exports = Feedback;