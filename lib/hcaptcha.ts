/**
 * SECURITY: hCaptcha Server-Side Token Verification
 * 
 * Verifies hCaptcha tokens on the backend to prevent bot abuse.
 * Frontend-only verification can be bypassed — this is the real check.
 * 
 * Requires HCAPTCHA_SECRET_KEY environment variable.
 */

const HCAPTCHA_VERIFY_URL = "https://api.hcaptcha.com/siteverify";

export async function verifyHCaptchaToken(token: string): Promise<boolean> {
    const secret = process.env.HCAPTCHA_SECRET_KEY;

    if (!secret) {
        console.warn("[SECURITY] HCAPTCHA_SECRET_KEY not configured — skipping verification");
        // In production, you may want to FAIL CLOSED (return false)
        // For now, allow requests to proceed if hCaptcha is not configured
        return true;
    }

    if (!token) {
        return false;
    }

    try {
        const response = await fetch(HCAPTCHA_VERIFY_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                secret,
                response: token,
            }).toString(),
        });

        const data = await response.json();
        return data.success === true;
    } catch (error) {
        console.error("[SECURITY] hCaptcha verification failed:", error);
        return false;
    }
}
