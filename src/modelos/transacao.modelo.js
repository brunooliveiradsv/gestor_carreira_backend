// src/modelos/transacao.modelo.js
const { Model, DataTypes } = require("sequelize");
class Transacao extends Model {
  static init(sequelize) {
    super.init(
      {
        descricao: DataTypes.STRING,
        valor: DataTypes.DECIMAL,
        tipo: DataTypes.ENUM("receita", "despesa"),
        data: DataTypes.DATE,
        categoria: DataTypes.STRING, // <-- GARANTA QUE ESTA LINHA EXISTE
      },
      {
        sequelize,
        tableName: "transacoes",
      }
    );
  }
  static associate(models) {
    /* ... */
  }
}
module.exports = Transacao;
