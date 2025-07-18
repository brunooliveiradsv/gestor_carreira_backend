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
      // Novos campos
      is_publica: DataTypes.BOOLEAN,
      master_id: DataTypes.INTEGER,
    }, {
      sequelize,
      tableName: 'musicas'
    })
  }

  static associate(models) {
    // Relacionamento com o dono da música (pode ser nulo para músicas mestre)
    this.belongsTo(models.Usuario, { foreignKey: "usuario_id", as: "usuario" });
    
    // Auto-relacionamento: Uma música de usuário pertence a uma música mestre
    this.belongsTo(models.Musica, { foreignKey: 'master_id', as: 'musica_mestre' });
    
    // Auto-relacionamento: Uma música mestre pode ter várias cópias de usuários
    this.hasMany(models.Musica, { foreignKey: 'master_id', as: 'copias_de_usuarios' });

    // Associações existentes
    this.belongsToMany(models.Tag, { through: "musica_tags", foreignKey: "musica_id", as: "tags" });
    this.belongsToMany(models.Setlist, { through: "setlist_musicas", foreignKey: "musica_id", as: "setlists" });
    this.hasMany(models.SugestaoMusica, { foreignKey: "musica_id", as: "sugestoes" });
  }
}

module.exports = Musica;