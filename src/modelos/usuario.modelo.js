const { Model, DataTypes } = require('sequelize');
class Usuario extends Model {
  static init(sequelize) {
    super.init({
      nome: DataTypes.STRING, email: DataTypes.STRING, senha: DataTypes.STRING, role: DataTypes.STRING,
    }, { sequelize, tableName: 'usuarios' })
  }
  static associate(models) {
    this.hasMany(models.Compromisso, { foreignKey: 'usuario_id', as: 'compromissos' });
    this.hasMany(models.Contato, { foreignKey: 'usuario_id', as: 'contatos' });
    this.hasMany(models.Transacao, { foreignKey: 'usuario_id', as: 'transacoes' });
    this.hasMany(models.Repertorio, { foreignKey: 'usuario_id', as: 'repertorios' });
    this.hasMany(models.Notificacao, { foreignKey: 'usuario_id', as: 'notificacoes' });
    this.hasMany(models.Equipamento, { foreignKey: 'usuario_id', as: 'equipamentos' });
    this.belongsToMany(models.Conquista, { through: models.UsuarioConquista, foreignKey: 'usuario_id', as: 'conquistas' });
    
  }
}
module.exports = Usuario;