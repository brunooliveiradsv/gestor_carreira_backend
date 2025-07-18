// src/modelos/contato.modelo.js

const { Model, DataTypes } = require('sequelize');

class Contato extends Model {
  static init(sequelize) {
    super.init({
      nome: DataTypes.STRING,
      telefone: DataTypes.STRING,
      email: DataTypes.STRING,
      funcao: DataTypes.STRING,
      publico: DataTypes.BOOLEAN, // <-- NOVO
    }, {
      sequelize,
      tableName: 'contatos'
    })
  }

  // Define o relacionamento: Um Contato pertence a um Usuário
  static associate(models) {
    this.belongsTo(models.Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
  }
}

module.exports = Contato;