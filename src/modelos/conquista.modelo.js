const { Model, DataTypes } = require('sequelize');
class Conquista extends Model {
  static init(sequelize) {
    super.init({
      nome: DataTypes.STRING, descricao: DataTypes.STRING, icone: DataTypes.STRING, tipo_condicao: DataTypes.STRING, valor_condicao: DataTypes.INTEGER,
    }, { sequelize, tableName: 'conquistas' })
  }
  static associate(models) {
    this.belongsToMany(models.Usuario, { through: models.UsuarioConquista, foreignKey: 'conquista_id', as: 'usuarios' });
    this.hasMany(models.Notificacao, { foreignKey: 'conquista_id', as: 'notificacoes' });
  }
}
module.exports = Conquista;