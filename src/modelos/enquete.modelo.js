// src/modelos/enquete.modelo.js
const { Model, DataTypes } = require('sequelize');

class Enquete extends Model {
  static init(sequelize) {
    super.init({
      pergunta: DataTypes.STRING,
      ativa: DataTypes.BOOLEAN,
    }, {
      sequelize,
      tableName: 'enquetes'
    })
  }

  static associate(models) {
    this.belongsTo(models.Usuario, { foreignKey: 'usuario_id', as: 'autor' });
    this.hasMany(models.EnqueteOpcao, { foreignKey: 'enquete_id', as: 'opcoes' });
  }
}

module.exports = Enquete;