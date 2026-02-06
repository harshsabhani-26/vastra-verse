import { auth } from "@/auth";

export default async function AdminDebugPage() {
    const session = await auth();
    const adminEmail = process.env.ADMIN_EMAIL;

    // Safety: Mask the email to avoid exposing it fully if screen is shared, 
    // but show enough to verify it's loaded.
    const maskedAdminEmail = adminEmail
        ? `${adminEmail.substring(0, 3)}...${adminEmail.substring(adminEmail.indexOf('@'))} (Length: ${adminEmail.length})`
        : "UNDEFINED";

    const userEmail = session?.user?.email || "NOT LOGGED IN";

    // Check for exact match (including whitespace/invisible chars)
    const isExactMatch = session?.user?.email === adminEmail;

    return (
        <div className="p-10 font-mono text-sm max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold bg-yellow-400 p-2 inline-block text-black">Admin Debugger</h1>

            <div className="border p-6 rounded-lg bg-slate-100 space-y-4">
                <h2 className="font-bold border-b pb-2">1. Environment Variable</h2>
                <div className="grid grid-cols-[120px_1fr] gap-2">
                    <span>ADMIN_EMAIL:</span>
                    <span className={adminEmail ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                        {maskedAdminEmail}
                    </span>
                </div>
            </div>

            <div className="border p-6 rounded-lg bg-slate-100 space-y-4">
                <h2 className="font-bold border-b pb-2">2. Your Session</h2>
                <div className="grid grid-cols-[120px_1fr] gap-2">
                    <span>User Email:</span>
                    <span>{userEmail} (Length: {userEmail.length})</span>

                    <span>User Role:</span>
                    <span className={session?.user?.role === "ADMIN" ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                        {session?.user?.role || "UNDEFINED"}
                    </span>
                </div>
            </div>

            <div className="border p-6 rounded-lg bg-slate-100 space-y-4">
                <h2 className="font-bold border-b pb-2">3. Diagnosis</h2>
                <div className="space-y-2">
                    <p>
                        Is Email Match?
                        <strong className={isExactMatch ? "text-green-600 ml-2" : "text-red-600 ml-2"}>
                            {isExactMatch ? "YES" : "NO"}
                        </strong>
                    </p>

                    {!isExactMatch && session?.user?.email && adminEmail && (
                        <div className="bg-red-50 p-2 text-red-700 text-xs">
                            <p>Mismatch detected!</p>
                            <p>Admin Config: "{adminEmail}"</p>
                            <p>Your Login:  "{session.user.email}"</p>
                            <p>Check for hidden spaces or uppercase letters.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="text-xs text-gray-500 mt-10">
                ⚠️ Delete this page after debugging.
            </div>
        </div>
    );
}
