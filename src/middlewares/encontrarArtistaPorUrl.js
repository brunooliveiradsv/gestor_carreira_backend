// src/middlewares/encontrarArtistaPorUrl.js
module.exports = async (req, res, conexao, next) => {
    const { Usuario } = conexao.models;
    const { url_unica } = req.params;

    try {
        const artista = await Usuario.findOne({ where: { url_unica } });

        if (!artista || artista.plano !== 'premium') {
            return res.status(404).json({ mensagem: "Página do artista não encontrada." });
        }

        // Adiciona o objeto do artista ao request para ser usado nas próximas funções
        req.artista = artista;
        return next();

    } catch (error) {
        return res.status(500).json({ mensagem: "Ocorreu um erro no servidor." });
    }
};