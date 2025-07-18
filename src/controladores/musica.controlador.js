// src/controladores/musica.controlador.js
const { Op } = require("sequelize");

// Usuário: Lista as músicas do SEU repertório (cópias e criações próprias)
exports.listarRepertorioUsuario = async (req, res, conexao) => {
  const { Musica } = conexao.models;
  const usuarioId = req.usuario.id;
  try {
    const musicas = await Musica.findAll({
      where: { usuario_id: usuarioId },
      include: ['musica_mestre'],
      order: [['artista', 'ASC'], ['nome', 'ASC']]
    });

    const repertorioProcessado = musicas.map(musica => {
        const musicaJSON = musica.toJSON();
        
        if (musicaJSON.master_id && musicaJSON.musica_mestre) {
            const mestre = musicaJSON.musica_mestre;
            
            // --- LÓGICA DE COMPARAÇÃO CORRIGIDA ---
            // Trata valores nulos/undefined como strings vazias para uma comparação justa
            const tomUsuario = musicaJSON.tom || '';
            const tomMestre = mestre.tom || '';
            const bpmUsuario = musicaJSON.bpm || null;
            const bpmMestre = mestre.bpm || null;
            const notasUsuario = musicaJSON.notas_adicionais || '';
            const notasMestre = mestre.notas_adicionais || '';
            const cifraUsuario = musicaJSON.link_cifra || '';
            const cifraMestre = mestre.link_cifra || '';

            if (tomUsuario !== tomMestre ||
                bpmUsuario !== bpmMestre ||
                notasUsuario !== notasMestre ||
                cifraUsuario !== cifraMestre) 
            {
                musicaJSON.is_modificada = true;
            }
        }
        return musicaJSON;
    });

    return res.status(200).json(repertorioProcessado);

  } catch (erro) {
    console.error("Erro ao listar repertório do usuário:", erro);
    return res.status(500).json({ mensagem: "Erro ao listar seu repertório." });
  }
};

exports.buscarPorId = async (req, res, conexao) => {
    const { Musica } = conexao.models;
    const { id } = req.params;
    const usuarioId = req.usuario.id;
    try {
        const musica = await Musica.findOne({ where: { id, usuario_id: usuarioId } });
        if (musica) {
            return res.status(200).json(musica);
        }
        return res.status(404).json({ mensagem: "Música não encontrada no seu repertório." });
    } catch (error) {
        console.error("Erro ao buscar música por ID:", error);
        return res.status(500).json({ mensagem: "Erro ao buscar música." });
    }
};

exports.buscarMusicasPublicas = async (req, res, conexao) => {
    const { Musica } = conexao.models;
    const { termoBusca = '' } = req.query;
    try {
        const musicas = await Musica.findAll({
            where: {
                is_publica: true,
                master_id: null,
                [Op.or]: [
                    { nome: { [Op.iLike]: `%${termoBusca}%` } },
                    { artista: { [Op.iLike]: `%${termoBusca}%` } },
                ]
            },
            limit: 20,
            order: [['artista', 'ASC'], ['nome', 'ASC']]
        });
        return res.status(200).json(musicas);
    } catch (error) {
        console.error("Erro ao buscar músicas públicas:", error);
        return res.status(500).json({ mensagem: "Erro ao buscar no banco de dados de músicas." });
    }
};

exports.criarManual = async (req, res, conexao) => {
    const { Musica } = conexao.models;
    const { nome, artista, tom, notas_adicionais } = req.body;
    if (!nome || !artista) {
        return res.status(400).json({ mensagem: "Nome e artista são obrigatórios." });
    }
    try {
        const novaMusica = await Musica.create({
            nome, artista, tom, notas_adicionais,
            usuario_id: req.usuario.id,
            master_id: null,
            is_publica: false
        });
        return res.status(201).json(novaMusica);
    } catch (error) {
        console.error("Erro ao criar música manual:", error);
        return res.status(500).json({ mensagem: "Erro ao criar música manual." });
    }
};

exports.importar = async (req, res, conexao) => {
    const { Musica } = conexao.models;
    const { master_id } = req.body;
    const usuarioId = req.usuario.id;
    try {
        const musicaMestre = await Musica.findOne({ where: { id: master_id, is_publica: true, master_id: null } });
        if (!musicaMestre) {
            return res.status(404).json({ mensagem: "Música do banco de dados não encontrada ou não é pública." });
        }
        
        // --- LÓGICA DE CÓPIA CORRIGIDA ---
        // Garante que todos os campos relevantes sejam copiados
        const novaCopia = await Musica.create({
            nome: musicaMestre.nome,
            artista: musicaMestre.artista,
            tom: musicaMestre.tom,
            bpm: musicaMestre.bpm,
            duracao_minutos: musicaMestre.duracao_minutos,
            link_cifra: musicaMestre.link_cifra,
            notas_adicionais: musicaMestre.notas_adicionais,
            usuario_id: usuarioId,
            master_id: musicaMestre.id,
            is_publica: false
        });
        return res.status(201).json(novaCopia);
    } catch (error) {
        console.error("Erro ao importar música:", error);
        return res.status(500).json({ mensagem: "Erro ao importar música." });
    }
};

exports.atualizar = async (req, res, conexao) => {
    const { Musica } = conexao.models;
    const { id } = req.params;
    const usuarioId = req.usuario.id;
    try {
        const [updated] = await Musica.update(req.body, { where: { id, usuario_id: usuarioId } });
        if (updated) {
            const musicaAtualizada = await Musica.findByPk(id);
            return res.status(200).json(musicaAtualizada);
        }
        return res.status(404).json({ mensagem: "Música não encontrada no seu repertório." });
    } catch (error) {
        console.error("Erro ao atualizar música:", error);
        return res.status(500).json({ mensagem: "Erro ao atualizar música." });
    }
};

exports.apagar = async (req, res, conexao) => {
    const { Musica } = conexao.models;
    const { id } = req.params;
    const usuarioId = req.usuario.id;
    try {
        const deletado = await Musica.destroy({ where: { id, usuario_id: usuarioId } });
        if (deletado) {
            return res.status(204).send();
        }
        return res.status(404).json({ mensagem: "Música não encontrada no seu repertório." });
    } catch (erro) {
        console.error("Erro ao apagar música:", erro);
        return res.status(500).json({ mensagem: "Erro ao apagar música." });
    }
};