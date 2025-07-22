// src/config/multerCloudinary.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const crypto = require('crypto');

// Configura a sua conta Cloudinary
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

// Configura como os ficheiros serão guardados no Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    // Gera um nome de ficheiro único para evitar conflitos
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const filename = `${randomBytes}-${file.originalname}`;
    
    return {
      folder: 'voxgest_profile_pictures', // Nome da pasta no Cloudinary
      // Remova ou ajuste 'format' se você não quiser forçar PNG para todas as imagens
      // format: 'png', 
      public_id: filename,
      // --- NOVA LINHA PARA REDIMENSIONAMENTO ---
      transformation: [
        { width: 1200, height: 600, crop: "limit" } // Exemplo: redimensiona para caber em 1200x600 pixels
        // Você pode adicionar mais transformações aqui, por exemplo, para crop ou qualidade:
        // { quality: "auto:eco" }
      ],
    };
  },
});

module.exports = { storage };