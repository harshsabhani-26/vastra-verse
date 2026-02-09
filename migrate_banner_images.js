
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');

const prisma = new PrismaClient();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Try service role key first for admin privileges, then anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const banners = await prisma.heroBanner.findMany();
    console.log(`Found ${banners.length} banners.`);

    for (const banner of banners) {
        if (banner.imageUrl && banner.imageUrl.startsWith('data:image')) {
            console.log(`Migrating banner ${banner.id}...`);

            // Extract content type and base64 data
            const matches = banner.imageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (!matches || matches.length !== 3) {
                console.error(`Skipping banner ${banner.id}: Invalid base64 format.`);
                continue;
            }

            const contentType = matches[1];
            const base64Data = matches[2];
            const buffer = Buffer.from(base64Data, 'base64');

            // Generate filename
            const ext = contentType.split('/')[1] || 'png'; // Default to png if unknown
            const filename = `banner-${banner.id}-${Date.now()}.${ext}`;
            const bucketName = 'collections'; // Using 'collections' bucket
            const filePath = `banners/${filename}`;

            console.log(`Uploading ${filePath} (${contentType})...`);

            // Upload to Supabase
            const { data, error } = await supabase.storage
                .from(bucketName)
                .upload(filePath, buffer, {
                    contentType,
                    upsert: true
                });

            if (error) {
                console.error(`Failed to upload banner ${banner.id}:`, error.message);
                // Continue to next banner, don't crash
                continue;
            }

            // Get Public URL
            const { data: publicUrlData } = supabase.storage
                .from(bucketName)
                .getPublicUrl(filePath);

            const publicUrl = publicUrlData.publicUrl;
            console.log(`New URL: ${publicUrl}`);

            // Update Database
            await prisma.heroBanner.update({
                where: { id: banner.id },
                data: { imageUrl: publicUrl }
            });
            console.log(`Database updated for banner ${banner.id}`);
        } else {
            console.log(`Banner ${banner.id} skipped (already a URL or empty).`);
        }
    }
}

main()
    .catch(e => {
        console.error('Script error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
