// src/controladores/musica_mestre.controlador.js
const { Op } = require("sequelize");

// Função auxiliar para associar tags
const associarTags = async (musica, tagIds, conexao, transacao) => {
    if (tagIds !== undefined) {
        await conexao.query(
            'DELETE FROM musica_tags WHERE musica_id = :musicaId',
            { replacements: { musicaId: musica.id }, transaction: transacao }
        );
        if (tagIds.length > 0) {
            const associacoes = tagIds.map(tagId => ({ musica_id: musica.id, tag_id: tagId, created_at: new Date(), updated_at: new Date() }));
            await conexao.getQueryInterface().bulkInsert('musica_tags', associacoes, { transaction: transacao });
        }
    }
};

exports.listar = async (req, res, conexao) => {
    const { Musica, Tag } = conexao.models;
    try {
        const musicas = await Musica.findAll({ 
            where: { master_id: null }, 
            include: [{ model: Tag, as: 'tags', through: { attributes: [] } }],
            order: [['artista', 'ASC'], ['nome', 'ASC']] 
        });
        return res.status(200).json(musicas);
    } catch (erro) {
        return res.status(500).json({ mensagem: "Erro ao listar músicas mestre." });
    }
};

exports.criar = async (req, res, conexao) => {
    const { Musica } = conexao.models;
    const { nome, artista, tom, bpm, link_cifra, notas_adicionais, is_publica, tagIds } = req.body;
    const t = await conexao.transaction();
    
    if (!nome || !artista) return res.status(400).json({ mensagem: "Nome e artista são obrigatórios." });
    
    try {
        const novaMusica = await Musica.create({ 
            nome, artista, tom, 
            // CORREÇÃO: Converte BPM vazio para null
            bpm: (bpm === '' || bpm === undefined) ? null : parseInt(bpm, 10), 
            link_cifra, notas_adicionais, 
            is_publica: is_publica !== undefined ? is_publica : false,
            usuario_id: null, master_id: null 
        }, { transaction: t });

        await associarTags(novaMusica, tagIds || [], conexao, t);
        await t.commit();
        
        const musicaCompleta = await Musica.findByPk(novaMusica.id, { include: ['tags'] });
        return res.status(201).json(musicaCompleta);
    } catch (erro) {
        await t.rollback();
        console.error("Erro ao criar música mestre:", erro);
        return res.status(500).json({ mensagem: "Erro ao criar música mestre." });
    }
};

exports.atualizar = async (req, res, conexao) => {
    const { Musica } = conexao.models;
    const { id } = req.params;
    const { tagIds, ...dadosMusica } = req.body;
    const t = await conexao.transaction();

    try {
        const musica = await Musica.findOne({ where: { id, master_id: null }, transaction: t });
        if (!musica) {
            await t.rollback();
            return res.status(404).json({ mensagem: "Música mestre não encontrada." });
        }

        // CORREÇÃO: Converte BPM vazio para null antes de atualizar
        if (dadosMusica.bpm === '' || dadosMusica.bpm === undefined) {
            dadosMusica.bpm = null;
        }

        await musica.update(dadosMusica, { transaction: t });
        await associarTags(musica, tagIds, conexao, t);
        await t.commit();

        const musicaAtualizada = await Musica.findByPk(id, { include: ['tags'] });
        return res.status(200).json(musicaAtualizada);
    } catch (erro) {
        await t.rollback();
        console.error("Erro ao atualizar música mestre:", erro);
        return res.status(500).json({ mensagem: "Erro ao atualizar música mestre." });
    }
};

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