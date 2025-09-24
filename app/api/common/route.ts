import {
  checkDatabaseHealth,
  getCountries,
  getLocations,
  getOnlineApps,
  getRulesets,
  getUmaConfigurations
} from '@/lib/database/queries/common';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/common?type=countries|locations|rulesets|uma|online_apps|health
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing type parameter',
          message: 'Specify type: countries, locations, rulesets, uma, online_apps, or health'
        },
        { status: 400 }
      );
    }

    switch (type) {
      case 'countries':
        const countries = await getCountries();
        return NextResponse.json({
          success: true,
          data: countries,
          total: countries.length
        });

      case 'locations':
        const locations = await getLocations();
        return NextResponse.json({
          success: true,
          data: locations,
          total: locations.length
        });

      case 'rulesets':
        const rulesets = await getRulesets();
        return NextResponse.json({
          success: true,
          data: rulesets,
          total: rulesets.length
        });

      case 'uma':
        const uma = await getUmaConfigurations();
        return NextResponse.json({
          success: true,
          data: uma,
          total: uma.length
        });

      case 'online_apps':
        const onlineApps = await getOnlineApps();
        return NextResponse.json({
          success: true,
          data: onlineApps,
          total: onlineApps.length
        });

      case 'health':
        const health = await checkDatabaseHealth();
        return NextResponse.json({
          success: true,
          data: { connected: health }
        }, { status: health ? 200 : 503 });

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid type',
            message: 'Type must be one of: countries, locations, rulesets, uma, online_apps, health'
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in GET /api/common:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/common?action=initialize - Initialize database with default data
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action !== 'initialize') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid action',
          message: 'Only action=initialize is supported'
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully with default data'
    });
  } catch (error) {
    console.error('Error in POST /api/common:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to initialize database',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
