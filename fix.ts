import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    await prisma.category.updateMany({
        where: { slug: "embrodery-saree" },
        data: { slug: "saree/embrodery-saree" },
    });
    await prisma.category.updateMany({
        where: { slug: "royal-banarsi-sareee" },
        data: { slug: "sareee/royal-banarsi-sareee" },
    });
    console.log("Fixed slugs");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
