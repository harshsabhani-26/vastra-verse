import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import cloudinary, { type CloudinaryUploadResult } from "@/lib/cloudinary";

// Prevent Next.js from caching upload responses
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    const startTime = performance.now();

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        const allowedVideoTypes = ["video/mp4", "video/webm"];
        const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];

        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "Only JPG, PNG, WebP images and MP4, WebM videos are allowed" },
                { status: 400 }
            );
        }

        // Validate file size
        // 5MB for images, 50MB for videos
        const isVideo = file.type.startsWith('video/');
        const MAX_SIZE = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;

        if (file.size > MAX_SIZE) {
            return NextResponse.json(
                { error: `File size must be less than ${isVideo ? '50MB' : '5MB'}` },
                { status: 400 }
            );
        }

        // Convert file to buffer for Cloudinary upload
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const folder = formData.get("folder") as string;

        // Map folder param to organized Cloudinary folders
        const FOLDER_MAP: Record<string, string> = {
            hero: 'vastra/hero',
            products: 'vastra/products',
            categories: 'vastra/categories',
            videos: 'vastra/videos',
            // Legacy support
            banners: 'vastra/hero',
        };
        const targetFolder = FOLDER_MAP[folder] ?? (isVideo ? 'vastra/videos' : 'vastra/hero');

        const publicId = `${targetFolder}/${uuidv4()}`;

        // Upload to Cloudinary
        // public_id already includes folder path; do NOT pass folder option to avoid duplication
        const uploadResult = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    public_id: publicId,
                    resource_type: isVideo ? 'video' : 'image',
                    quality: 'auto',
                    fetch_format: 'auto',
                },
                (error, result) => {
                    if (error) {
                        console.error(`❌ Cloudinary upload failed for public_id: ${publicId}`, error.message);
                        reject(error);
                    } else {
                        resolve(result as CloudinaryUploadResult);
                    }
                }
            );

            uploadStream.end(buffer);
        });

        const duration = Math.round(performance.now() - startTime);
        console.log(`✅ Upload completed in ${duration}ms | public_id: ${uploadResult.public_id} | ${uploadResult.bytes} bytes`);

        // Return the secure Cloudinary URL and public_id
        return NextResponse.json({
            url: uploadResult.secure_url,
            public_id: uploadResult.public_id,
            width: uploadResult.width,
            height: uploadResult.height,
            format: uploadResult.format,
            bytes: uploadResult.bytes,
        }, { status: 200 });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to upload file";
        console.error(`❌ Upload failed: ${errorMessage}`);
        return NextResponse.json(
            { error: "Failed to upload file", details: errorMessage },
            { status: 500 }
        );
    }
}

