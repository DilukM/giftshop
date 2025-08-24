import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

// Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log(
  "Cloudinary configured with folder:",
  process.env.CLOUDINARY_CLOUD_NAME
);
// Create a multer instance that stores files in memory
const memoryStorage = multer.memoryStorage();
const memoryUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB default limit
});

// Middleware factory: returns an array of middlewares [multerMemory.single(field), uploadToCloudinary]
export const uploadEReceipt = (fieldName = "eReceipt", options = {}) => {
  const folder =
    options.folder || process.env.CLOUDINARY_FOLDER || "e_receipts";

  // middleware that uploads buffer to Cloudinary
  const uploadToCloud = async (req, res, next) => {
    if (!req.file || !req.file.buffer) return next();

    try {
      const streamUpload = (buffer) =>
        new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder, resource_type: "auto" },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );

          streamifier.createReadStream(buffer).pipe(uploadStream);
        });

      const result = await streamUpload(req.file.buffer);
      // Attach cloudinary response to req.file so controllers can use it
      req.file.cloudinary = {
        public_id: result.public_id,
        url: result.url,
        secure_url: result.secure_url,
        format: result.format,
        bytes: result.bytes,
      };

      // Also set path to secure_url for backward compatibility with previous code
      req.file.path = result.secure_url;

      return next();
    } catch (err) {
      return next(err);
    }
  };

  return [memoryUpload.single(fieldName), uploadToCloud];
};

export default uploadEReceipt;
