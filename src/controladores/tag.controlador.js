// src/controladores/tag.controlador.js

/**
 * Lista todas as tags predefinidas do sistema.
 * A função agora é global e não depende mais do utilizador.
 */
exports.listar = async (req, res, conexao) => {
    const { Tag } = conexao.models;

    try {
        const tags = await Tag.findAll({
            // A cláusula "where" para usuario_id foi removida.
            order: [['nome', 'ASC']]
        });
        return res.status(200).json(tags);
    } catch (erro) {
        console.error("Erro ao listar tags:", erro);
        return res.status(500).json({ mensagem: "Erro ao buscar as tags." });
    }
};