import { prisma } from '@/lib/database/client';
import { serializeBigInt } from '@/lib/serialize-bigint';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sanma = searchParams.get('sanma');

    const rulesets = await prisma.ruleset.findMany({
      where: sanma !== null ? {
        sanma: sanma === 'true'
      } : undefined,
      include: {
        uma: true // Incluir datos del Uma relacionado
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(serializeBigInt(rulesets));
  } catch (error) {
    console.error('Error fetching rulesets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rulesets' },
      { status: 500 }
    );
  }
}
