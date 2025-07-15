// src/modelos/compromisso.modelo.js

const { Model, DataTypes } = require("sequelize");

class Compromisso extends Model {
  static init(sequelize) {
    super.init(
      {
        tipo: DataTypes.STRING,
        nome_evento: DataTypes.STRING,
        data: DataTypes.DATE,
        local: DataTypes.STRING,
        status: DataTypes.STRING,
        valor_cache: DataTypes.DECIMAL,
        despesas: DataTypes.JSONB,
        // O campo da chave estrangeira é definido na migração,
        // mas o Sequelize precisa de o conhecer.
        setlist_id: DataTypes.INTEGER 
      },
      {
        sequelize,
        tableName: "compromissos",
      }
    );
  }

  static associate(models) {
    // Associação com o dono do compromisso
    this.belongsTo(models.Usuario, { foreignKey: "usuario_id", as: "dono" });

    // --- ASSOCIAÇÃO CORRIGIDA ---
    // Agora, um Compromisso pertence a um Setlist.
    // A foreignKey foi renomeada para 'setlist_id' na migração.
    this.belongsTo(models.Setlist, { foreignKey: 'setlist_id', as: 'setlist' });
  }
}

module.exports = Compromisso;