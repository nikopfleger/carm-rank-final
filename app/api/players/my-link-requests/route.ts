import { auth } from "@/lib/auth-vercel";
import { prisma } from "@/lib/database/client";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ requests: [] });
        }

        const requests = await prisma.userPlayerLinkRequest.findMany({
            where: {
                userId: session.user.id
            },
            orderBy: { createdAt: "desc" },
            include: {
                player: { select: { id: true, nickname: true, fullname: true } }
            },
        });

        return NextResponse.json({ requests });
    } catch (error) {
        console.error("Error in my-link-requests:", error);
        return NextResponse.json({ requests: [] }, { status: 500 });
    }
}
