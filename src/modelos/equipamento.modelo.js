// src/modelos/equipamento.modelo.js
const { Model, DataTypes } = require('sequelize');

class Equipamento extends Model {
  static init(sequelize) {
    super.init({
      nome: DataTypes.STRING,
      marca: DataTypes.STRING,
      modelo: DataTypes.STRING,
      tipo: DataTypes.STRING,
      notas: DataTypes.TEXT,
      // --- LINHAS NOVAS ---
      valor_compra: DataTypes.DECIMAL,
      data_compra: DataTypes.DATE,
    }, {
      sequelize,
      tableName: 'equipamentos'
    })
  }

  static associate(models) {
    this.belongsTo(models.Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
  }
}

module.exports = Equipamento;