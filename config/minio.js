// config/minio.js
require('dotenv').config(); // Must be first
const Minio = require("minio");

const {
  MINIO_ENDPOINT,
  MINIO_PORT,
  MINIO_ACCESS_KEY,
  MINIO_SECRET_KEY,
  MINIO_BUCKET,
} = process.env;

if (!MINIO_ENDPOINT || !MINIO_PORT || !MINIO_ACCESS_KEY || !MINIO_SECRET_KEY || !MINIO_BUCKET) {
  throw new Error("MinIO environment variables are missing");
}

// Create MinIO client
const minioClient = new Minio.Client({
  endPoint: MINIO_ENDPOINT,
  port: parseInt(MINIO_PORT, 10),
  useSSL: false,
  accessKey: MINIO_ACCESS_KEY,
  secretKey: MINIO_SECRET_KEY,
});

/**
 * Ensure the bucket exists, create if not.
 */
async function ensureBucket(bucketName) {
  try {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      await minioClient.makeBucket(bucketName, ""); // region empty
      console.log(`✅ Bucket created: ${bucketName}`);
    } else {
      console.log(`✅ Using existing bucket: ${bucketName}`);
    }
  } catch (err) {
    console.error("❌ Error ensuring bucket:", err);
    throw err;
  }
}

// Immediately ensure bucket exists
(async () => {
  try {
    await ensureBucket(MINIO_BUCKET);
  } catch (err) {
    console.error("❌ MinIO setup failed:", err);
    process.exit(1); // Exit if MinIO cannot be initialized
  }
})();

module.exports = { minioClient, BUCKET_NAME: MINIO_BUCKET };
