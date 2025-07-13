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
        categoria: DataTypes.STRING,
        compromisso_id: DataTypes.INTEGER, // <-- ADICIONE ESTA LINHA
      },
      {
        sequelize,
        tableName: "transacoes",
      }
    );
  }
  static associate(models) {
    // Adicione a associação com Compromisso
    this.belongsTo(models.Compromisso, { foreignKey: 'compromisso_id', as: 'compromisso' });
    this.belongsTo(models.Usuario, { foreignKey: 'usuario_id', as: 'usuario' }); // Garanta que esta associação também existe
  }
}
module.exports = Transacao;