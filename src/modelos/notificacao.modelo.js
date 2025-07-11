const { Model, DataTypes } = require('sequelize');
class Notificacao extends Model {
  static init(sequelize) {
    super.init({
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      mensagem: DataTypes.STRING,
      lida: DataTypes.BOOLEAN,
    }, { sequelize, tableName: 'notificacoes' })
  }
  static associate(models) {
    this.belongsTo(models.Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
    this.belongsTo(models.Conquista, { foreignKey: 'conquista_id', as: 'conquista' });
  }
}
module.exports = Notificacao;