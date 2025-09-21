// Asegúrate que este archivo quede dentro de /types y que tsconfig lo incluya.
// Reinicia el TS Server después de crearlo (Ctrl+Shift+P → "TypeScript: Restart TS Server").

import { DefaultSession } from "next-auth";

type AppUserRole = "SUPER_ADMIN" | "ADMIN" | "OWNER" | "MODERATOR" | "USER";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: AppUserRole | null;
            authorities: string[];
            isActive: boolean;
        } & DefaultSession["user"];
    }

    interface User {
        id: string;
        role: AppUserRole | null;
        authorities: string[];
        isActive: boolean;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string;
        role?: AppUserRole | null;
        authorities?: string[];
        isActive?: boolean;
        sessionInvalidatedAt?: string | null;
        iat?: number; // timestamp (segundos)
    }
}
