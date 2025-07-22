// src/middlewares/tratadorDeErros.js

const tratadorDeErros = (erro, req, res, next) => {
  // Loga o erro no console para fins de depuração (importante para o desenvolvimento)
  console.error(erro);

  // Define um status de erro padrão (500 - Internal Server Error)
  const statusCode = erro.statusCode || 500;

  // Define uma mensagem de erro padrão
  const mensagem = erro.message || 'Ocorreu um erro interno no servidor.';

  // Envia uma resposta de erro padronizada para o cliente
  res.status(statusCode).json({
    mensagem: mensagem,
    // Em ambiente de desenvolvimento, podemos também enviar o stack trace do erro
    ...(process.env.NODE_ENV === 'development' && { stack: erro.stack }),
  });
};

module.exports = tratadorDeErros;