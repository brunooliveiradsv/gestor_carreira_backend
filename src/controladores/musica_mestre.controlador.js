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

// Admin: Cria uma nova música mestre com todos os campos
exports.criar = async (req, res, conexao) => {
    const { Musica } = conexao.models;
    // Extrai todos os campos possíveis do corpo da requisição
    const { nome, artista, tom, bpm, duracao_minutos, link_cifra, notas_adicionais, is_publica } = req.body;
    
    if (!nome || !artista) {
        return res.status(400).json({ mensagem: "Nome e artista são obrigatórios." });
    }
    try {
        const novaMusica = await Musica.create({ 
            nome, artista, tom, bpm, duracao_minutos, link_cifra, notas_adicionais, 
            is_publica, 
            usuario_id: null, 
            master_id: null 
        });
        return res.status(201).json(novaMusica);
    } catch (erro) {
        console.error("Erro ao criar música mestre:", erro);
        return res.status(500).json({ mensagem: "Erro ao criar música mestre." });
    }
};

// Admin: Atualiza uma música mestre com todos os campos
exports.atualizar = async (req, res, conexao) => {
    const { Musica } = conexao.models;
    const { id } = req.params;
    // Pega todos os dados do corpo da requisição para a atualização
    const { nome, artista, tom, bpm, duracao_minutos, link_cifra, notas_adicionais, is_publica } = req.body;

    try {
        const [updated] = await Musica.update({
            nome, artista, tom, bpm, duracao_minutos, link_cifra, notas_adicionais, is_publica
        }, { where: { id, master_id: null } });

        if (updated) {
            const musicaAtualizada = await Musica.findByPk(id);
            return res.status(200).json(musicaAtualizada);
        }
        return res.status(404).json({ mensagem: "Música mestre não encontrada." });
    } catch (erro) {
        console.error("Erro ao atualizar música mestre:", erro);
        return res.status(500).json({ mensagem: "Erro ao atualizar música mestre." });
    }
};

// Admin: Apaga uma música mestre
exports.apagar = async (req, res, conexao) => {
    const { Musica } = conexao.models;
    const { id } = req.params;
    try {
        const deletado = await Musica.destroy({ where: { id, master_id: null } });
        if (deletado) {
            return res.status(204).send();
        }
        return res.status(404).json({ mensagem: "Música mestre não encontrada." });
    } catch (erro) {
        if (erro.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({ mensagem: "Não é possível apagar esta música, pois ela já foi importada por um ou mais usuários." });
        }
        return res.status(500).json({ mensagem: "Erro ao apagar a música mestre." });
    }
};