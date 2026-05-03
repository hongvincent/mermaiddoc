const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Multer configuration for .md file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.md' || ext === '.markdown' || ext === '.txt') {
      cb(null, true);
    } else {
      cb(new Error('Only .md, .markdown, and .txt files are allowed'));
    }
  },
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// File upload endpoint — returns the raw markdown text
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const filePath = path.join(__dirname, 'uploads', req.file.filename);
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    res.json({
      filename: req.file.originalname,
      content,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read uploaded file' });
  }
});

// Error handler for multer
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

app.listen(PORT, () => {
  console.log(`MermaidDoc server running at http://localhost:${PORT}`);
});
