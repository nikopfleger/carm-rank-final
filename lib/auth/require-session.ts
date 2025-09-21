import { auth } from "@/lib/auth-vercel";
import type { Session } from "next-auth";
import { NextResponse } from "next/server";

type Ok =
    | { ok: true; session: Session }
    | { ok: false; res: NextResponse };

export async function requireSession(): Promise<Ok> {
    const session = await auth();
    if (!session?.user?.id) {
        return {
            ok: false,
            res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        };
    }
    return { ok: true, session };
}
