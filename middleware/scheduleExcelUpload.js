const multer = require('multer');

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/octet-stream',
]);

function fileFilter(_req, file, cb) {
    const name = (file.originalname || '').toLowerCase();
    const isExcel = name.endsWith('.xlsx') || name.endsWith('.xls');
    const mimeOk = ALLOWED_MIME_TYPES.has(file.mimetype);

    if (!isExcel && !mimeOk) {
        return cb(new Error('Разрешены только файлы Excel (.xlsx, .xls)'));
    }
    cb(null, true);
}

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter,
});

module.exports = {
    scheduleExcelUploadMiddleware: upload.single('file'),
};
