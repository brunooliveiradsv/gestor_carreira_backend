// src/modelos/enquete_opcao.modelo.js
const { Model, DataTypes } = require('sequelize');

class EnqueteOpcao extends Model {
  static init(sequelize) {
    super.init({
      texto_opcao: DataTypes.STRING,
      votos: DataTypes.INTEGER,
    }, {
      sequelize,
      tableName: 'enquete_opcoes'
    })
  }

  static associate(models) {
    this.belongsTo(models.Enquete, { foreignKey: 'enquete_id', as: 'enquete' });
  }
}

module.exports = EnqueteOpcao;