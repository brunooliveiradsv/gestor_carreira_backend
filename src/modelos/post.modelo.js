// src/modelos/post.modelo.js
const { Model, DataTypes } = require('sequelize');

class Post extends Model {
  static init(sequelize) {
    super.init({
      content: DataTypes.TEXT,
      link: DataTypes.STRING,
    }, {
      sequelize,
      tableName: 'posts',
    })
  }

  static associate(models) {
    this.belongsTo(models.Usuario, { foreignKey: 'user_id', as: 'author' });
  }
}

module.exports = Post;