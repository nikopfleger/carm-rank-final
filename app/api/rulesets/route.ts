import { prisma } from '@/lib/database/client';
import { NextRequest, NextResponse } from 'next/server';

;

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

    return NextResponse.json(rulesets);
  } catch (error) {
    console.error('Error fetching rulesets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rulesets' },
      { status: 500 }
    );
  }
}
