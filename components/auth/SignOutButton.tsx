"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
    return (
        <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-left w-full py-3 transition-colors border-l-2 pl-4 border-transparent hover:text-[#1C1917]"
        >
            Logout
        </button>
    );
}
