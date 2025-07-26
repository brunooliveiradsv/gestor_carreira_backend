// src/modelos/fa.modelo.js
const { Model, DataTypes } = require('sequelize');

class Fa extends Model {
  static init(sequelize) {
    super.init({
      google_id: DataTypes.STRING,
      nome: DataTypes.STRING,
      email: DataTypes.STRING,
      foto_url: DataTypes.STRING,
    }, {
      sequelize,
      tableName: 'fas' // O nome da tabela na base de dados
    })
  }

  static associate(models) {
    // Um fã pode ter muitas interações
    this.hasMany(models.Interacao, { foreignKey: 'fa_id', as: 'interacoes' });
    
    // Um fã pode gostar de muitas músicas (relação N:M)
    this.belongsToMany(models.Musica, { 
        through: 'musica_fa_likes', // Nome da tabela de junção
        foreignKey: 'fa_id', 
        as: 'musicas_curtidas' 
    });
  }
}

module.exports = Fa;