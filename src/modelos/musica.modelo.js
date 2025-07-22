// src/modelos/musica.modelo.js
const { Model, DataTypes } = require("sequelize");

class Musica extends Model {
  static init(sequelize) {
    super.init({
      nome: DataTypes.STRING,
      artista: DataTypes.STRING,
      tom: DataTypes.STRING,
      duracao_minutos: DataTypes.STRING,
      bpm: DataTypes.INTEGER,
      link_cifra: DataTypes.STRING,
      notas_adicionais: DataTypes.TEXT,
      popularidade: DataTypes.INTEGER,
      ultima_vez_tocada: DataTypes.DATE,
      is_publica: DataTypes.BOOLEAN,
      master_id: DataTypes.INTEGER,
    }, {
      sequelize,
      tableName: 'musicas'
    })
  }

  static associate(models) {
    this.belongsTo(models.Usuario, { foreignKey: "usuario_id", as: "usuario" });
    this.belongsTo(models.Musica, { foreignKey: 'master_id', as: 'musica_mestre' });
    this.hasMany(models.Musica, { foreignKey: 'master_id', as: 'copias_de_usuarios' });
    this.belongsToMany(models.Tag, { through: "musica_tags", foreignKey: "musica_id", as: "tags" });
    this.hasMany(models.SugestaoMusica, { foreignKey: "musica_id", as: "sugestoes" });

    // --- ALTERAÇÃO AQUI ---
    // Agora usamos o modelo 'SetlistMusica' em vez de uma string
    this.belongsToMany(models.Setlist, { 
        through: models.SetlistMusica, // Alterado de "setlist_musicas"
        foreignKey: "musica_id", 
        as: "setlists" 
    });
  }
}

module.exports = Musica;