// src/controladores/tag.controlador.js

// Versão Final - 16/07/2025
exports.listar = async (req, res, conexao) => {
    const { Tag } = conexao.models;
    try {
        const tags = await Tag.findAll({ order: [['nome', 'ASC']] });
        return res.status(200).json(tags);
    } catch (erro) {
        console.error("Erro ao listar tags:", erro);
        return res.status(500).json({ mensagem: "Erro ao buscar as tags." });
    }
};