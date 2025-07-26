// src/controladores/auth.controlador.js
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');

// A sua Google Client ID (a mesma que usou no frontend) deve estar no seu .env
const client = new OAuth2Client(process.env.VITE_GOOGLE_CLIENT_ID);

exports.googleCallback = async (req, res, conexao, next) => {
    const { credential } = req.body; // O token JWT que o frontend envia

    if (!credential) {
        return res.status(400).json({ mensagem: 'Credencial do Google não fornecida.' });
    }

    try {
        // 1. Verifica a credencial com os servidores do Google
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.VITE_GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        const { sub: google_id, email, name: nome, picture: foto_url } = payload;

        const { Fa } = conexao.models;

        // 2. Procura se o fã já existe na sua base de dados
        let fa = await Fa.findOne({ where: { google_id } });

        // 3. Se não existir, cria um novo registo para o fã
        if (!fa) {
            fa = await Fa.create({
                google_id,
                email,
                nome,
                foto_url
            });
        }

        // 4. Gera um token JWT para o fã (diferente do token do artista)
        const tokenFa = jwt.sign(
            { id: fa.id, nome: fa.nome, email: fa.email, foto_url: fa.foto_url },
            process.env.JWT_SECRET, // Pode usar o mesmo segredo ou um diferente
            { expiresIn: '24h' }
        );

        // 5. Envia o token e os dados do fã de volta para o frontend
        return res.status(200).json({
            mensagem: 'Login de fã bem-sucedido!',
            token: tokenFa,
            fa: { id: fa.id, nome: fa.nome, email: fa.email, foto_url: fa.foto_url }
        });

    } catch (error) {
        console.error("Erro na autenticação com Google:", error);
        return res.status(401).json({ mensagem: 'Credencial do Google inválida ou expirada.' });
    }
};