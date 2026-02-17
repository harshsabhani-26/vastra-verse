import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

/**
 * Automated Admin Route Rate Limiting Script
 * 
 * This script adds rate limiting to all admin routes that don't have it yet.
 */

async function addRateLimitingToAdminRoutes() {
    console.log('🔒 Starting batch admin route protection...\n');

    // Find all admin route files
    const adminRoutes = glob.sync('app/api/admin/**/route.ts', {
        cwd: process.cwd(),
        absolute: true,
    });

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const filePath of adminRoutes) {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const relativePath = path.relative(process.cwd(), filePath);

            // Skip if already has rate limiting
            if (content.includes('checkUserRateLimit')) {
                console.log(`⏭️  Already protected: ${relativePath}`);
                skipped++;
                continue;
            }

            let newContent = content;
            let modified = false;

            // Step 1: Add import if not present
            if (!content.includes("import { checkUserRateLimit }")) {
                // Find the NextRequest import line
                const nextImportRegex = /import\s+\{[^}]*NextRequest[^}]*\}\s+from\s+['"]next\/server['"];?/;
                const match = content.match(nextImportRegex);

                if (match) {
                    newContent = newContent.replace(
                        match[0],
                        `${match[0]}\nimport { checkUserRateLimit } from '@/lib/rate-limit';`
                    );
                    modified = true;
                }
            }

            // Step 2: Add rate limiting logic to each handler (GET, POST, PUT, DELETE)
            const handlerRegex = /(export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\s*\([^)]*\)\s*\{\s*try\s*\{)/g;

            newContent = newContent.replace(handlerRegex, (match, fullMatch, method) => {
                // Check if rate limiting already exists in this handler
                const handlerStart = newContent.indexOf(fullMatch);
                const nextHandlerStart = newContent.indexOf('export async function', handlerStart + 1);
                const handlerContent = newContent.substring(
                    handlerStart,
                    nextHandlerStart > 0 ? nextHandlerStart : newContent.length
                );

                if (handlerContent.includes('checkUserRateLimit')) {
                    return match; // Already protected
                }

                modified = true;
                return `${fullMatch}
        // SECURITY: Rate limiting (30 req/min for admin)
        const rateLimitResult = await checkUserRateLimit(req, 'admin');
        if (rateLimitResult instanceof NextResponse) {
            return rateLimitResult;
        }
`;
            });

            // Step 3: Ensure NextResponse is imported (needed for rate limit check)
            if (modified && !content.includes('NextResponse')) {
                newContent = newContent.replace(
                    /import\s+\{([^}]*)\}\s+from\s+['"]next\/server['"];/,
                    (match, imports) => {
                        if (!imports.includes('NextResponse')) {
                            return match.replace(imports, `${imports.trim()}, NextResponse`);
                        }
                        return match;
                    }
                );
            }

            if (modified && newContent !== content) {
                fs.writeFileSync(filePath, newContent, 'utf-8');
                console.log(`✅ Protected: ${relativePath}`);
                updated++;
            } else if (!modified) {
                console.log(`⏭️  No handlers found: ${relativePath}`);
                skipped++;
            }

        } catch (error) {
            console.error(`❌ Error processing ${filePath}:`, error);
            errors++;
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Batch Protection Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Protected: ${updated} files`);
    console.log(`⏭️  Skipped: ${skipped} files (already protected or no handlers)`);
    console.log(`❌ Errors: ${errors} files`);
    console.log(`📁 Total admin routes: ${adminRoutes.length}`);
    console.log('='.repeat(60));

    if (updated > 0) {
        console.log('\n✨ Rate limiting successfully applied!');
        console.log('📝 Next steps:');
        console.log('   1. Review the changes');
        console.log('   2. Run: npm run build (check for TypeScript errors)');
        console.log('   3. Test one route: make 31 requests, expect 429 on 31st');
        console.log('   4. Commit and deploy to Railway');
    }
}

// Run the script
addRateLimitingToAdminRoutes().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
