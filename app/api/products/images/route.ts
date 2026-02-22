import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import prisma from "@/lib/prisma";
import cloudinary, { type CloudinaryUploadResult } from "@/lib/cloudinary";

// Prevent Next.js from caching upload/delete responses
export const dynamic = 'force-dynamic';

/**
 * Extract Cloudinary public_id from a Cloudinary secure_url.
 * Example: https://res.cloudinary.com/xxx/image/upload/v123/vastra/products/abc.jpg
 * Returns: vastra/products/abc
 */
function extractPublicId(url: string): string | null {
    try {
        const match = url.match(/\/upload\/(?:v\d+\/)?(.*?)(?:\.\w+)?$/);
        return match?.[1] ?? null;
    } catch {
        return null;
    }
}

// POST - Upload product images (parallel for performance)
export async function POST(req: NextRequest) {
    const startTime = performance.now();

    try {
        const formData = await req.formData();
        const files = formData.getAll("files") as File[];

        if (!files || files.length === 0) {
            return NextResponse.json(
                { error: "No files provided" },
                { status: 400 }
            );
        }

        // Validate max count per request (min count enforced at product save time)
        if (files.length > 8) {
            return NextResponse.json(
                { error: "Maximum 8 images allowed per upload" },
                { status: 400 }
            );
        }

        // Parallel upload for better admin performance
        const uploadPromises = files.map(async (file) => {
            // Validate file type
            const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
            if (!allowedTypes.includes(file.type)) {
                throw new Error(`Invalid file type: ${file.name}. Only JPG, PNG, and WebP are allowed.`);
            }

            // Validate file size (max 10MB)
            const maxSize = 10 * 1024 * 1024;
            if (file.size > maxSize) {
                throw new Error(`File ${file.name} is too large. Maximum size is 10MB.`);
            }

            // Convert file to buffer
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Generate unique public_id under vastra/products
            const publicId = `vastra/products/${uuidv4()}`;

            // Upload to Cloudinary
            // public_id already includes folder path; do NOT pass folder option
            const uploadResult = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        public_id: publicId,
                        resource_type: 'image',
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

            console.log(`✅ Product image uploaded | public_id: ${uploadResult.public_id} | ${uploadResult.bytes} bytes`);

            return {
                url: uploadResult.secure_url,
                width: uploadResult.width,
                height: uploadResult.height,
                fileSize: uploadResult.bytes,
            };
        });

        const uploadedImages = await Promise.all(uploadPromises);

        const duration = Math.round(performance.now() - startTime);
        console.log(`✅ Uploaded ${uploadedImages.length} product images in ${duration}ms`);

        return NextResponse.json({
            success: true,
            images: uploadedImages,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to upload images";
        console.error(`❌ Product image upload failed: ${errorMessage}`);

        // Return validation errors with 400 status
        if (errorMessage.includes('Invalid file type') || errorMessage.includes('too large')) {
            return NextResponse.json(
                { error: errorMessage },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: "Failed to upload images", details: errorMessage },
            { status: 500 }
        );
    }
}

// DELETE - Remove product image (via Cloudinary)
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

            // Delete file from Cloudinary
            const publicId = extractPublicId(image.url);
            if (publicId) {
                try {
                    await cloudinary.uploader.destroy(publicId);
                    console.log(`✅ Cloudinary image deleted | public_id: ${publicId}`);
                } catch (err) {
                    console.error(`❌ Cloudinary delete failed for public_id: ${publicId}`, err instanceof Error ? err.message : err);
                    // Continue even if Cloudinary deletion fails
                }
            }

            // Delete from database
            await prisma.productImage.delete({
                where: { id: imageId },
            });
        } else if (imageUrl) {
            // Just delete file if only URL provided (for temp uploads)
            const publicId = extractPublicId(imageUrl);
            if (publicId) {
                try {
                    await cloudinary.uploader.destroy(publicId);
                    console.log(`✅ Cloudinary image deleted | public_id: ${publicId}`);
                } catch (err) {
                    console.error(`❌ Cloudinary delete failed for public_id: ${publicId}`, err instanceof Error ? err.message : err);
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
