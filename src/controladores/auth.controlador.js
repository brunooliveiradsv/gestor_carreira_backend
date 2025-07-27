// src/controladores/auth.controlador.js
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');

// A sua Google Client ID (a mesma que usou no frontend) deve estar no seu .env
const client = new OAuth2Client(process.env.VITE_GOOGLE_CLIENT_ID);

exports.googleCallback = async (req, res, conexao, next) => {
    const { credential } = req.body;

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

        // 2. Procura se o fã já existe ou cria um novo
        const [fa] = await Fa.findOrCreate({
            where: { google_id },
            defaults: { email, nome, foto_url }
        });

        // 3. Gera um token JWT para o fã usando um segredo específico para fãs
        const tokenFa = jwt.sign(
            { id: fa.id, nome: fa.nome, email: fa.email, foto_url: fa.foto_url },
            process.env.JWT_SECRET_FA, // MELHORIA: Usar um segredo JWT diferente para fãs
            { expiresIn: '7d' } // Aumentado para 7 dias
        );

        // 4. Envia apenas o token de volta, como o frontend espera
        return res.status(200).json({ token: tokenFa });

    } catch (error) {
        // Log do erro detalhado no console do servidor para depuração
        console.error("Erro na autenticação com Google:", error.message); 
        return res.status(401).json({ mensagem: 'Credencial do Google inválida ou expirada. Verifique as suas configurações de API.' });
    }
};