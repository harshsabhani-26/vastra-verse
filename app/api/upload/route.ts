import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import { uploadToSupabase, STORAGE_BUCKETS } from "@/lib/supabase-storage";

export async function POST(request: NextRequest) {
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

        // Generate unique filename
        const ext = file.name.split(".").pop();
        const filename = `${uuidv4()}.${ext}`;

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Process image with sharp (resize, optimize)
        // Maintain original format instead of forcing JPEG
        let processedBuffer: any = buffer;

        if (!isVideo) {
            try {
                const sharpInstance = sharp(buffer).resize(1200, 1200, {
                    fit: "inside",
                    withoutEnlargement: true,
                });

                // Apply format-specific optimization
                if (file.type === "image/png") {
                    processedBuffer = await sharpInstance
                        .png({ quality: 85, compressionLevel: 9 })
                        .toBuffer();
                } else if (file.type === "image/webp") {
                    processedBuffer = await sharpInstance
                        .webp({ quality: 85 })
                        .toBuffer();
                } else {
                    // JPEG/JPG - convert to JPEG
                    processedBuffer = await sharpInstance
                        .jpeg({ quality: 85 })
                        .toBuffer();
                }
            } catch (error) {
                console.error("Image processing failed:", error);
                // Fallback to original buffer if processing fails
            }
        }

        // Upload to Supabase Storage
        const publicUrl = await uploadToSupabase(
            STORAGE_BUCKETS.COLLECTIONS,
            filename,
            processedBuffer as any,
            file.type
        );

        // Return the public URL
        return NextResponse.json({ url: publicUrl }, { status: 200 });
    } catch (error) {
        console.error("Upload error:", error);
        // Return more detailed error for debugging
        const errorMessage = error instanceof Error ? error.message : "Failed to upload file";
        return NextResponse.json(
            { error: "Failed to upload file", details: errorMessage },
            { status: 500 }
        );
    }
}
