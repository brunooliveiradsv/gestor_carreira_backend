// src/controladores/enquete.controlador.js
const { Op } = require('sequelize');

// --- Funções para o utilizador gerir as suas próprias enquetes ---

exports.criarEnquete = async (req, res, conexao, next) => {
    const { Enquete, EnqueteOpcao } = conexao.models;
    const { pergunta, opcoes } = req.body;
    const usuarioId = req.usuario.id;

    if (!pergunta || !opcoes || !Array.isArray(opcoes) || opcoes.length < 2) {
        return res.status(400).json({ mensagem: 'A pergunta e pelo menos duas opções são obrigatórias.' });
    }

    const t = await conexao.transaction();
    try {
        const novaEnquete = await Enquete.create({
            pergunta,
            usuario_id: usuarioId,
            ativa: false // Começa sempre como inativa
        }, { transaction: t });

        const opcoesParaCriar = opcoes.map(texto => ({
            enquete_id: novaEnquete.id,
            texto_opcao: texto,
            votos: 0
        }));

        await EnqueteOpcao.bulkCreate(opcoesParaCriar, { transaction: t });
        await t.commit();
        
        const enqueteCompleta = await Enquete.findByPk(novaEnquete.id, { include: ['opcoes'] });
        return res.status(201).json(enqueteCompleta);
    } catch (error) {
        await t.rollback();
        next(error);
    }
};

exports.listarEnquetes = async (req, res, conexao, next) => {
    const { Enquete } = conexao.models;
    const usuarioId = req.usuario.id;
    try {
        const enquetes = await Enquete.findAll({
            where: { usuario_id: usuarioId },
            include: ['opcoes'],
            order: [['created_at', 'DESC']]
        });
        return res.status(200).json(enquetes);
    } catch (error) {
        next(error);
    }
};

exports.ativarEnquete = async (req, res, conexao, next) => {
    const { Enquete } = conexao.models;
    const { id } = req.params;
    const usuarioId = req.usuario.id;
    const t = await conexao.transaction();
    try {
        // Primeiro, desativa todas as outras enquetes do utilizador
        await Enquete.update(
            { ativa: false },
            { where: { usuario_id: usuarioId, id: { [Op.ne]: id } }, transaction: t }
        );
        // Depois, ativa a enquete escolhida
        const [updated] = await Enquete.update(
            { ativa: true },
            { where: { id, usuario_id: usuarioId }, transaction: t }
        );

        if (!updated) {
            await t.rollback();
            return res.status(404).json({ mensagem: 'Enquete não encontrada.' });
        }
        
        await t.commit();
        return res.status(200).json({ mensagem: 'Enquete ativada com sucesso no seu Showcase.' });
    } catch (error) {
        await t.rollback();
        next(error);
    }
};

exports.apagarEnquete = async (req, res, conexao, next) => {
    const { Enquete } = conexao.models;
    const { id } = req.params;
    const usuarioId = req.usuario.id;
    try {
        const deletado = await Enquete.destroy({ where: { id, usuario_id: usuarioId } });
        if (deletado) {
            return res.status(204).send();
        }
        return res.status(404).json({ mensagem: 'Enquete não encontrada.' });
    } catch (error) {
        next(error);
    }
};


// --- Função pública para votar ---

exports.votarEmOpcao = async (req, res, conexao, next) => {
    const { EnqueteOpcao } = conexao.models;
    const { idOpcao } = req.params; // ID da opção, não da enquete

    try {
        const opcao = await EnqueteOpcao.findByPk(idOpcao);
        if (!opcao) {
            return res.status(404).json({ mensagem: 'Opção da enquete não encontrada.' });
        }

        // Incrementa o contador de votos de forma atómica
        await opcao.increment('votos', { by: 1 });

        return res.status(200).json({ mensagem: 'Voto registado com sucesso!' });
    } catch (error) {
        next(error);
    }
};