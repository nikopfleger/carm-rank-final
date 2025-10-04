import { auth } from "@/lib/auth-vercel";
import { prisma } from "@/lib/database/client";
import { serializeBigInt } from '@/lib/serialize-bigint';
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json(serializeBigInt({ linked: false }));

        const link = await prisma.userPlayerLink.findFirst({
            where: {
                userId: session.user.id,
                deleted: false
            }
        });

        if (!link) return NextResponse.json(serializeBigInt({ linked: false }));
        return NextResponse.json({ linked: true, playerId: link.playerId });
    } catch (error) {
        console.error("Error in link-status:", error);
        return NextResponse.json(serializeBigInt({ linked: false }), { status: 500 });
    }
}
