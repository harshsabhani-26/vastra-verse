import { handlers } from "@/auth";
import { checkIpRateLimit } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

const { GET: AuthGET, POST: AuthPOST } = handlers;

export const GET = AuthGET;

export async function POST(req: NextRequest) {
    // Apply IP-based rate limiting to credential login attempts
    if (req.nextUrl.pathname.includes('/callback/credentials')) {
        const rateLimitResult = await checkIpRateLimit(req, 'auth');
        if (rateLimitResult instanceof NextResponse) {
            return rateLimitResult;
        }
    }
    return AuthPOST(req);
}
