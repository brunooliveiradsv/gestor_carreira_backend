// src/modelos/activity_log.modelo.js
const { Model, DataTypes } = require('sequelize');

class ActivityLog extends Model {
  static init(sequelize) {
    super.init({
      action_type: DataTypes.STRING,
      details: DataTypes.JSONB,
    }, {
      sequelize,
      tableName: 'activity_logs',
      timestamps: true, // <-- ADICIONE ESTA LINHA
    })
  }

  static associate(models) {
    this.belongsTo(models.Usuario, { foreignKey: 'user_id', as: 'user' });
  }
}

module.exports = ActivityLog;