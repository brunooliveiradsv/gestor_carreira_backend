// src/controladores/musica.controlador.js
const { Op } = require("sequelize");

// Usuário: Lista as músicas do SEU repertório (cópias e criações próprias)
exports.listarRepertorioUsuario = async (req, res, conexao) => {
  const { Musica } = conexao.models;
  const usuarioId = req.usuario.id;
  try {
    const musicas = await Musica.findAll({
      where: { usuario_id: usuarioId },
      include: ["musica_mestre"], // Inclui os dados da música original, se for uma cópia
      order: [
        ["artista", "ASC"],
        ["nome", "ASC"],
      ],
    });
    return res.status(200).json(musicas);
  } catch (erro) {
    console.error("Erro ao listar repertório do usuário:", erro);
    return res.status(500).json({ mensagem: "Erro ao listar seu repertório." });
  }
};

// Usuário: Busca no banco de dados PÚBLICO de músicas
exports.buscarMusicasPublicas = async (req, res, conexao) => {
  const { Musica } = conexao.models;
  const { termoBusca = "" } = req.query;
  try {
    const musicas = await Musica.findAll({
      where: {
        is_publica: true,
        master_id: null, // Apenas músicas mestre
        [Op.or]: [
          { nome: { [Op.iLike]: `%${termoBusca}%` } },
          { artista: { [Op.iLike]: `%${termoBusca}%` } },
        ],
      },
      limit: 20,
      order: [
        ["artista", "ASC"],
        ["nome", "ASC"],
      ],
    });
    return res.status(200).json(musicas);
  } catch (error) {
    console.error("Erro ao buscar músicas públicas:", error);
    return res
      .status(500)
      .json({ mensagem: "Erro ao buscar no banco de dados de músicas." });
  }
};

// Usuário: Cria uma música manual no seu repertório
exports.criarManual = async (req, res, conexao) => {
  const { Musica } = conexao.models;
  const { nome, artista, tom, notas_adicionais } = req.body;
  if (!nome || !artista) {
    return res
      .status(400)
      .json({ mensagem: "Nome e artista são obrigatórios." });
  }
  try {
    const novaMusica = await Musica.create({
      nome,
      artista,
      tom,
      notas_adicionais,
      usuario_id: req.usuario.id,
      master_id: null, // É uma criação própria, não tem mestre
      is_publica: false,
    });
    return res.status(201).json(novaMusica);
  } catch (error) {
    console.error("Erro ao criar música manual:", erro);
    return res.status(500).json({ mensagem: "Erro ao criar música manual." });
  }
};

// Usuário: Importa uma música do banco de dados para o seu repertório
exports.importar = async (req, res, conexao) => {
  const { Musica } = conexao.models;
  const { master_id } = req.body;
  const usuarioId = req.usuario.id;

  try {
    const musicaMestre = await Musica.findOne({
      where: { id: master_id, is_publica: true, master_id: null },
    });
    if (!musicaMestre) {
      return res
        .status(404)
        .json({
          mensagem: "Música do banco de dados não encontrada ou não é pública.",
        });
    }

    // Cria uma cópia da música mestre para o usuário
    const novaCopia = await Musica.create({
      nome: musicaMestre.nome,
      artista: musicaMestre.artista,
      tom: musicaMestre.tom,
      bpm: musicaMestre.bpm,
      link_cifra: musicaMestre.link_cifra,
      // ... outros campos que queira copiar
      usuario_id: usuarioId,
      master_id: musicaMestre.id, // Linka a cópia à música mestre
      is_publica: false,
    });
    return res.status(201).json(novaCopia);
  } catch (error) {
    console.error("Erro ao importar música:", error);
    return res.status(500).json({ mensagem: "Erro ao importar música." });
  }
};

// Usuário: Atualiza uma música do SEU repertório
exports.atualizar = async (req, res, conexao) => {
  const { Musica } = conexao.models;
  const { id } = req.params;
  const usuarioId = req.usuario.id;
  try {
    const [updated] = await Musica.update(req.body, {
      where: { id, usuario_id: usuarioId },
    });
    if (updated) {
      const musicaAtualizada = await Musica.findByPk(id);
      return res.status(200).json(musicaAtualizada);
    }
    return res
      .status(404)
      .json({ mensagem: "Música não encontrada no seu repertório." });
  } catch (error) {
    console.error("Erro ao atualizar música:", erro);
    return res.status(500).json({ mensagem: "Erro ao atualizar música." });
  }
};

// Usuário: Apaga uma música do SEU repertório
exports.apagar = async (req, res, conexao) => {
  const { Musica } = conexao.models;
  const { id } = req.params;
  const usuarioId = req.usuario.id;
  try {
    const deletado = await Musica.destroy({
      where: { id, usuario_id: usuarioId },
    });
    if (deletado) {
      return res.status(204).send();
    }
    return res
      .status(404)
      .json({ mensagem: "Música não encontrada no seu repertório." });
  } catch (erro) {
    console.error("Erro ao apagar música:", erro);
    return res.status(500).json({ mensagem: "Erro ao apagar música." });
  }
};
