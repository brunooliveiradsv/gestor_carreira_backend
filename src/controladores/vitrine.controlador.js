// src/controladores/vitrine.controlador.js
const { Op } = require("sequelize");

exports.obterVitrine = async (req, res, conexao) => {
    const { Usuario, Compromisso, Contato, Setlist, Musica, UsuarioConquista, Post } = conexao.models;
    const { url_unica } = req.params;

    try {
        // 1. Encontrar o artista pela URL única, incluindo os novos campos de capa e vídeo
        const artista = await Usuario.findOne({
            where: { url_unica },
            attributes: [
                'id', 'nome', 'foto_url', 'biografia', 'aplausos', 'links_redes',
                'foto_capa_url', 'video_destaque_url' // Campos corrigidos
            ]
        });

        if (!artista) {
            return res.status(404).json({ mensagem: "Página do artista não encontrada." });
        }
        
        // 2. Buscar os próximos shows públicos
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

        // 3. Buscar o contato público (se houver)
        const contatoPublico = await Contato.findOne({
            where: { usuario_id: artista.id, publico: true },
            attributes: ['nome', 'telefone', 'email', 'funcao']
        });
        
        // 4. Buscar o setlist público com as músicas
        const setlistPublico = await Setlist.findOne({
            where: { usuario_id: artista.id, publico: true },
            attributes: ['nome', 'notas_adicionais'],
            include: [{
                model: Musica,
                as: 'musicas',
                attributes: ['nome', 'artista'],
                through: { attributes: [] }
            }]
        });

        // 5. Buscar as músicas mais populares
        const musicasPopulares = await Musica.findAll({
            where: { usuario_id: artista.id },
            order: [['popularidade', 'DESC']],
            limit: 5,
            attributes: ['nome', 'artista', 'popularidade']
        });

        // 6. Buscar estatísticas da carreira
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

        // 7. Buscar os 5 posts mais recentes do artista
        const postsRecentes = await Post.findAll({
            where: { user_id: artista.id },
            order: [['created_at', 'DESC']],
            limit: 5
        });

        // 8. Montar o objeto de resposta final
        const vitrine = {
            artista: artista.toJSON(),
            proximosShows,
            contatoPublico,
            setlistPublico,
            musicasPopulares,
            estatisticas,
            postsRecentes,
        };

        return res.status(200).json(vitrine);

    } catch (erro) {
        console.error("Erro ao buscar dados da vitrine:", erro);
        return res.status(500).json({ mensagem: "Ocorreu um erro no servidor." });
    }
};

exports.registrarAplauso = async (req, res, conexao) => {
    const { Usuario } = conexao.models;
    const { url_unica } = req.params;

    try {
        const artista = await Usuario.findOne({ where: { url_unica } });
        if (!artista) {
            return res.status(404).json({ mensagem: "Artista não encontrado." });
        }

        const novoTotal = await artista.increment('aplausos', { by: 1 });

        return res.status(200).json({ aplausos: novoTotal.aplausos });
        
    } catch (erro) {
        console.error("Erro ao registar aplauso:", erro);
        return res.status(500).json({ mensagem: "Não foi possível registar o aplauso." });
    }
};

exports.registrarReacaoPost = async (req, res, conexao) => {
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
        console.error("Erro ao registar reação no post:", erro);
        return res.status(500).json({ mensagem: "Não foi possível registar a reação." });
    }
};