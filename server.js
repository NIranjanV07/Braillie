const express = require('express');
const { SerialPort } = require('serialport');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const cors = require('cors');
const fs = require('fs'); // ✅ added

const app = express();
const port = 3000;

// 🔌 ESP32 Serial
const arduinoPort = 'COM4';

let serialPort;

try {
  serialPort = new SerialPort({
    path: arduinoPort,
    baudRate: 115200
  });

  serialPort.on('open', () => {
    console.log("✅ Serial Port Opened");
  });

} catch (err) {
  console.log("⚠️ Serial not connected");
}

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.use(cors());

// 📁 Upload config
const upload = multer({ dest: 'uploads/' });

/* 🔹 TEXT INPUT */
app.post('/send', (req, res) => {
  const data = req.body.data;
  console.log("Text:", data);

  if (serialPort && serialPort.isOpen) {
    serialPort.write(data + '\n');
  }

  res.send("OK");
});

/* 🔹 IMAGE OCR (FINAL VERSION) */
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    // ✅ check file exists
    if (!req.file) {
      return res.json({ text: "No file uploaded" });
    }

    const imagePath = req.file.path;
    const fileName = req.file.originalname;

    console.log("📁 File:", fileName);
    console.log("🖼️ Processing image...");

    // 🔥 OCR PROCESS
    const result = await Tesseract.recognize(imagePath, 'eng', {
      logger: m => console.log(m) // progress log
    });

    let text = result.data.text;

    // ✨ Clean text
    text = text.replace(/\s+/g, ' ').trim();

    console.log("📜 OCR TEXT:", text);

    // 🔌 Send to ESP32
    if (serialPort && serialPort.isOpen) {
      serialPort.write(text + '\n');
    }

    // 🧹 delete uploaded file
    fs.unlinkSync(imagePath);

    res.json({ text });

  } catch (err) {
    console.error("❌ OCR ERROR:", err);
    res.status(500).json({ text: "OCR Error" });
  }
});

// 🚀 START SERVER
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});