import { activateSeason, archiveSeason, getSeasonStatistics, updateSeason } from '@/lib/database/queries/seasons';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// PUT /api/seasons/[id] - Update a season
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    const { id } = await params;
    const seasonId = parseInt(id);

    if (isNaN(seasonId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid season ID',
          message: 'Season ID must be a valid number'
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updates = body;

    // Validate dates if provided
    if (updates.start_date) {
      const startDate = new Date(updates.start_date);
      if (isNaN(startDate.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid start date',
            message: 'start_date must be a valid date'
          },
          { status: 400 }
        );
      }
    }

    if (updates.end_date) {
      const endDate = new Date(updates.end_date);
      if (isNaN(endDate.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid end date',
            message: 'end_date must be a valid date'
          },
          { status: 400 }
        );
      }
    }

    const season = await updateSeason(seasonId, updates);

    return NextResponse.json({
      success: true,
      data: season,
      message: 'Season updatedAt successfully'
    });
  } catch (error) {
    console.error(`Error updating season:`, error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update season',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/seasons/[id]/archive - Archive a season
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    const { id } = await params;
    const seasonId = parseInt(id);

    if (isNaN(seasonId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid season ID',
          message: 'Season ID must be a valid number'
        },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'activate') {
      const season = await activateSeason(seasonId);
      return NextResponse.json({ success: true, data: season, message: 'Season activated' });
    } else {
      await archiveSeason(seasonId);
      return NextResponse.json({ success: true, message: 'Season archived successfully' });
    }
  } catch (error) {
    console.error(`Error archiving season:`, error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to archive season',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/seasons/[id]/statistics - Get season statistics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    const { id } = await params;
    const seasonId = parseInt(id);

    if (isNaN(seasonId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid season ID',
          message: 'Season ID must be a valid number'
        },
        { status: 400 }
      );
    }

    const statistics = await getSeasonStatistics(seasonId);

    return NextResponse.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error(`Error getting season statistics:`, error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch season statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
