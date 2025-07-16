// src/controladores/tag.controlador.js
exports.listar = async (req, res, conexao) => {
    const { Tag } = conexao.models;
    // Não precisamos mais do usuarioId aqui

    try {
        const tags = await Tag.findAll({
            // A cláusula 'where' foi removida para buscar todas as tags
            order: [['nome', 'ASC']]
        });
        return res.status(200).json(tags);
    } catch (erro) {
        console.error("Erro ao listar tags:", erro);
        return res.status(500).json({ mensagem: "Erro ao buscar tags." });
    }
};