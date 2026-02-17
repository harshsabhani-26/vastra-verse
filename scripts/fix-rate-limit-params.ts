import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

/**
 * Comprehensive TypeScript error fixer for rate limiting
 */

async function comprehensiveFix() {
    console.log('🔧 Comprehensive TypeScript fix...\n');

    const allRoutes = glob.sync('app/api/**/**/route.ts', {
        cwd: process.cwd(),
        absolute: true,
    });

    let fixed = 0;

    for (const filePath of allRoutes) {
        let content = fs.readFileSync(filePath, 'utf-8');
        let original = content;

        // Fix 1: Remove old imports that don't exist
        content = content.replace(/import \{ getAuthRateLimiter \} from '@\/lib\/rate-limit';?\n?/g, '');
        content = content.replace(/import \{ ratelimit \} from ["']@\/lib\/rate-limit["'];?\n?/g, '');

        // Fix 2: Add missing checkUserRateLimit import where rate limiting is used but import is missing
        if (content.includes('checkUserRateLimit') && !content.includes("import { checkUserRateLimit }")) {
            // Find NextRequest import
            const nextImportMatch = content.match(/import\s+\{[^}]*NextRequest[^}]*\}\s+from\s+['"]next\/server['"];?/);
            if (nextImportMatch) {
                content = content.replace(
                    nextImportMatch[0],
                    `${nextImportMatch[0]}\nimport { checkUserRateLimit } from '@/lib/rate-limit';`
                );
            }
        }

        // Fix 3: Ensure NextResponse is imported where checkUserRateLimit is used
        if (content.includes('checkUserRateLimit')) {
            const importMatch = content.match(/import\s+\{([^}]+)\}\s+from\s+['"]next\/server['"];?/);
            if (importMatch) {
                const imports = importMatch[1];
                if (!imports.includes('NextResponse')) {
                    content = content.replace(
                        importMatch[0],
                        importMatch[0].replace(imports, `${imports.trim()}, NextResponse`)
                    );
                }
            }
        }

        // Fix 4: Fix parameter names (req vs request)
        const funcMatches = content.matchAll(/export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\s*\((\w+):\s*NextRequest\)/g);
        for (const match of funcMatches) {
            const paramName = match[2];
            if (paramName !== 'req') {
                // Replace checkUserRateLimit(req, with checkUserRateLimit(paramName,
                const regex = new RegExp(`checkUserRateLimit\\(req,`, 'g');
                content = content.replace(regex, `checkUserRateLimit(${paramName},`);
            }
        }

        if (content !== original) {
            fs.writeFileSync(filePath, content, 'utf-8');
            const relativePath = path.relative(process.cwd(), filePath);
            console.log(`✅ Fixed: ${relativePath}`);
            fixed++;
        }
    }

    // Fix lib/rate-limit.ts specific issues
    const rateLimitPath = path.join(process.cwd(), 'lib', 'rate-limit.ts');
    let rateLimitContent = fs.readFileSync(rateLimitPath, 'utf-8');
    const rateLimitOriginal = rateLimitContent;

    // Fix import for getServerSession
    rateLimitContent = rateLimitContent.replace(
        /import \{ getServerSession \} from 'next-auth';/g,
        "import { auth } from '@/auth';"
    );

    // Fix authOptions reference  
    rateLimitContent = rateLimitContent.replace(
        /const session = await getServerSession\(authOptions\);/g,
        'const session = await auth();'
    );

    // Remove authOptions import
    rateLimitContent = rateLimitContent.replace(
        /import \{ authOptions \} from '@\/auth';?\n?/g,
        ''
    );

    // Fix sliding window type issue (string to Duration)
    rateLimitContent = rateLimitContent.replace(
        /Ratelimit\.slidingWindow\((\d+), '([\dmsh ]+)'\)/g,
        'Ratelimit.slidingWindow($1, \'$2\' as any)'
    );

    if (rateLimitContent !== rateLimitOriginal) {
        fs.writeFileSync(rateLimitPath, rateLimitContent, 'utf-8');
        console.log(`✅ Fixed: lib/rate-limit.ts`);
        fixed++;
    }

    console.log(`\n✨ Fixed ${fixed} files total`);
}

comprehensiveFix().catch(console.error);
