import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import prisma from "@/lib/prisma";

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
            const filepath = join(process.cwd(), "public", "uploads", "products", filename);

            // Convert file to buffer
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Process image with sharp (resize, optimize)
            const processedBuffer = await sharp(buffer)
                .resize(1200, 1200, {
                    fit: "inside",
                    withoutEnlargement: true,
                })
                .jpeg({ quality: 85 })
                .toBuffer();

            // Get image metadata
            const metadata = await sharp(processedBuffer).metadata();

            // Save file
            await writeFile(filepath, processedBuffer);

            // Create image object
            uploadedImages.push({
                url: `/uploads/products/${filename}`,
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
        return NextResponse.json(
            { error: "Failed to upload images" },
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

            // Delete file from filesystem
            const filepath = join(process.cwd(), "public", image.url);
            try {
                await unlink(filepath);
            } catch (err) {
                console.error("Error deleting file:", err);
                // Continue even if file deletion fails
            }

            // Delete from database
            await prisma.productImage.delete({
                where: { id: imageId },
            });
        } else if (imageUrl) {
            // Just delete file if only URL provided (for temp uploads)
            const filepath = join(process.cwd(), "public", imageUrl);
            try {
                await unlink(filepath);
            } catch (err) {
                console.error("Error deleting file:", err);
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
