import { auth } from "@/lib/auth-vercel";
import { prisma } from "@/lib/database/client";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ linked: false });

        const link = await prisma.userPlayerLink.findFirst({
            where: {
                userId: session.user.id,
                deleted: false
            }
        });

        if (!link) return NextResponse.json({ linked: false });
        return NextResponse.json({ linked: true, playerId: link.playerId });
    } catch (error) {
        console.error("Error in link-status:", error);
        return NextResponse.json({ linked: false }, { status: 500 });
    }
}
