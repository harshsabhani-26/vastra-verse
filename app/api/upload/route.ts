import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";

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
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "Only JPG, PNG, and WebP images are allowed" },
                { status: 400 }
            );
        }

        // Validate file size (max 5MB)
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB
        if (file.size > MAX_SIZE) {
            return NextResponse.json(
                { error: "File size must be less than 5MB" },
                { status: 400 }
            );
        }

        // Generate unique filename
        const ext = file.name.split(".").pop();
        const filename = `${uuidv4()}.${ext}`;
        const filepath = join(process.cwd(), "public", "uploads", "collections", filename);

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

        // Save file
        await writeFile(filepath, processedBuffer);

        // Return the public URL
        const url = `/uploads/collections/${filename}`;

        return NextResponse.json({ url }, { status: 200 });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: "Failed to upload file" },
            { status: 500 }
        );
    }
}
