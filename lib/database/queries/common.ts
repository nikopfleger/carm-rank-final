import { prisma } from '../client';
import { Country, Location, OnlineApp, Ruleset, Uma } from './types';

// Get all countries
export async function getCountries(): Promise<Country[]> {
  try {
    const countries = await prisma.country.findMany({
      orderBy: {
        fullName: 'asc'
      }
    });

    return countries.map(country => ({
      id: country.id,
      iso_code: country.isoCode,
      name_es: country.fullName,
      name_en: country.fullName, // Assuming name_en is same as name_es for now
    }));
  } catch (error) {
    console.error('Error in getCountries:', error);
    throw new Error(`Failed to fetch countries: ${error}`);
  }
}

// Get all locations
export async function getLocations(): Promise<Location[]> {
  try {
    const locations = await prisma.location.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    return locations.map(location => ({
      id: location.id,
      name: location.name,
      address: location.address || undefined,
      online_platform: location.extraData ? 'online' : 'offline', // Simplified mapping
      createdAt: location.createdAt,
      updatedAt: location.updatedAt,
    }));
  } catch (error) {
    console.error('Error in getLocations:', error);
    throw new Error(`Failed to fetch locations: ${error}`);
  }
}

// Get all rulesets
export async function getRulesets(): Promise<Ruleset[]> {
  try {
    const rulesets = await prisma.ruleset.findMany({
      include: {
        uma: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Type assertion to include updatedAt until Prisma client regenerates
    type RulesetWithupdatedAt = typeof rulesets[0] & { updatedAt: Date | null };

    return rulesets.map((ruleset: RulesetWithupdatedAt) => ({
      id: ruleset.id,
      name: ruleset.name,
      description: `${ruleset.name} ruleset`, // Based on name instead of gameLength
      createdAt: ruleset.createdAt,
      updatedAt: ruleset.updatedAt || ruleset.createdAt, // Uses updatedAt now that type is fixed
      // Real schema fields
      umaId: ruleset.umaId,
      oka: ruleset.oka,
      chonbo: ruleset.chonbo,
      aka: ruleset.aka,
      inPoints: ruleset.inPoints,
      outPoints: ruleset.outPoints,
      sanma: ruleset.sanma,
      extraData: ruleset.extraData,
    }));
  } catch (error) {
    console.error('Error in getRulesets:', error);
    throw new Error(`Failed to fetch rulesets: ${error}`);
  }
}

// Get all UMA configurations
export async function getUmaConfigurations(): Promise<Uma[]> {
  try {
    const umaConfigs = await prisma.uma.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    return umaConfigs.map(uma => ({
      id: uma.id,
      name: uma.name,
      first_place: uma.firstPlace,
      second_place: uma.secondPlace,
      third_place: uma.thirdPlace,
      fourth_place: uma.fourthPlace, // Keep null as is
      createdAt: uma.createdAt,
      updatedAt: uma.createdAt, // Uma model doesn't have updatedAt in schema
    }));
  } catch (error) {
    console.error('Error in getUmaConfigurations:', error);
    throw new Error(`Failed to fetch UMA configurations: ${error}`);
  }
}

// Get all online apps
export async function getOnlineApps(): Promise<OnlineApp[]> {
  try {
    const onlineUsers = await prisma.onlineUser.findMany({
      orderBy: {
        platform: 'asc'
      }
    });

    // Group by platform to get unique platforms
    const uniquePlatforms = Array.from(new Set(onlineUsers.map(user => user.platform)));

    return uniquePlatforms.map((platform, index) => ({
      id: index + 1,
      platform: platform,
      name: platform === 'TENHOU' ? 'Tenhou' : 'Mahjong Soul',
      createdAt: onlineUsers[0]?.createdAt || new Date(),
      updatedAt: onlineUsers[0]?.updatedAt || new Date(),
    }));
  } catch (error) {
    console.error('Error in getOnlineApps:', error);
    throw new Error(`Failed to fetch online apps: ${error}`);
  }
}

// Check database health
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    console.log('🏥 Checking database health...');

    // Test basic connection
    await prisma.$queryRaw`SELECT 1 as test`;

    // Check table counts
    const counts = {
      countries: await prisma.country.count(),
      locations: await prisma.location.count(),
      rulesets: await prisma.ruleset.count(),
      uma: await prisma.uma.count(),
      players: await prisma.player.count(),
      games: await prisma.game.count(),
    };

    console.log('📊 Database health check results:', counts);

    return true;
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    return false;
  }
}

// Get database info
export async function getDatabaseInfo(): Promise<any> {
  try {
    const [countries, locations, rulesets, uma, players, games] = await Promise.all([
      prisma.country.count(),
      prisma.location.count(),
      prisma.ruleset.count(),
      prisma.uma.count(),
      prisma.player.count(),
      prisma.game.count(),
    ]);

    return {
      countries,
      locations,
      rulesets,
      uma,
      players,
      games,
      status: 'healthy'
    };
  } catch (error) {
    console.error('Error getting database info:', error);
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}