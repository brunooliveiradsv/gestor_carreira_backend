// src/controladores/musica.controlador.js
const { Op, Sequelize } = require("sequelize");
const conquistaServico = require('../servicos/conquista.servico');

exports.listarRepertorioUsuario = async (req, res, conexao) => {
  const { Musica } = conexao.models;
  const usuarioId = req.usuario.id;
  // Voltamos a ler os múltiplos parâmetros de filtro
  const { termoBusca, tom, bpm } = req.query;

  const whereClause = { usuario_id: usuarioId };
  
  // Lógica de busca separada
  if (termoBusca) {
    whereClause[Op.or] = [
      { nome: { [Op.iLike]: `%${termoBusca}%` } },
      { artista: { [Op.iLike]: `%${termoBusca}%` } },
    ];
  }
  
  // Se filtros técnicos foram enviados, eles são adicionados como condições AND
  if (tom) {
    whereClause.tom = { [Op.iLike]: `%${tom}%` };
  }
  if (bpm) {
    whereClause.bpm = bpm;
  }

  try {
    const musicas = await Musica.findAll({
      where: whereClause,
      include: ['musica_mestre', 'tags'],
      order: [['artista', 'ASC'], ['nome', 'ASC']]
    });

    const repertorioProcessado = musicas.map(musica => {
        const musicaJSON = musica.toJSON();
        if (musicaJSON.master_id && musicaJSON.musica_mestre) {
            const mestre = musicaJSON.musica_mestre;
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
    console.error("Erro ao listar repertório do utilizador:", erro);
    return res.status(500).json({ mensagem: "Erro ao listar o seu repertório." });
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
    const usuarioId = req.usuario.id;

    if (!nome || !artista) {
        return res.status(400).json({ mensagem: "Nome e artista são obrigatórios." });
    }
    try {
        const musicaExistente = await Musica.findOne({
            where: {
                usuario_id: usuarioId,
                [Op.and]: [
                    Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('nome')), Sequelize.fn('LOWER', nome)),
                    Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('artista')), Sequelize.fn('LOWER', artista))
                ]
            }
        });

        if (musicaExistente) {
            return res.status(400).json({ mensagem: "Esta música já existe no seu repertório." });
        }

        const novaMusica = await Musica.create({
            nome, artista, tom, notas_adicionais,
            usuario_id: usuarioId,
            master_id: null,
            is_publica: false
        });
        
        conquistaServico.verificarEConcederConquistas(usuarioId, 'CONTAGEM_MUSICAS', conexao);
        
        return res.status(201).json(novaMusica);
    } catch (error) {
        console.error("Erro ao criar música manual:", error);
        return res.status(500).json({ mensagem: "Erro ao criar música manual." });
    }
};

exports.importar = async (req, res, conexao, next) => {
    const { Musica, Tag } = conexao.models;
    const { master_id } = req.body;
    const usuarioId = req.usuario.id;
    const t = await conexao.transaction();

    try {
        const musicaMestre = await Musica.findOne({ 
            where: { id: master_id, is_publica: true, master_id: null },
            include: [{ model: Tag, as: 'tags' }] // Busca a música mestre com as suas tags
        });

        if (!musicaMestre) {
            await t.rollback();
            return res.status(404).json({ mensagem: "Música do banco de dados não encontrada." });
        }
        
        const novaCopia = await Musica.create({
            // ... (cria a cópia da música com os dados da mestre)
            usuario_id: usuarioId,
            master_id: musicaMestre.id,
            is_publica: false
        }, { transaction: t });

        // Se a música mestre tiver tags, copia as associações
        if (musicaMestre.tags && musicaMestre.tags.length > 0) {
            const tagIds = musicaMestre.tags.map(tag => tag.id);
            await novaCopia.setTags(tagIds, { transaction: t });
        }

        await t.commit();
        conquistaServico.verificarEConcederConquistas(usuarioId, 'CONTAGEM_MUSICAS', conexao);
        
        const musicaComTags = await Musica.findByPk(novaCopia.id, { include: ['tags'] });
        return res.status(201).json(musicaComTags);

    } catch (error) {
        await t.rollback();
        next(error);
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