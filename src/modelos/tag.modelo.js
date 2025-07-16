// src/modelos/tag.modelo.js
const { Model, DataTypes } = require('sequelize');

class Tag extends Model {
  static init(sequelize) {
    super.init({
      nome: DataTypes.STRING,
    }, {
      sequelize,
      tableName: 'tags'
    })
  }

  static associate(models) {
    // A associação com Usuario foi REMOVIDA
    // A tag agora pertence a muitas músicas
    this.belongsToMany(models.Musica, { through: 'musica_tags', foreignKey: 'tag_id', as: 'musicas' });
  }
}

module.exports = Tag;