// src/controladores/musica_mestre.controlador.js
const { Op } = require("sequelize");

// Admin: Lista todas as músicas mestre
exports.listar = async (req, res, conexao) => {
    const { Musica } = conexao.models;
    try {
        const musicas = await Musica.findAll({ where: { master_id: null }, order: [['artista', 'ASC'], ['nome', 'ASC']] });
        return res.status(200).json(musicas);
    } catch (erro) {
        return res.status(500).json({ mensagem: "Erro ao listar músicas mestre." });
    }
};

// Admin: Cria uma nova música mestre
exports.criar = async (req, res, conexao) => {
    const { Musica } = conexao.models;
    const { nome, artista, tom, is_publica } = req.body;
    if (!nome || !artista) {
        return res.status(400).json({ mensagem: "Nome e artista são obrigatórios." });
    }
    try {
        const novaMusica = await Musica.create({ nome, artista, tom, is_publica, usuario_id: null, master_id: null });
        return res.status(201).json(novaMusica);
    } catch (erro) {
        return res.status(500).json({ mensagem: "Erro ao criar música mestre." });
    }
};

// Admin: Atualiza uma música mestre
exports.atualizar = async (req, res, conexao) => {
    const { Musica } = conexao.models;
    const { id } = req.params;
    try {
        const [updated] = await Musica.update(req.body, { where: { id, master_id: null } });
        if (updated) {
            const musicaAtualizada = await Musica.findByPk(id);
            return res.status(200).json(musicaAtualizada);
        }
        return res.status(404).json({ mensagem: "Música mestre não encontrada." });
    } catch (erro) {
        return res.status(500).json({ mensagem: "Erro ao atualizar música mestre." });
    }
};