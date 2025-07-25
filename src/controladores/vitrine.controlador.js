// src/controladores/vitrine.controlador.js
const { Op } = require("sequelize");
const conquistaServico = require('../servicos/conquista.servico');

exports.obterVitrine = async (req, res, conexao, next) => {
    const { Usuario, Compromisso, Contato, Setlist, Musica, UsuarioConquista, Post, Enquete, EnqueteOpcao } = conexao.models;
    const { url_unica } = req.params;

    try {
        const artista = await Usuario.findOne({
            where: { url_unica },
            attributes: [
                'id', 'nome', 'foto_url', 'biografia', 'aplausos', 'links_redes',
                'foto_capa_url', 'video_destaque_url',
                'plano' // Precisamos de obter o plano para verificação
            ]
        });

        if (!artista) {
            return res.status(404).json({ mensagem: "Página do artista não encontrada." });
        }
        
        // --- VERIFICAÇÃO DE PLANO ADICIONADA ---
        // Se o artista for encontrado, mas o seu plano não for 'premium',
        // a página não será exibida publicamente.
        if (artista.plano !== 'premium') {
            return res.status(404).json({ mensagem: "Página do artista não encontrada." });
        }
        // --- FIM DA VERIFICAÇÃO ---
        
        const proximosShows = await Compromisso.findAll({
            where: {
                usuario_id: artista.id,
                tipo: 'Show',
                status: 'Agendado',
                data: { [Op.gte]: new Date() }
            },
            attributes: ['nome_evento', 'data', 'local'],
            order: [['data', 'ASC']],
            limit: 5
        });

        const contatoPublico = await Contato.findOne({
            where: { usuario_id: artista.id, publico: true },
            attributes: ['nome', 'telefone', 'email', 'funcao']
        });
        
        const totalShowsRealizados = await Compromisso.count({
            where: { usuario_id: artista.id, tipo: 'Show', status: 'Realizado' }
        });
        const totalMusicasNoRepertorio = await Musica.count({
            where: { usuario_id: artista.id }
        });
        const totalConquistas = await UsuarioConquista.count({
            where: { usuario_id: artista.id }
        });
        
        const estatisticas = {
            shows: totalShowsRealizados,
            musicas: totalMusicasNoRepertorio,
            conquistas: totalConquistas
        };

        const postsRecentes = await Post.findAll({
            where: { user_id: artista.id },
            order: [['created_at', 'DESC']],
            limit: 5
        });
        
        const enqueteAtiva = await Enquete.findOne({
            where: { usuario_id: artista.id, ativa: true },
            include: [{
                model: EnqueteOpcao,
                as: 'opcoes'
            }],
            order: [[{ model: EnqueteOpcao, as: 'opcoes' }, 'created_at', 'ASC']]
        });

        const vitrine = {
            artista: artista.toJSON(),
            proximosShows,
            contatoPublico,
            estatisticas,
            postsRecentes,
            enqueteAtiva,
        };

        return res.status(200).json(vitrine);

    } catch (erro) {
        next(erro);
    }
};

exports.registrarAplauso = async (req, res, conexao, next) => {
    const { Usuario } = conexao.models;
    const { url_unica } = req.params;

    try {
        const artista = await Usuario.findOne({ where: { url_unica } });
        if (!artista) {
            return res.status(404).json({ mensagem: "Artista não encontrado." });
        }

        // 1. Espera (await) que a operação de incremento termine.
        await artista.increment('aplausos', { by: 1 });
        
        // 2. Espera (await) pela verificação da conquista. Isto impede o erro 'Database handle is closed'.
        await conquistaServico.verificarEConcederConquistas(artista.id, 'CONTAGEM_APLAUSOS', conexao);

        // 3. Recarrega os dados do artista para obter o valor atualizado.
        await artista.reload();

        // 4. Envia a resposta com o valor correto e atualizado.
        return res.status(200).json({ aplausos: artista.aplausos });
        
    } catch (erro) {
        next(erro);
    }
};

exports.registrarReacaoPost = async (req, res, conexao, next) => {
    const { Post } = conexao.models;
    const { id } = req.params;
    const { tipo } = req.body;

    if (tipo !== 'like' && tipo !== 'dislike') {
        return res.status(400).json({ mensagem: "Tipo de reação inválido." });
    }

    try {
        const post = await Post.findByPk(id);
        if (!post) {
            return res.status(404).json({ mensagem: "Publicação não encontrada." });
        }

        if (tipo === 'like') {
            await post.increment('likes', { by: 1 });
        } else {
            await post.increment('dislikes', { by: 1 });
        }

        return res.status(200).json({ mensagem: "Reação registada." });
        
    } catch (erro) {
        next(erro);
    }
};