const {
  mapUploadedFiles,
  fileFilter,
  MAX_FILE_SIZE,
  MAX_FILES,
} = require('../middleware/homeworkUpload');

describe('homeworkUpload middleware', () => {
  describe('constants', () => {
    it('defines upload limits', () => {
      expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
      expect(MAX_FILES).toBe(5);
    });
  });

  describe('mapUploadedFiles', () => {
    it('maps multer files to API shape', () => {
      const files = [{
        originalname: 'homework.pdf',
        filename: '1234-abc.pdf',
        mimetype: 'application/pdf',
        size: 1024,
      }];
      const result = mapUploadedFiles(files);
      expect(result).toEqual([{
        originalName: 'homework.pdf',
        storedName: '1234-abc.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        url: '/uploads/homework/1234-abc.pdf',
      }]);
    });

    it('returns empty array for missing input', () => {
      expect(mapUploadedFiles()).toEqual([]);
    });
  });

  describe('fileFilter', () => {
    it('accepts allowed file types', (done) => {
      fileFilter({}, { originalname: 'doc.pdf' }, (err, ok) => {
        expect(err).toBeNull();
        expect(ok).toBe(true);
        done();
      });
    });

    it('rejects blocked executable extensions', (done) => {
      fileFilter({}, { originalname: 'virus.exe' }, (err) => {
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe('Тип файла не разрешён');
        done();
      });
    });

    it('rejects .bat files', (done) => {
      fileFilter({}, { originalname: 'script.bat' }, (err) => {
        expect(err).toBeInstanceOf(Error);
        done();
      });
    });
  });
});
