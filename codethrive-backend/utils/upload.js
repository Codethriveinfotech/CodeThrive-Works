const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Ensure local uploads directory exists
const localUploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(localUploadDir)) {
  fs.mkdirSync(localUploadDir, { recursive: true });
}


let storage;

// Use Cloudinary if credentials are provided, otherwise fallback to local disk storage
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'codethrive_erp',
      resource_type: 'auto',
      allowedFormats: [
        'jpeg', 'png', 'jpg', 'pdf', 'doc', 'docx', 'xls', 'xlsx',
        'zip', 'rar', '7z', 'tar', 'gz', 'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'html', 'css', 'json', 'txt'
      ]
    }
  });
  console.log('Document Storage: Using Cloudinary');
} else {
  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, localUploadDir);
    },
    filename: function (req, file, cb) {
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E6);
      cb(null, `${uniqueSuffix}-${sanitizedName}`);
    }
  });
  console.log('Document Storage: Using Local Storage (Fallback)');
}

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max for source code & archives
});

module.exports = { cloudinary, upload };

