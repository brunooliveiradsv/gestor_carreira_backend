// src/config/multer.js
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

module.exports = {
  // Define o diretório de destino dos arquivos
  dest: path.resolve(__dirname, "..", "..", "tmp", "uploads"),

  // Define como os arquivos serão armazenados
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.resolve(__dirname, "..", "..", "tmp", "uploads"));
    },
    filename: (req, file, cb) => {
      // Gera um nome de arquivo único para evitar conflitos
      crypto.randomBytes(16, (err, hash) => {
        if (err) cb(err);

        const fileName = `${hash.toString("hex")}-${file.originalname}`;
        cb(null, fileName);
      });
    },
  }),

  // Define os limites para o upload
  limits: {
    // AQUI ESTÁ A CORREÇÃO: Aumentado de 2MB para 20MB
    fileSize: 20 * 1024 * 1024,
  },

  // Filtra os tipos de arquivo permitidos
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "image/jpeg",
      "image/pjpeg",
      "image/png",
      "image/gif",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true); // Aceita o arquivo
    } else {
      cb(new Error("Tipo de arquivo inválido.")); // Rejeita o arquivo
    }
  },
};
