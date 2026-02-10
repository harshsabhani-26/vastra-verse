import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import cloudinary, { type CloudinaryUploadResult } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
    const startTime = performance.now();
    console.time('⏱️  [Upload] /api/upload');

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

        // Generate unique public_id for Cloudinary
        const ext = file.name.split(".").pop();
        // Use provided folder or default based on file type
        const targetFolder = (folder && ['banners', 'categories', 'products'].includes(folder))
            ? folder
            : (isVideo ? 'videos' : 'banners');

        const publicId = `${targetFolder}/${uuidv4()}`;

        // Upload to Cloudinary
        // Cloudinary handles all optimization automatically (no need for sharp)
        const uploadResult = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    public_id: publicId,
                    resource_type: isVideo ? 'video' : 'image',
                    folder: targetFolder,
                    // Cloudinary auto-optimization
                    quality: 'auto',
                    fetch_format: 'auto',
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result as CloudinaryUploadResult);
                }
            );

            uploadStream.end(buffer);
        });

        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        console.timeEnd('⏱️  [Upload] /api/upload');
        console.log(`✅ Upload completed in ${duration}ms - URL: ${uploadResult.secure_url}`);

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
        console.timeEnd('⏱️  [Upload] /api/upload');
        console.error("Upload error:", error);

        // Return more detailed error for debugging
        const errorMessage = error instanceof Error ? error.message : "Failed to upload file";
        return NextResponse.json(
            { error: "Failed to upload file", details: errorMessage },
            { status: 500 }
        );
    }
}

