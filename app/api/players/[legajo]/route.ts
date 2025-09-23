import { getPlayerByLegajo } from '@/lib/database/queries/players-corrected';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/players/[legajo] - Get player by legajo
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ legajo: string }> }
) {
  const { legajo: legajoParam } = await params;
  try {
    const legajo = parseInt(legajoParam);

    if (isNaN(legajo)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid legajo',
          message: 'Legajo must be a valid number'
        },
        { status: 400 }
      );
    }

    const player = await getPlayerByLegajo(legajo);

    if (!player) {
      return NextResponse.json(
        {
          success: false,
          error: 'Player not found',
          message: `No player found with legajo ${legajo}`
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: player
    });
  } catch (error) {
    console.error(`Error in GET /api/players/${legajoParam}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch player',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
