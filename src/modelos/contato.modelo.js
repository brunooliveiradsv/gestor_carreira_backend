// src/modelos/contato.modelo.js

const { Model, DataTypes } = require('sequelize');

class Contato extends Model {
  static init(sequelize) {
    // Define as colunas que o nosso código vai gerenciar
    super.init({
      nome: DataTypes.STRING,
      telefone: DataTypes.STRING,
      email: DataTypes.STRING,
      funcao: DataTypes.STRING,
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