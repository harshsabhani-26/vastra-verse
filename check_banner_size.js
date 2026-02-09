
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const banners = await prisma.heroBanner.findMany();

    console.log(`Found ${banners.length} banners.`);

    banners.forEach(banner => {
        const imageUrl = banner.imageUrl || '';
        const videoUrl = banner.videoUrl || '';

        console.log(`Banner ID: ${banner.id}`);
        console.log(`- Image URL Length: ${imageUrl.length} chars`);
        console.log(`- Video URL Length: ${videoUrl.length} chars`);

        if (imageUrl.length > 1000) {
            console.log(`WARNING: Banner ${banner.id} has a very long imageUrl (starts with): ${imageUrl.substring(0, 50)}...`);
            console.log(`Ends with: ...${imageUrl.substring(imageUrl.length - 50)}`);
        }
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
