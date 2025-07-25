// src/__mocks__/multer-storage-cloudinary.js

// Simula a classe CloudinaryStorage
class CloudinaryStorage {
  constructor(options) {
    // Apenas guardamos as opções para referência, se necessário
    this.options = options;
  }

  // Simula os métodos que o multer chama
  _handleFile(req, file, cb) {
    // Simula um upload bem-sucedido e retorna um caminho falso
    cb(null, { path: 'https://res.cloudinary.com/fake-cloud/image/upload/fake_image.jpg' });
  }

  _removeFile(req, file, cb) {
    cb(null);
  }
}

module.exports = {
  CloudinaryStorage,
};