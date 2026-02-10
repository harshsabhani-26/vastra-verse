import { v2 as cloudinary } from 'cloudinary';

// Server-side Cloudinary configuration
// IMPORTANT: This file should ONLY be imported in server-side code (API routes, server actions)
// Never import this in client components or it will expose your API secrets

// Configure Cloudinary with environment variables
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

// Validate configuration on module load (server-side only)
if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
    console.warn('⚠️  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set');
}
if (!process.env.CLOUDINARY_API_KEY) {
    console.warn('⚠️  CLOUDINARY_API_KEY is not set');
}
if (!process.env.CLOUDINARY_API_SECRET) {
    console.warn('⚠️  CLOUDINARY_API_SECRET is not set');
}

export default cloudinary;

// Types for upload response
export interface CloudinaryUploadResult {
    public_id: string;
    version: number;
    signature: string;
    width: number;
    height: number;
    format: string;
    resource_type: string;
    created_at: string;
    bytes: number;
    type: string;
    url: string;
    secure_url: string;
}


