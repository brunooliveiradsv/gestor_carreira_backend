// src/controladores/sugestao.controlador.js
const { Musica } = require('../modelos/musica.modelo');

exports.criarSugestao = async (req, res, conexao) => {
    const { SugestaoMusica, Musica } = conexao.models;
    const { musica_id } = req.params; // ID da música do *usuário* que está na tela
    const { campo_sugerido, valor_sugerido } = req.body;
    const usuarioId = req.usuario.id;

    if (!campo_sugerido || !valor_sugerido) {
        return res.status(400).json({ mensagem: "O campo e o valor da sugestão são obrigatórios." });
    }

    try {
        // Verifica se a música que o usuário está tentando alterar é uma cópia de uma mestre
        const musicaDoUsuario = await Musica.findOne({ where: { id: musica_id, usuario_id: usuarioId } });
        
        if (!musicaDoUsuario) {
            return res.status(404).json({ mensagem: "Música não encontrada no seu repertório." });
        }

        if (!musicaDoUsuario.master_id) {
            return res.status(403).json({ mensagem: "Você só pode sugerir alterações para músicas importadas do banco de dados." });
        }

        // Cria a sugestão apontando para a música MESTRE original
        const novaSugestao = await SugestaoMusica.create({
            musica_id: musicaDoUsuario.master_id, 
            usuario_id: usuarioId,
            campo_sugerido,
            valor_sugerido,
            status: 'pendente'
        });
        return res.status(201).json(novaSugestao);
    } catch (erro) {
        console.error("Erro ao criar sugestão:", erro);
        return res.status(500).json({ mensagem: "Erro ao enviar a sua sugestão." });
    }
};

/**
 * Lista todas as sugestões com o status 'pendente' para o painel de administração.
 */
exports.listarSugestoesPendentes = async (req, res, conexao) => {
    const { SugestaoMusica, Musica, Usuario } = conexao.models;
    try {
        const sugestoes = await SugestaoMusica.findAll({
            where: { status: 'pendente' },
            include: [
                { model: Musica, as: 'musica', attributes: ['nome', 'artista'] },
                { model: Usuario, as: 'autor', attributes: ['nome', 'email'] }
            ],
            order: [['created_at', 'ASC']]
        });
        return res.status(200).json(sugestoes);
    } catch (erro) {
        console.error("Erro ao listar sugestões pendentes:", erro);
        return res.status(500).json({ mensagem: "Erro ao buscar sugestões pendentes." });
    }
};

/**
 * Aprova uma sugestão, atualizando a música original e o status da sugestão.
 */
exports.aprovarSugestao = async (req, res, conexao) => {
    const { SugestaoMusica, Musica } = conexao.models;
    const { id } = req.params;
    const t = await conexao.transaction();

    try {
        const sugestao = await SugestaoMusica.findByPk(id, { transaction: t });

        if (!sugestao || sugestao.status !== 'pendente') {
            await t.rollback();
            return res.status(404).json({ mensagem: "Sugestão não encontrada ou já processada." });
        }

        const dadosParaAtualizar = {};
        dadosParaAtualizar[sugestao.campo_sugerido] = sugestao.valor_sugerido;

        // PASSO 1: Atualiza a música MESTRE com os dados da sugestão
        await Musica.update(
            dadosParaAtualizar,
            { where: { id: sugestao.musica_id }, transaction: t }
        );

        // PASSO 2: Atualiza o status da sugestão
        await sugestao.update({ status: 'aprovada' }, { transaction: t });

        await t.commit();
        return res.status(200).json({ mensagem: "Sugestão aprovada e música atualizada com sucesso!" });

    } catch (erro) {
        await t.rollback();
        console.error("Erro ao aprovar sugestão:", erro);
        return res.status(500).json({ mensagem: "Erro ao processar a aprovação." });
    }
};

/**
 * Rejeita uma sugestão, alterando o seu status.
 */
exports.rejeitarSugestao = async (req, res, conexao) => {
    const { SugestaoMusica } = conexao.models;
    const { id } = req.params;
    try {
        const [updated] = await SugestaoMusica.update(
            { status: 'rejeitada' },
            { where: { id, status: 'pendente' } }
        );

        if (updated) {
            return res.status(200).json({ mensagem: "Sugestão rejeitada com sucesso." });
        }
        return res.status(404).json({ mensagem: "Sugestão não encontrada ou já processada." });

    } catch (erro) {
        console.error("Erro ao rejeitar sugestão:", erro);
        return res.status(500).json({ mensagem: "Erro ao processar a rejeição." });
    }
};