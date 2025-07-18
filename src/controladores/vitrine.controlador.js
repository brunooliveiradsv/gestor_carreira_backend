// src/controladores/vitrine.controlador.js
const { Op } = require("sequelize");

exports.obterVitrine = async (req, res, conexao) => {
    const { Usuario, Compromisso, Contato, Setlist, Musica, UsuarioConquista } = conexao.models;
    const { url_unica } = req.params;

    try {
        const artista = await Usuario.findOne({
            where: { url_unica },
            attributes: ['id', 'nome', 'foto_url', 'biografia', 'aplausos', 'links_redes'],
        });

        if (!artista) {
            return res.status(404).json({ mensagem: "Página do artista não encontrada." });
        }
        
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

        // --- NOVAS INFORMAÇÕES ADICIONADAS ---

        // 1. Buscar as músicas mais populares (com maior contagem de "popularidade")
        const musicasPopulares = await Musica.findAll({
            where: { usuario_id: artista.id },
            order: [['popularidade', 'DESC']],
            limit: 5,
            attributes: ['nome', 'artista', 'popularidade']
        });

        // 2. Buscar estatísticas da carreira
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

        // --- FIM DAS NOVAS INFORMAÇÕES ---

        const vitrine = {
            artista: artista.toJSON(),
            proximosShows,
            contatoPublico,
            setlistPublico,
            musicasPopulares, // <-- Novo
            estatisticas,     // <-- Novo
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

        // Incrementa o contador de aplausos em 1
        await artista.increment('aplausos', { by: 1 });

        return res.status(200).json({ aplausos: artista.aplausos + 1 });
        
    } catch (erro) {
        console.error("Erro ao registrar aplauso:", erro);
        return res.status(500).json({ mensagem: "Não foi possível registrar o aplauso." });
    }
};