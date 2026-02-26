import multer from "multer";

const storage = multer.diskStorage({});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg", "image/png", "image/jpg", "image/webp", "image/gif",
    "video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed. Only images (JPG, PNG, WEBP, GIF) and videos (MP4, WEBM, MOV, AVI) are allowed.`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export default upload;