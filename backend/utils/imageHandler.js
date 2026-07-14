const cloudinary = require('../config/cloudinary');

// Uploads a single base64 data URL to Cloudinary and returns its permanent,
// CDN-backed secure URL. Anything that isn't a base64 data URL (e.g. an
// already-hosted http(s) URL) is passed through untouched.
const uploadBase64Image = async (input) => {
  if (typeof input !== 'string') return null;
  if (!input.startsWith('data:image')) return input;

  try {
    const result = await cloudinary.uploader.upload(input, {
      folder: 'sam-collection/products',
      resource_type: 'image',
    });
    return result.secure_url;
  } catch (err) {
    console.error('Cloudinary upload error:', err.message);
    return null; // dropped by the caller's .filter(Boolean)
  }
};

// Uploads every base64 image in an array in parallel. Non-base64 entries
// (existing URLs) pass through untouched; failed uploads are dropped.
const uploadProductImages = async (images = []) => {
  const uploaded = await Promise.all(images.map(uploadBase64Image));
  return uploaded.filter(Boolean);
};

// Best-effort delete of a Cloudinary-hosted image given its secure_url.
// Safe to call on non-Cloudinary URLs (external links etc.) — it no-ops.
const deleteCloudinaryImage = async (url) => {
  if (typeof url !== 'string' || !url.includes('res.cloudinary.com')) return;
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
    if (!match) return;
    await cloudinary.uploader.destroy(match[1]);
  } catch (err) {
    console.error('Cloudinary delete error:', err.message);
  }
};

module.exports = { uploadProductImages, deleteCloudinaryImage };
