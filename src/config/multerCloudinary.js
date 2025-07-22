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
      // Adicione a transformação de redimensionamento aqui se ainda não o fez:
      // transformation: [
      //   { width: 1200, height: 600, crop: "limit" } 
      // ],
      public_id: filename,
    };
  },
  // --- NOVA SEÇÃO: Define os limites para o upload (agora para 20MB) ---
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB
  },
  // --- Adicione a regra de filtro de arquivo, se desejar, como no multer.js
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/pjpeg',
      'image/png',
      'image/gif',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo inválido. Apenas imagens JPEG, PNG ou GIF são permitidas.'));
    }
  },
});

module.exports = { storage };