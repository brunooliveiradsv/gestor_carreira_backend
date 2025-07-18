// src/modelos/setlist.modelo.js
const { Model, DataTypes } = require('sequelize');

class Setlist extends Model {
  static init(sequelize) {
    super.init({
      nome: DataTypes.STRING,
      link_cifraclub: DataTypes.STRING,
      notas_adicionais: DataTypes.TEXT,
      publico: DataTypes.BOOLEAN, // <-- NOVO
    }, {
      sequelize,
      tableName: 'setlists'
    })
  }

  static associate(models) {
    this.belongsTo(models.Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
    this.hasMany(models.Compromisso, { foreignKey: 'setlist_id', as: 'compromissos' });
    
    // Nova associação com Musica
    this.belongsToMany(models.Musica, { 
      through: 'setlist_musicas', // Nome da tabela de ligação
      foreignKey: 'setlist_id', 
      as: 'musicas' 
    });
  }
}

module.exports = Setlist;