import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import prisma from "@/lib/prisma";
import { uploadToSupabase, deleteFromSupabase, getStoragePathFromUrl, STORAGE_BUCKETS } from "@/lib/supabase-storage";

// POST - Upload product images
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const files = formData.getAll("files") as File[];

        if (!files || files.length === 0) {
            return NextResponse.json(
                { error: "No files provided" },
                { status: 400 }
            );
        }

        // Validate count (3-8 images)
        if (files.length < 3 || files.length > 8) {
            return NextResponse.json(
                { error: "Please upload between 3 and 8 images" },
                { status: 400 }
            );
        }

        const uploadedImages = [];

        for (const file of files) {
            // Validate file type
            const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
            if (!allowedTypes.includes(file.type)) {
                return NextResponse.json(
                    { error: `Invalid file type: ${file.name}. Only JPG, PNG, and WebP are allowed.` },
                    { status: 400 }
                );
            }

            // Validate file size (max 10MB)
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                return NextResponse.json(
                    { error: `File ${file.name} is too large. Maximum size is 10MB.` },
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
            let processedBuffer;
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

            // Get image metadata
            const metadata = await sharp(processedBuffer).metadata();

            // Upload to Supabase Storage
            const publicUrl = await uploadToSupabase(
                STORAGE_BUCKETS.PRODUCTS,
                filename,
                processedBuffer,
                file.type
            );

            // Create image object
            uploadedImages.push({
                url: publicUrl,
                width: metadata.width,
                height: metadata.height,
                fileSize: processedBuffer.length,
            });
        }

        return NextResponse.json({
            success: true,
            images: uploadedImages,
        });
    } catch (error) {
        console.error("Error uploading images:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to upload images";
        return NextResponse.json(
            { error: "Failed to upload images", details: errorMessage },
            { status: 500 }
        );
    }
}

// DELETE - Remove product image
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const imageId = searchParams.get("id");
        const imageUrl = searchParams.get("url");

        if (!imageId && !imageUrl) {
            return NextResponse.json(
                { error: "Image ID or URL is required" },
                { status: 400 }
            );
        }

        // Delete from database if ID provided
        if (imageId) {
            const image = await prisma.productImage.findUnique({
                where: { id: imageId },
            });

            if (!image) {
                return NextResponse.json(
                    { error: "Image not found" },
                    { status: 404 }
                );
            }

            // Delete file from Supabase Storage
            const filepath = getStoragePathFromUrl(image.url);
            if (filepath) {
                try {
                    await deleteFromSupabase(STORAGE_BUCKETS.PRODUCTS, filepath);
                } catch (err) {
                    console.error("Error deleting file from Supabase:", err);
                    // Continue even if file deletion fails
                }
            }

            // Delete from database
            await prisma.productImage.delete({
                where: { id: imageId },
            });
        } else if (imageUrl) {
            // Just delete file if only URL provided (for temp uploads)
            const filepath = getStoragePathFromUrl(imageUrl);
            if (filepath) {
                try {
                    await deleteFromSupabase(STORAGE_BUCKETS.PRODUCTS, filepath);
                } catch (err) {
                    console.error("Error deleting file from Supabase:", err);
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting image:", error);
        return NextResponse.json(
            { error: "Failed to delete image" },
            { status: 500 }
        );
    }
}
