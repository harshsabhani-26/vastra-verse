import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: "USER" | "ADMIN";
            phone?: string | null;
            phoneVerified?: boolean;
        } & DefaultSession["user"];
    }

    interface User extends DefaultUser {
        role: "USER" | "ADMIN";
        phone?: string | null;
        phoneVerified?: boolean;
    }
}

declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
        role: "USER" | "ADMIN";
        phone?: string | null;
        phoneVerified?: boolean;
    }
}
