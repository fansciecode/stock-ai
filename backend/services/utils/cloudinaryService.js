import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with your credentials
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export class CloudinaryService {
    async uploadImage(file) {
        try {
            const result = await cloudinary.uploader.upload(file.path);
            return {
                url: result.secure_url,
                publicId: result.public_id,
                format: result.format,
                width: result.width,
                height: result.height
            };
        } catch (error) {
            console.error('Cloudinary upload error:', error);
            throw error;
        }
    }

    async deleteImage(publicId) {
        try {
            await cloudinary.uploader.destroy(publicId);
            return true;
        } catch (error) {
            console.error('Cloudinary delete error:', error);
            throw error;
        }
    }

    async optimizeImage(publicId, options = {}) {
        try {
            return cloudinary.url(publicId, {
                quality: options.quality || 'auto',
                fetch_format: options.format || 'auto',
                width: options.width || null,
                height: options.height || null,
                crop: options.crop || 'scale'
            });
        } catch (error) {
            console.error('Cloudinary optimization error:', error);
            throw error;
        }
    }
}

export default new CloudinaryService(); 