// src/modelos/post.modelo.js
const { Model, DataTypes } = require('sequelize');

class Post extends Model {
  static init(sequelize) {
    super.init({
      content: DataTypes.TEXT,
      link: DataTypes.STRING,
      likes: DataTypes.INTEGER,     // <-- NOVO
      dislikes: DataTypes.INTEGER,  // <-- NOVO
      createdAt: { type: DataTypes.DATE, field: 'created_at' },
      updatedAt: { type: DataTypes.DATE, field: 'updated_at' }
    }, {
      sequelize,
      tableName: 'posts',
      timestamps: true,
    })
  }

  static associate(models) {
    this.belongsTo(models.Usuario, { foreignKey: 'user_id', as: 'author' });
  }
}

module.exports = Post;