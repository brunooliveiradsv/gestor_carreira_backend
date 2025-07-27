// src/modelos/feedback.modelo.js
const { DataTypes } = require('sequelize');

module.exports = (conexao) => {
  const Feedback = conexao.define('Feedback', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    // Chave estrangeira para o fã que enviou o feedback
    fa_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Fas', // O nome da sua tabela de fãs
        key: 'id',
      },
    },
    // Chave estrangeira para o artista que recebeu o feedback
    artista_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Usuarios', // O nome da sua tabela de artistas/utilizadores
        key: 'id',
      },
    },
    nota: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    comentario: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'Feedbacks',
    timestamps: true, // Adiciona os campos createdAt e updatedAt automaticamente
  });

  return Feedback;
};