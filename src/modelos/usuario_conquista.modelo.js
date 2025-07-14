// src/modelos/usuario_conquista.modelo.js
const { Model, DataTypes } = require('sequelize');

class UsuarioConquista extends Model {
  static init(sequelize) {
    super.init({
      usuario_id: { type: DataTypes.INTEGER, primaryKey: true },
      conquista_id: { type: DataTypes.INTEGER, primaryKey: true },
      data_desbloqueio: DataTypes.DATE,
    }, { sequelize, tableName: 'usuario_conquistas', timestamps: false })
  }

  // Este método define as relações
  static associate(models) {
    // Diz que uma linha em 'usuario_conquistas' pertence a um 'Usuario'
    this.belongsTo(models.Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
    // E também pertence a uma 'Conquista'
    this.belongsTo(models.Conquista, { foreignKey: 'conquista_id', as: 'conquista' });
  }
}

module.exports = UsuarioConquista;