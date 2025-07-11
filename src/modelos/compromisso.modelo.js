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
      },
      {
        sequelize,
        tableName: "compromissos",
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.Usuario, { foreignKey: "usuario_id", as: "dono" });
      // Dizendo que um Compromisso pertence a um Repertório
    this.belongsTo(models.Repertorio, { foreignKey: 'repertorio_id', as: 'repertorio' });
  }
}

module.exports = Compromisso;
