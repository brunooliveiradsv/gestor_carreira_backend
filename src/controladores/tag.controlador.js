// src/controladores/tag.controlador.js
exports.listar = async (req, res, conexao) => {
    const { Tag } = conexao.models;
    try {
        // Busca todas as tags, ordenadas por nome.
        const tags = await Tag.findAll({ order: [['nome', 'ASC']] });
        return res.status(200).json(tags);
    } catch (erro) {
        console.error("Erro ao listar tags:", erro);
        return res.status(500).json({ mensagem: "Erro ao buscar as tags." });
    }
};