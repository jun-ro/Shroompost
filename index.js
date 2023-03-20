const express = require("express");
const multer = require("multer");
const fs = require("fs");
const mime = require("mime");
const path = require("path");
const jwt = require("jsonwebtoken");
const sharp = require("sharp");
const videoCompressor = require('video-compressor')

const app = express();
const port = 6969;
const uploadPath = path.join(__dirname, "uploads");
require("dotenv").config();

const payload = {
  userId: process.env.TOKEN,
};

const secretKey = 'ilikeball';

const options = {
  expiresIn: '1y',
};

const token = jwt.sign(payload, secretKey, options);

//const token = process.env.TOKEN;
app.use(express.static('src'));

const video_storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "backend/videos");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const image_storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "backend/images");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage: video_storage,
  fileFieldName: "video",
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB file size limit
});

const image = multer({
  storage: image_storage,
  fileFieldName: "image",
  limits: { fileSize: 20 * 1024 * 1024 },
});

const videoDirectory = path.join(__dirname, "./backend/videos");
const metaDataDir = path.join(__dirname, "./backend/data");
const imageDirectory = path.join(__dirname, "./backend/images");

if (!fs.existsSync(videoDirectory)) {
  fs.mkdirSync(videoDirectory);
}

const uploadVideo = async (filepath, token) => {
  try {
    const stat = await promisify(fs.stat)(filepath);
    const filename = path.basename(filepath);
    const form = new FormData();
    form.append('video', fs.createReadStream(filepath), { knownLength: stat.size });

    const response = await fetch('http://localhost:6969/uploadvideo', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...form.getHeaders(),
      },
      body: form,
    });

    const data = await response.text();
    console.log(data);
  } catch (err) {
    console.error(err);
  }
};

app.post('/uploadvideo', function (req, res) {
  const tokenHeader = req.headers.authorization;
  if (!tokenHeader) {
    return res.status(401).send('Missing authentication token.');
  }

  const token = tokenHeader.split(' ')[1];
  try {
    const decodedToken = jwt.verify(token, secretKey);
    const { userId } = decodedToken;

    upload.single('video')(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).send(err.message);
      } else if (err) {
        return res.status(400).send(err.message);
      }

      const { originalname, filename, size } = req.file;
      const videoPath = path.join(videoDirectory, filename);
      videoCompressor(req.file, videoPath);

      const metadataPath = path.join(
        metaDataDir,
        `${path.parse(filename).name}.json`
      );
      const metadata = {
        name: path.parse(originalname).name,
        size: size,
        thumbnail: '', // add thumbnail URL here if available
        userId: userId,
      };
      fs.writeFileSync(metadataPath, JSON.stringify(metadata));

      console.log('File uploaded successfully.');
      console.log('File name:', originalname);
      console.log('File size:', size);
      res.send('File uploaded successfully.');
    });
  } catch (err) {
    //console.error(err);
    res.status(401).send('Invalid authentication token.');
  }
});

app.post("/uploadimage", image.single("image"), async function (req, res) {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  var encodedToken = req.query.token;
  var decodedToken = Buffer.from(encodedToken, "base64").toString("ascii");
  if (decodedToken !== process.env.TOKEN) {
    return res.send("Access Denied, wrong token.");
  }

  const imageFilename = req.file.filename;

  console.log("File uploaded successfully.");
  console.log("File name:", imageFilename);
  console.log("Original file size:", req.file.size);

  // Compress the image using sharp
  const compressedImage = await sharp(req.file.path)
    .resize({ width: 500 })
    .toBuffer();

  // Write the compressed image to disk
  fs.writeFileSync(path.join(imageDirectory, imageFilename), compressedImage);
  const compressedImagePath = path.join(imageDirectory, `${imageFilename}`);
  const compressedImageStats = fs.statSync(compressedImagePath);
  const compressedImageSize = compressedImageStats.size;
  console.log("Compressed image size:", compressedImageSize);

  console.log("Compressed file size:", compressedImage.length);

  res.send("File uploaded and compressed successfully.");
});

app.get("/videos/:id", function (req, res) {
  const videoId = req.params.id;
  console.log(videoDirectory);
  const videoPath = path.join(videoDirectory, `${videoId}.mp4`);
  const metadataPath = path.join(metaDataDir, `${videoId}.json`);

  if (!fs.existsSync(videoPath) || !fs.existsSync(metadataPath)) {
    return res.status(404).send("Video not found.");
  }

  // Read the metadata file
  const metadata = JSON.parse(fs.readFileSync(metadataPath));

  // Return the metadata as JSON
  res.json(metadata);
});

app.get("/download/:id", function (req, res) {
  var downloadPath;
  const fileId = req.params.id;
  const fileExtension = path.extname(fileId);
  if (fileExtension === ".mp4") {
    downloadPath = path.join(__dirname + "/backend/videos");
  }
  if (fileExtension === ".jpg" || fileExtension === "png") {
    downloadPath = path.join(__dirname + "/backend/images");
  }
  const fileName = path.basename(fileId, fileExtension);
  const filePath = path.join(downloadPath, fileId);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found.");
  }

  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${fileName}${fileExtension}`
  );
  res.setHeader("Content-Type", mime.getType(filePath));

  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
});

app.get('/getVideoCount', function(req, res){
  const videoPath = path.join(__dirname+"/backend/videos")
  fs.readdir(videoPath, function(err, files) {
    if (err) {
      return console.log('Error reading directory: ' + err);
    }

    const count = files.length;

    // Return the count to the client
    res.send(count.toString());
  });
})

app.get('/getVideos', function(req, res) {
  const videoPath = path.join(__dirname, 'backend', 'videos');

  fs.readdir(videoPath, function(err, files) {
    if (err) {
      return console.log('Error reading directory: ' + err);
    }

    const videoNames = files.filter(function(file) {
      return path.extname(file).toLowerCase() === '.mp4';
    });

    // Return the video names to the client as a JSON array
    res.json(videoNames);
  });
});

app.get('getVideoName/:filename/', function(req, res) {
  const filename = req.params.filename;
  
  const metadataPath = path.join(metaDataDir, `${filename}.json`);
  
  try {
    const metadata = JSON.parse(fs.readFileSync(metadataPath));
    const name = metadata.name;
    
    res.send(name);
  } catch (err) {
    console.error(err);
    res.status(404).send('Metadata not found.');
  }
});

app.get('/getImages', function(req, res) {
  const directoryPath = path.join(__dirname, 'backend/images');
  fs.readdir(directoryPath, function(err, files) {
    if (err) {
      console.log('Error getting directory information.');
      res.status(500).json({ error: 'Error getting directory information.' });
    } else {
      res.json(files)
    }
  });
});

app.get("/getImage/:id", function(req, res){
  const ImageId = req.params.id;
  
  const ImagePath = path.join(__dirname, '/backend/images', ImageId)
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${ImageId}`
  );
  res.setHeader("Content-Type", mime.getType(ImagePath));
  

  const fileStream = fs.createReadStream(ImagePath);
  fileStream.pipe(res);

})




app.get("/getVideo/:id", function(req, res){
  const videoId = req.params.id;
  
  const videoPath = path.join(__dirname, '/backend/videos')

  res.sendFile(videoPath+"/"+videoId)
})

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/src/pages/index.html");
});

app.get("/images", function (req, res) {
  res.sendFile(__dirname + "/src/pages/images.html");
});


app.get("/styles", function (req, res) {
  res.sendFile(__dirname + "/src/styles/*");
});

app.listen(port, () => {
  console.log(`App is running on port ${port}`);
});
