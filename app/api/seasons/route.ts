import { connectToDatabase } from '@/lib/database/connection';
import { createSeason, getActiveSeason, getAllSeasons } from '@/lib/database/queries/seasons';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/seasons - Get all seasons or active season
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    if (activeOnly) {
      const activeSeason = await getActiveSeason();
      return NextResponse.json({
        success: true,
        data: activeSeason
      });
    }

    const seasons = await getAllSeasons();

    return NextResponse.json({
      success: true,
      data: seasons,
      total: seasons.length
    });
  } catch (error) {
    console.error('Error in GET /api/seasons:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch seasons',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/seasons - Create a new season
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { name, start_date, end_date, ruleset_id, ranked_games_count } = body;

    // Validate required fields
    if (!name || !start_date) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          required: ['name', 'start_date']
        },
        { status: 400 }
      );
    }

    // Validate date format
    const startDate = new Date(start_date);
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

    if (end_date) {
      const endDate = new Date(end_date);
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

      if (endDate <= startDate) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid date range',
            message: 'end_date must be after start_date'
          },
          { status: 400 }
        );
      }
    }

    const season = await createSeason({
      name,
      startDate: start_date,
      endDate: end_date
    });

    return NextResponse.json({
      success: true,
      data: season,
      message: 'Season createdAt successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/seasons:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create season',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
