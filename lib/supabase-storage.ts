import { createClient } from '@supabase/supabase-js';

// Supabase Storage Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        'Missing Supabase credentials. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env file.'
    );
}

// Standard client (for client-side or public operations)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client (for server-side operations bypassing RLS)
export const supabaseAdmin = supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : null;

// Storage bucket names
export const STORAGE_BUCKETS = {
    COLLECTIONS: 'collections',
    PRODUCTS: 'products',
    VARIANTS: 'variants',
} as const;

/**
 * Upload a file to Supabase Storage
 * @param bucket - The storage bucket name
 * @param filepath - The path where the file should be stored (e.g., "category-123.jpg")
 * @param file - The file buffer to upload
 * @param contentType - The file's content type (e.g., "image/jpeg")
 * @returns The public URL of the uploaded file
 */
export async function uploadToSupabase(
    bucket: string,
    filepath: string,
    file: Buffer,
    contentType: string
): Promise<string> {
    // Use admin client if available (bypasses RLS), otherwise fall back to anon client
    const client = supabaseAdmin || supabase;

    const { data, error } = await client.storage
        .from(bucket)
        .upload(filepath, file, {
            contentType,
            upsert: true, // Replace if file already exists
        });

    if (error) {
        console.error('Supabase upload error:', error);
        throw new Error(`Failed to upload to Supabase: ${error.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = client.storage
        .from(bucket)
        .getPublicUrl(filepath);

    return publicUrlData.publicUrl;
}

/**
 * Delete a file from Supabase Storage
 * @param bucket - The storage bucket name
 * @param filepath - The path of the file to delete
 */
export async function deleteFromSupabase(
    bucket: string,
    filepath: string
): Promise<void> {
    const client = supabaseAdmin || supabase;
    const { error } = await client.storage.from(bucket).remove([filepath]);

    if (error) {
        console.error('Supabase delete error:', error);
        throw new Error(`Failed to delete from Supabase: ${error.message}`);
    }
}

/**
 * Extract the file path from a Supabase Storage URL
 * @param url - The full Supabase Storage URL
 * @returns The file path within the bucket
 */
export function getStoragePathFromUrl(url: string): string | null {
    try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        // Supabase URLs format: /storage/v1/object/public/{bucket}/{filepath}
        const bucketIndex = pathParts.indexOf('public');
        if (bucketIndex === -1) return null;

        // Return everything after the bucket name
        return pathParts.slice(bucketIndex + 2).join('/');
    } catch {
        return null;
    }
}
