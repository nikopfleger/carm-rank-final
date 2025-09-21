import { prisma } from '@/lib/database/client';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/abm/season-results/[id]/restore - Restore a soft-deleted season result
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    const seasonResult = await (prisma as any).seasonResult.update({
      where: { id },
      data: { deleted: false },
      include: {
        player: {
          select: {
            id: true,
            nickname: true,
            fullname: true,
          }
        },
        season: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    return NextResponse.json(seasonResult);
  } catch (error) {
    console.error('Error restoring season result:', error);
    return NextResponse.json(
      { error: 'Failed to restore season result' },
      { status: 500 }
    );
  }
}
