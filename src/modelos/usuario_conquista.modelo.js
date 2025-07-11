const { Model, DataTypes } = require('sequelize');
class UsuarioConquista extends Model {
  static init(sequelize) {
    super.init({
      usuario_id: { type: DataTypes.INTEGER, primaryKey: true },
      conquista_id: { type: DataTypes.INTEGER, primaryKey: true },
      data_desbloqueio: DataTypes.DATE,
    }, { sequelize, tableName: 'usuario_conquistas', timestamps: false })
  }
}
module.exports = UsuarioConquista;