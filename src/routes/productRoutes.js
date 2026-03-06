const express = require('express');
const multer = require('multer');
const productController = require('../controllers/productController');

const router = express.Router();

// Multer configuration for Excel file uploads (memory storage, 10MB limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    const allowedExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
    
    if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'), false);
    }
  },
});

// Bulk upload routes (must be before /:id to avoid conflicts)
router.get('/bulk/template', productController.downloadTemplate);
router.post('/bulk/upload', upload.single('file'), productController.bulkUpload);

router.get('/', productController.list);
router.get('/barcode/:barcode', productController.getByBarcode);
router.get('/:id', productController.getById);
router.post('/', productController.create);
router.put('/:id', productController.update);
router.delete('/:id', productController.remove);


module.exports = router;

