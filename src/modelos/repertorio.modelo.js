// src/modelos/repertorio.modelo.js
const { Model, DataTypes } = require('sequelize');

class Repertorio extends Model {
  static init(sequelize) {
    super.init({
      nome: DataTypes.STRING,
      link_cifraclub: DataTypes.STRING,
      notas_adicionais: DataTypes.TEXT,
    }, {
      sequelize,
      tableName: 'repertorios'
    })
  }

  static associate(models) {
    // Dizendo que um Repertório pertence a um Usuário
    this.belongsTo(models.Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
    // E que um Repertório pode ter/estar em vários Compromissos
    this.hasMany(models.Compromisso, { foreignKey: 'repertorio_id', as: 'compromissos' });
  }
}

module.exports = Repertorio;