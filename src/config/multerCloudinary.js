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
      format: 'png', // Converte a imagem para png
      public_id: filename,
    };
  },
});

module.exports = { storage };