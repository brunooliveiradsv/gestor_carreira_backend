// src/controladores/log.controlador.js
exports.listarLogs = async (req, res, conexao) => {
    const { ActivityLog, Usuario } = conexao.models;
    try {
        const logs = await ActivityLog.findAll({
            include: [{
                model: Usuario,
                as: 'user',
                attributes: ['id', 'nome', 'email'] // Para sabermos quem fez a ação
            }],
            order: [['created_at', 'DESC']],
            limit: 100 // Limita aos 100 logs mais recentes para performance
        });
        return res.status(200).json(logs);
    } catch (error) {
        console.error("Erro ao buscar logs de atividade:", error);
        return res.status(500).json({ mensagem: "Erro ao carregar logs." });
    }
};