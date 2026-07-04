const fs = require('fs');
const path = require('path');

const saveBase64Image = (base64String) => {
  try {
    // Check if it's a data URL
    if (!base64String.startsWith('data:image')) {
      return null; // Not a base64 image
    }

    // Extract the base64 data and mime type
    const matches = base64String.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) return null;

    const [, format, data] = matches;
    const buffer = Buffer.from(data, 'base64');
    
    // Generate unique filename
    const filename = `product-${Date.now()}-${Math.round(Math.random() * 1E9)}.${format}`;
    const filepath = path.join(__dirname, '../uploads', filename);
    
    // Save file
    fs.writeFileSync(filepath, buffer);
    
    // Return relative path to use in database
    return `/${filename}`;
  } catch (err) {
    console.error('Error saving base64 image:', err);
    return null;
  }
};

module.exports = { saveBase64Image };
