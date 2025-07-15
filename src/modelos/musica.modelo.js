// src/modelos/musica.modelo.js
const { Model, DataTypes } = require("sequelize");

class Musica extends Model {
  static init(sequelize) {
    super.init(
      {
        nome: DataTypes.STRING,
        artista: DataTypes.STRING,
        tom: DataTypes.STRING,
        duracao_segundos: DataTypes.INTEGER,
        link_cifra: DataTypes.STRING,
        link_letra: DataTypes.STRING,
        link_video: DataTypes.STRING,
        notas_adicionais: DataTypes.TEXT,
        popularidade: DataTypes.INTEGER,
        ultima_vez_tocada: DataTypes.DATE,
      },
      {
        sequelize,
        tableName: "musicas",
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.Usuario, { foreignKey: "usuario_id", as: "usuario" });
    this.belongsToMany(models.Tag, {
      through: "musica_tags",
      foreignKey: "musica_id",
      as: "tags",
    });
    this.belongsToMany(models.Setlist, { through: 'setlist_musicas', foreignKey: 'musica_id', as: 'setlists' });
  }
}

module.exports = Musica;
