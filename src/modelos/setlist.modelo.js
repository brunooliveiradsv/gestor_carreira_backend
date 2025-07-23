// src/modelos/setlist.modelo.js
const { Model, DataTypes } = require('sequelize');

class Setlist extends Model {
  static init(sequelize) {
    super.init({
      nome: DataTypes.STRING,
      notas_adicionais: DataTypes.TEXT,
      publico: DataTypes.BOOLEAN,
      publico_uuid: DataTypes.UUID,
    }, {
      sequelize,
      tableName: 'setlists'
    })
  }

  static associate(models) {
    this.belongsTo(models.Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
    this.hasMany(models.Compromisso, { foreignKey: 'setlist_id', as: 'compromissos' });
    
    // Agora usamos o modelo 'SetlistMusica' para definir a relação
    this.belongsToMany(models.Musica, { 
      through: models.SetlistMusica,
      foreignKey: 'setlist_id', 
      as: 'musicas' 
    });
  }
}

module.exports = Setlist;