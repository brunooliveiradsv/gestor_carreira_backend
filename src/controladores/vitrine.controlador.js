// src/controladores/vitrine.controlador.js
const { Op, fn, col } = require("sequelize");
const interacaoServico = require('../servicos/interacao.servico'); // O nosso novo serviço de interações

// NOTA: Para manter o código limpo, estas novas funções assumem que as suas rotas terão middlewares para:
// 1. Validar o JWT do fã e adicionar o objeto do fã ao request (ex: req.fa)
// 2. Encontrar o artista pela url_unica e adicioná-lo ao request (ex: req.artista)

exports.obterVitrine = async (req, res, conexao, next) => {
    const { Usuario, Compromisso, Contato, Setlist, Musica, UsuarioConquista, Post, Enquete, EnqueteOpcao, MusicaFaLike } = conexao.models;
    const { url_unica } = req.params;

    try {
        const artista = await Usuario.findOne({
            where: { url_unica },
            attributes: [
                'id', 'nome', 'foto_url', 'biografia', 'links_redes',
                'foto_capa_url', 'video_destaque_url', 'plano'
            ]
        });

        if (!artista || artista.plano !== 'premium') {
            return res.status(404).json({ mensagem: "Página do artista não encontrada." });
        }
        
        // --- INÍCIO DA CORREÇÃO ---

        // 1. Calcular as estatísticas em paralelo com as outras buscas
        const [proximosShows, totalAplausos, contatoPublico, postsRecentes, enqueteAtiva, stats] = await Promise.all([
            Compromisso.findAll({
                where: { usuario_id: artista.id, tipo: 'Show', status: 'Agendado', data: { [Op.gte]: new Date() } },
                attributes: ['id', 'nome_evento', 'data', 'local'],
                include: [{
                    model: Setlist, as: 'setlist', attributes: ['id', 'nome'],
                    include: [{ model: Musica, as: 'musicas', attributes: ['id', 'nome', 'artista'], through: { attributes: [] } }]
                }],
                order: [['data', 'ASC']],
                limit: 5
            }),
            conexao.models.Interacao.count({ where: { artista_id: artista.id, tipo: 'APLAUSO' } }),
            Contato.findOne({ where: { usuario_id: artista.id, publico: true } }),
            Post.findAll({ where: { user_id: artista.id }, order: [['created_at', 'DESC']], limit: 5 }),
            Enquete.findOne({ where: { usuario_id: artista.id, ativa: true }, include: [{ model: EnqueteOpcao, as: 'opcoes' }] }),
            // Promise.all aninhada para as contagens de estatísticas
            Promise.all([
                Compromisso.count({ where: { usuario_id: artista.id, tipo: 'Show', status: 'Realizado' } }),
                Musica.count({ where: { usuario_id: artista.id } }),
                UsuarioConquista.count({ where: { usuario_id: artista.id } })
            ])
        ]);

        const [totalShows, totalMusicas, totalConquistas] = stats;

        // 2. Montar o objeto de estatísticas
        const estatisticas = {
            shows: totalShows,
            musicas: totalMusicas,
            conquistas: totalConquistas
        };

        // --- FIM DA CORREÇÃO ---

        const vitrine = {
            artista: { ...artista.toJSON(), aplausos: totalAplausos },
            proximosShows,
            contatoPublico,
            postsRecentes,
            enqueteAtiva,
            estatisticas, // 3. Adicionar as estatísticas ao objeto de resposta
        };

        return res.status(200).json(vitrine);

    } catch (erro) {
        next(erro);
    }
};
// --- FUNÇÃO REESCRITA ---
exports.registrarAplauso = async (req, res, conexao, next) => {
    try {
        const faId = req.fa.id; // Vem do middleware de autenticação do fã
        const artistaId = req.artista.id; // Vem de um middleware que encontra o artista
        
        // Centraliza a lógica no serviço de interação
        await interacaoServico.registrarInteracao(faId, artistaId, 'APLAUSO', conexao);

        return res.status(200).json({ mensagem: 'Aplauso registado com sucesso!' });
        
    } catch (erro) {
        next(erro);
    }
};

// --- NOVA FUNÇÃO ---
exports.likeMusica = async (req, res, conexao, next) => {
    const { MusicaFaLike, Musica } = conexao.models;
    const faId = req.fa.id;
    const { id: musicaId } = req.params;

    try {
        const musica = await Musica.findByPk(musicaId, { attributes: ['usuario_id'] });
        if (!musica) {
            return res.status(404).json({ mensagem: 'Música não encontrada.' });
        }

        const likeExistente = await MusicaFaLike.findOne({ where: { fa_id: faId, musica_id: musicaId }});

        if (likeExistente) {
            await likeExistente.destroy(); // Se já gostou, remove o gosto (toggle)
        } else {
            await MusicaFaLike.create({ fa_id: faId, musica_id: musicaId });
            // Regista a interação apenas quando o "gosto" é adicionado
            await interacaoServico.registrarInteracao(faId, musica.usuario_id, 'LIKE_MUSICA', conexao, musicaId);
        }

        // Retorna a nova contagem de "gostos" para a música
        const totalLikes = await MusicaFaLike.count({ where: { musica_id: musicaId }});
        return res.status(200).json({ totalLikes });

    } catch (erro) {
        next(erro);
    }
};


// --- NOVA FUNÇÃO ---
exports.obterMusicasMaisCurtidas = async (req, res, conexao, next) => {
    const { MusicaFaLike, Musica } = conexao.models;
    const artistaId = req.artista.id;

    try {
        const musicas = await MusicaFaLike.findAll({
            attributes: [
                'musica_id',
                [fn('COUNT', col('musica_id')), 'total_likes']
            ],
            include: [{
                model: Musica,
                as: 'musica',
                attributes: ['nome', 'artista'],
                where: { usuario_id: artistaId } // Garante que são músicas do artista correto
            }],
            group: ['musica_id', 'musica.id'],
            order: [[fn('COUNT', col('musica_id')), 'DESC']],
            limit: 5,
            raw: true,
            nest: true,
        });

        return res.status(200).json(musicas);
    } catch(erro) {
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

exports.obterRankingFas = async (req, res, conexao, next) => {
    const { Interacao, Fa } = conexao.models;
    // O middleware 'encontrarArtistaPorUrl' já deve ter colocado o artista no request
    const artistaId = req.artista.id; 

    try {
        const ranking = await Interacao.findAll({
            attributes: [
                'fa_id',
                [conexao.fn('SUM', conexao.col('pontos')), 'total_pontos']
            ],
            where: { artista_id: artistaId },
            include: [{ model: Fa, as: 'fa', attributes: ['nome', 'foto_url'] }],
            group: ['fa_id', 'fa.id'],
            order: [[conexao.fn('SUM', conexao.col('pontos')), 'DESC']],
            limit: 5,
            raw: true,
            nest: true,
        });

        return res.status(200).json(ranking);
    } catch (erro) {
        next(erro);
    }
};

exports.obterLikesDoFa = async (req, res, conexao, next) => {
    const { MusicaFaLike } = conexao.models;
    const faId = req.fa.id; // ID do fã vem do token (authFaMiddleware)

    try {
        const likes = await MusicaFaLike.findAll({
            where: { fa_id: faId },
            attributes: ['musica_id'] // Só precisamos dos IDs das músicas
        });

        // Mapeia o resultado para um array simples de IDs
        const idsDasMusicasCurtidas = likes.map(like => like.musica_id);

        return res.status(200).json(idsDasMusicasCurtidas);
    } catch (erro) {
        next(erro);
    }
};