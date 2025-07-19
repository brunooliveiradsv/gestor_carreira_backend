// src/controladores/post.controlador.js
exports.criar = async (req, res, conexao) => {
    const { Post } = conexao.models;
    const { content, link } = req.body;
    const userId = req.usuario.id;

    if (!content) {
        return res.status(400).json({ mensagem: "O conteúdo da publicação é obrigatório." });
    }

    try {
        const novoPost = await Post.create({ content, link, user_id: userId });
        return res.status(201).json(novoPost);
    } catch (error) {
        console.error("Erro ao criar post:", error);
        return res.status(500).json({ mensagem: "Erro ao criar a publicação." });
    }
};

exports.listarPorUsuario = async (req, res, conexao) => {
    const { Post } = conexao.models;
    const userId = req.usuario.id;
    try {
        const posts = await Post.findAll({
            where: { user_id: userId },
            order: [['created_at', 'DESC']]
        });
        return res.status(200).json(posts);
    } catch (error) {
        return res.status(500).json({ mensagem: "Erro ao listar publicações." });
    }
};

exports.apagar = async (req, res, conexao) => {
    const { Post } = conexao.models;
    const { id } = req.params;
    const userId = req.usuario.id;
    try {
        const deletado = await Post.destroy({ where: { id, user_id: userId } });
        if (deletado) {
            return res.status(204).send();
        }
        return res.status(404).json({ mensagem: "Publicação não encontrada." });
    } catch (error) {
        return res.status(500).json({ mensagem: "Erro ao apagar a publicação." });
    }
};