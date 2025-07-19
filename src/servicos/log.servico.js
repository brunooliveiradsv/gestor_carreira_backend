// src/servicos/log.servico.js
const registrarAcao = (conexao, userId, actionType, details = {}) => {
    const { ActivityLog } = conexao.models;
    // Usamos um 'try/catch' para garantir que uma falha no log não quebre a funcionalidade principal
    try {
        ActivityLog.create({
            user_id: userId,
            action_type: actionType,
            details: details
        });
    } catch (error) {
        console.error(`Falha ao registrar a ação no log: ${actionType} para o usuário ${userId}`, error);
    }
};

module.exports = { registrarAcao };