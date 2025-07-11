// src/middlewares/admin.js

// A lógica agora está dentro de uma função que é retornada
module.exports = () => {
  return (req, res, next) => {
    // A verificação continua a mesma
    if (req.usuario && req.usuario.role === "admin") {
      return next();
    }

    return res
      .status(403)
      .json({ mensagem: "Acesso negado. Requer nível de administrador." });
  };
};
