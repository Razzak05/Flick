import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";
import multer from "multer";

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "Flick",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [
      { width: 800, height: 600, crop: "limit" },
      { quality: "auto" },
    ],
  } as any,
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedFormats = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    if (allowedFormats.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed (jpeg, png, gif, webp)"));
    }
  },
});
