// src/servicos/email.servico.js
const nodemailer = require('nodemailer');

// Configuração do "transportador" de e-mail.
// Utilize variáveis de ambiente para as credenciais em produção!
const transportador = nodemailer.createTransport({
  host: process.env.EMAIL_HOST, // Ex: 'smtp.gmail.com'
  port: process.env.EMAIL_PORT, // Ex: 587
  secure: false, // true para porta 465, false para as outras
  auth: {
    user: process.env.EMAIL_USER, // Seu e-mail de envio
    pass: process.env.EMAIL_PASS, // A senha de app gerada no seu provedor de e-mail
  },
});

/**
 * Envia um e-mail com a nova senha para o usuário.
 * @param {string} emailDestinatario - O e-mail do usuário que receberá a nova senha.
 * @param {string} novaSenha - A nova senha gerada para o usuário.
 */
exports.enviarEmailDeRecuperacao = async (emailDestinatario, novaSenha) => {
  console.log(`Tentando enviar e-mail para: ${emailDestinatario}`);

  try {
    const info = await transportador.sendMail({
      from: `"VOXGest" <${process.env.EMAIL_USER}>`,
      to: emailDestinatario,
      subject: 'Recuperação de Senha - VOXGest',
      html: `
        <h1>Recuperação de Senha</h1>
        <p>Olá,</p>
        <p>Você solicitou a recuperação da sua senha. Sua nova senha para acessar o sistema é:</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; border: 1px solid #ddd; padding: 10px;">
          ${novaSenha}
        </p>
        <p>Recomendamos que você altere esta senha após fazer o login por uma de sua preferência.</p>
        <p>Atenciosamente,<br>Equipe VOXGest | Gestor de Carreira </p>
      `,
    });

    console.log('E-mail enviado com sucesso: %s', info.messageId);
    return true;
  } catch (erro) {
    console.error('Falha ao enviar e-mail de recuperação:', erro);
    return false;
  }
};
