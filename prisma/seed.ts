import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fail-fast siempre activo para el seed
const seedFail = (message: string): never => {
  throw new Error(message);
};

async function main() {
  console.log('🌱 Starting database seed...');

  // Check if seed has already been run - comprehensive check
  const existingCountries = await prisma.country.count();
  const existingUmas = await prisma.uma.count();
  const existingRulesets = await prisma.ruleset.count();
  const existingPlayers = await prisma.player.count();
  const existingSeasons = await prisma.season.count();
  const existingTournaments = await prisma.tournament.count();

  console.log(`📊 Current data: ${existingCountries} countries, ${existingUmas} umas, ${existingRulesets} rulesets, ${existingPlayers} players, ${existingSeasons} seasons, ${existingTournaments} tournaments`);

  // If we have substantial data, skip most of the seeding
  if (existingCountries > 10 && existingPlayers > 50 && existingSeasons > 3) {
    console.log('✅ Database already has substantial data, skipping most seeding operations...');
    console.log('🔄 Only ensuring critical configurations exist...');

    // Only do critical config checks and exit
    const danConfigs = await (prisma as any).danConfig.count();
    const rateConfigs = await (prisma as any).rateConfig.count();
    const seasonConfigs = await (prisma as any).seasonConfig.count();

    console.log(`🔧 Config status: ${danConfigs} dan configs, ${rateConfigs} rate configs, ${seasonConfigs} season configs`);

    if (danConfigs === 0 || rateConfigs === 0 || seasonConfigs === 0) {
      console.log('⚠️ Some configurations missing, but skipping full seed to avoid duplicates');
    }

    console.log('🎉 Database seed check completed - no changes needed!');
    return;
  }

  if (existingCountries > 0 && existingUmas > 0 && existingRulesets > 0) {
    console.log('✅ Basic seed data exists, checking other sections...');
  }

  // Seed Countries
  if (existingCountries === 0) {
    console.log('📍 Seeding countries...');
  } else {
    console.log('📍 Countries already exist, ensuring all are present...');
  }
  const countries = await prisma.country.createMany({
    data: [
      { isoCode: 'ARG', fullName: 'Argentina', nationality: 'Argentino' },
      { isoCode: 'JPN', fullName: 'Japan', nationality: 'Japonés' },
      { isoCode: 'CHN', fullName: 'China', nationality: 'Chino' },
      { isoCode: 'USA', fullName: 'United States', nationality: 'Estadounidense' },
      { isoCode: 'ESP', fullName: 'Spain', nationality: 'Español' },
      { isoCode: 'FRA', fullName: 'France', nationality: 'Francés' },
      { isoCode: 'ITA', fullName: 'Italy', nationality: 'Italiano' },
      { isoCode: 'DEU', fullName: 'Germany', nationality: 'Alemán' },
      { isoCode: 'BRA', fullName: 'Brazil', nationality: 'Brazileño' },
      { isoCode: 'MEX', fullName: 'Mexico', nationality: 'Mexicano' },
      { isoCode: 'CHL', fullName: 'Chile', nationality: 'Chileno' },
      { isoCode: 'URY', fullName: 'Uruguay', nationality: 'Uruguayo' },
      { isoCode: 'PER', fullName: 'Peru', nationality: 'Peruano' },
      { isoCode: 'COL', fullName: 'Colombia', nationality: 'Colombiano' },
      { isoCode: 'CAN', fullName: 'Canada', nationality: 'Canadiense' },
    ],
    skipDuplicates: true,
  });
  console.log(`✅ ${countries.count > 0 ? `Created ${countries.count} new` : 'Verified'} countries`);

  // Seed Uma configurations
  if (existingUmas === 0) {
    console.log('🎯 Seeding UMA configurations...');
  } else {
    console.log('🎯 UMA configurations already exist, ensuring they are up to date...');
  }
  const umaStandard = await prisma.uma.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'CARM Standard',
      firstPlace: 30,
      secondPlace: 10,
      thirdPlace: -10,
      fourthPlace: -30,
    },
  });

  const umaSanma = await prisma.uma.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'CARM Sanma Standard',
      firstPlace: 30,
      secondPlace: 0,
      thirdPlace: -30,
      fourthPlace: null,
    },
  });
  console.log('✅ UMA configurations ready');

  // Seed Rulesets
  if (existingRulesets === 0) {
    console.log('📋 Seeding rulesets...');
  } else {
    console.log('📋 Rulesets already exist, ensuring they are up to date...');
  }
  const rulesetYonma = await prisma.ruleset.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'CARM Yonma Standard',
      umaId: umaStandard.id,
      oka: 20,
      chonbo: -40,
      aka: false,
      inPoints: 25000,
      outPoints: 30000,
      sanma: false, // 4 jugadores
      extraData: {
        description: 'Reglas CARM estándar para 4 jugadores (Yonma)',
      },
    },
  });

  const rulesetSanma = await prisma.ruleset.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'CARM Sanma Standard',
      umaId: umaSanma.id, // Usar UMA específica para sanma
      oka: 15,
      chonbo: -40,
      aka: false,
      inPoints: 35000,
      outPoints: 40000,
      sanma: true, // 3 jugadores
      extraData: {
        description: 'Reglas CARM estándar para 3 jugadores (Sanma)',
      },
    },
  });
  console.log('✅ createdAt rulesets');

  // Seed Historical Season 2016/2017 (approx from CSV)
  console.log('📅 Seeding historical season 2016/2017...');
  let historicalSeason = await prisma.season.findFirst({
    where: { name: 'Temporada 1' }
  });
  if (!historicalSeason) {
    historicalSeason = await prisma.season.create({
      data: {
        name: 'Temporada 1',
        startDate: new Date('2016-09-03'),
        endDate: new Date('2017-07-11'),
        isClosed: true,
        extraData: {
          source: 'approx_from_csv',
          note: 'Primera temporada estimada por acumulados (Figo/Iori=47, Nico=63, Haku/Kozi=39, Jess=15, Pato=39)'
        }
      },
    });
  }
  console.log('✅ createdAt historical season 2016/2017');

  // Seed Second Season 2017 (from 2017-07-12 to 2017-12-17)
  console.log('📅 Seeding season 2017 (S2)...');
  let season2017S2 = await prisma.season.findFirst({
    where: { name: 'Temporada 2' }
  });
  if (!season2017S2) {
    season2017S2 = await prisma.season.create({
      data: {
        name: 'Temporada 2',
        startDate: new Date('2017-07-12'),
        endDate: new Date('2017-12-17'),
        isClosed: true,
        extraData: {
          source: 'approx_from_csv',
          note: 'Segunda temporada 2017 por acumulados (Nico=159, Lucas=239, Figo/Iori=166, Adrian=200, Michael=165, Lucio=207)'
        }
      },
    });
  }
  console.log('✅ createdAt season 2017 (S2)');

  // Seed Third Season 2017-2018 (from 2017-12-18 to 2018-12-31)
  console.log('📅 Seeding season 2017-2018 (S3)...');
  let season2018 = await prisma.season.findFirst({
    where: { name: 'Temporada 3' }
  });
  if (!season2018) {
    season2018 = await prisma.season.create({
      data: {
        name: 'Temporada 3',
        startDate: new Date('2017-12-18'),
        endDate: new Date('2018-12-31'),
        isClosed: true,
        extraData: {
          source: 'manual_range',
        }
      },
    });
  }
  console.log('✅ createdAt season 2017-2018 (S3)');

  // Seed Fourth Season 2019-2020 (from 2019-01-01 to 2020-08-15)
  console.log('📅 Seeding season 2019-2020 (S4)...');
  let season2019_2020 = await prisma.season.findFirst({
    where: { name: 'Temporada 4' }
  });
  if (!season2019_2020) {
    season2019_2020 = await prisma.season.create({
      data: {
        name: 'Temporada 4',
        startDate: new Date('2019-01-01'),
        endDate: new Date('2020-08-15'),
        isClosed: true,
        extraData: { source: 'manual_range' }
      },
    });
  }
  console.log('✅ createdAt season 2019-2020 (S4)');

  // Seed Fifth Season 2020-2024 (from 2020-08-16 to 2023-12-31)
  console.log('📅 Seeding season 2020-2023 (S5)...');
  let season2020_2024 = await prisma.season.findFirst({
    where: { name: 'Temporada 5' }
  });
  if (!season2020_2024) {
    season2020_2024 = await prisma.season.create({
      data: {
        name: 'Temporada 5',
        startDate: new Date('2020-08-16'),
        endDate: new Date('2023-12-31'),
        isClosed: true,
        extraData: { source: 'manual_range' }
      },
    });
  }
  console.log('✅ createdAt season 2020-2023 (S5)');

  // Seed Sixth Season 2024-2026 (from 2024-01-01 to 2026-12-31)
  console.log('📅 Seeding season 2024-2026 (S6)...');
  let season2024_2026 = await prisma.season.findFirst({
    where: { name: 'Temporada 2024/2025' }
  });
  if (!season2024_2026) {
    season2024_2026 = await prisma.season.create({
      data: {
        name: 'Temporada 2024/2025',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2025-12-31'),
        isClosed: false,
        extraData: { source: 'manual_range' }
      },
    });
  }
  console.log('✅ createdAt season 2024-2026 (S6)');

  // Create all players
  const argCountry = await prisma.country.findFirst({
    where: { isoCode: 'ARG' },
  });

  if (argCountry) {
    console.log('👤 Creating all players...');

    // Mapeo de nacionalidades
    const countryMap: { [key: string]: number } = {
      'ARG': argCountry.id,
      'JPN': (await prisma.country.findUnique({ where: { isoCode: 'JPN' } }))?.id || argCountry.id,
      'CHN': (await prisma.country.findUnique({ where: { isoCode: 'CHN' } }))?.id || argCountry.id,
      'USA': (await prisma.country.findUnique({ where: { isoCode: 'USA' } }))?.id || argCountry.id,
      'ESP': (await prisma.country.findUnique({ where: { isoCode: 'ESP' } }))?.id || argCountry.id,
      'FRA': (await prisma.country.findUnique({ where: { isoCode: 'FRA' } }))?.id || argCountry.id,
      'ITA': (await prisma.country.findUnique({ where: { isoCode: 'ITA' } }))?.id || argCountry.id,
      'DEU': (await prisma.country.findUnique({ where: { isoCode: 'DEU' } }))?.id || argCountry.id,
      'BRA': (await prisma.country.findUnique({ where: { isoCode: 'BRA' } }))?.id || argCountry.id,
      'MEX': (await prisma.country.findUnique({ where: { isoCode: 'MEX' } }))?.id || argCountry.id,
      'CHL': (await prisma.country.findUnique({ where: { isoCode: 'CHL' } }))?.id || argCountry.id,
      'URY': (await prisma.country.findUnique({ where: { isoCode: 'URY' } }))?.id || argCountry.id,
      'PER': (await prisma.country.findUnique({ where: { isoCode: 'PER' } }))?.id || argCountry.id,
      'COL': (await prisma.country.findUnique({ where: { isoCode: 'COL' } }))?.id || argCountry.id,
      'CAN': (await prisma.country.findUnique({ where: { isoCode: 'CAN' } }))?.id || argCountry.id,
    };

    const playersData = [
      { nickname: "Mati", fullname: "Matias Alloatti", playerNumber: 1, countryCode: 'ARG' },
      { nickname: "Nico", fullname: "Nicolas Pfleger", playerNumber: 2, countryCode: 'ARG' },
      { nickname: "Lukas", fullname: "Lucas", playerNumber: 3, countryCode: 'ARG' },
      { nickname: "Guile", fullname: "Guile", playerNumber: 4, countryCode: 'ARG' },
      { nickname: "Chiwi", fullname: "Claudio", playerNumber: 5, countryCode: 'ARG' },
      { nickname: "Pato", fullname: "Pato", playerNumber: 6, countryCode: 'ARG' },
      { nickname: "Marce", fullname: "Marcelo", playerNumber: 7, countryCode: 'ARG' },
      { nickname: "Mati G", fullname: "", playerNumber: 8, countryCode: 'ARG' },
      { nickname: "Lucas", fullname: "Lucas P", playerNumber: 9, countryCode: 'ARG' },
      { nickname: "German", fullname: "", playerNumber: 10, countryCode: 'ARG' },
      { nickname: "Adrian", fullname: "Adrian Porta", playerNumber: 11, countryCode: 'ARG' },
      { nickname: "Ailén", fullname: "Ailén", playerNumber: 12, countryCode: 'ARG' },
      { nickname: "Leo", fullname: "", playerNumber: 13, countryCode: 'ARG' },
      { nickname: "Claudia", fullname: "Claudia", playerNumber: 14, countryCode: 'ARG' },
      { nickname: "Mauro", fullname: "Mauro", playerNumber: 15, countryCode: 'CHL' },
      { nickname: "Gabriela", fullname: "", playerNumber: 16, countryCode: 'ARG' },
      { nickname: "Haku/Kozi", fullname: "Facundo Zorrilla Jimenez", playerNumber: 17, countryCode: 'ARG' },
      { nickname: "Andres", fullname: "", playerNumber: 18, countryCode: 'ARG' },
      { nickname: "Tomas", fullname: "", playerNumber: 19, countryCode: 'ARG' },
      { nickname: "Danbliz", fullname: "", playerNumber: 20, countryCode: 'ARG' },
      { nickname: "Jess", fullname: "Jess", playerNumber: 21, countryCode: 'ARG' },
      { nickname: "MegaJL", fullname: "", playerNumber: 22, countryCode: 'ARG' },
      { nickname: "Paula", fullname: "", playerNumber: 23, countryCode: 'ARG' },
      { nickname: "Fran", fullname: "", playerNumber: 24, countryCode: 'ARG' },
      { nickname: "San", fullname: "", playerNumber: 25, countryCode: 'ARG' },
      { nickname: "Huan", fullname: "", playerNumber: 26, countryCode: 'ARG' },
      { nickname: "Javilo", fullname: "", playerNumber: 27, countryCode: 'ARG' },
      { nickname: "Maxi", fullname: "Maximiliano", playerNumber: 28, countryCode: 'ARG' },
      { nickname: "Sofi", fullname: "Sofia", playerNumber: 29, countryCode: 'ARG' },
      { nickname: "Somar", fullname: "", playerNumber: 30, countryCode: 'ARG' },
      { nickname: "Adriel", fullname: "", playerNumber: 31 },
      { nickname: "Agus", fullname: "", playerNumber: 32 },
      { nickname: "Fofo", fullname: "", playerNumber: 33 },
      { nickname: "Agus I", fullname: "", playerNumber: 34 },
      { nickname: "Agustina H", fullname: "", playerNumber: 35 },
      { nickname: "Ailen", fullname: "", playerNumber: 36 },
      { nickname: "Akito", fullname: "", playerNumber: 37 },
      { nickname: "Laura", fullname: "", playerNumber: 38 },
      { nickname: "Alan", fullname: "", playerNumber: 39 },
      { nickname: "Alberto", fullname: "", playerNumber: 40 },
      { nickname: "Aldana", fullname: "", playerNumber: 41 },
      { nickname: "Daniel", fullname: "", playerNumber: 42 },
      { nickname: "Alejandro", fullname: "", playerNumber: 43 },
      { nickname: "Alex", fullname: "", playerNumber: 44 },
      { nickname: "Amauri (BR)", fullname: "", playerNumber: 45, countryCode: 'BRA' },
      { nickname: "Andre", fullname: "", playerNumber: 46, countryCode: 'ARG' },
      { nickname: "Angel", fullname: "", playerNumber: 47, countryCode: 'ARG' },
      { nickname: "Angie", fullname: "", playerNumber: 48, countryCode: 'ARG' },
      { nickname: "Ariel M.", fullname: "", playerNumber: 49, countryCode: 'ARG' },
      { nickname: "Arthur (BR)", fullname: "", playerNumber: 50, countryCode: 'BRA' },
      { nickname: "Arthur M (MX)", fullname: "", playerNumber: 51, countryCode: 'MEX' },
      { nickname: "Auca", fullname: "", playerNumber: 52 },
      { nickname: "Azul", fullname: "", playerNumber: 53 },
      { nickname: "Bata", fullname: "", playerNumber: 54 },
      { nickname: "Camilo", fullname: "", playerNumber: 55 },
      { nickname: "Carlos", fullname: "", playerNumber: 56 },
      { nickname: "Cecilia", fullname: "", playerNumber: 57 },
      { nickname: "Cristian (CL)", fullname: "", playerNumber: 58, countryCode: 'CHL' },
      { nickname: "Cristóbal (CL) (Kenzo)", fullname: "", playerNumber: 59, countryCode: 'CHL' },
      { nickname: "Daniel (old)", fullname: "", playerNumber: 60 },
      { nickname: "Daniela", fullname: "", playerNumber: 61 },
      { nickname: "Davy", fullname: "", playerNumber: 62 },
      { nickname: "Diego (old)", fullname: "", playerNumber: 63 },
      { nickname: "Diego C.", fullname: "", playerNumber: 64 },
      { nickname: "Duro", fullname: "", playerNumber: 65 },
      { nickname: "Emi", fullname: "", playerNumber: 66 },
      { nickname: "Emma", fullname: "", playerNumber: 67 },
      { nickname: "Emo", fullname: "", playerNumber: 68 },
      { nickname: "Kime", fullname: "Nicolas Ishihara", playerNumber: 69, countryCode: 'JPN' },
      { nickname: "Enio", fullname: "", playerNumber: 70 },
      { nickname: "Ernesto", fullname: "", playerNumber: 71 },
      { nickname: "Eze", fullname: "", playerNumber: 72 },
      { nickname: "Diego", fullname: "", playerNumber: 73 },
      { nickname: "Ezequiel", fullname: "", playerNumber: 74 },
      { nickname: "Uma", fullname: "", playerNumber: 75 },
      { nickname: "Facu (UY)", fullname: "", playerNumber: 76, countryCode: 'URY' },
      { nickname: "Guille", fullname: "", playerNumber: 77 },
      { nickname: "Falconer", fullname: "", playerNumber: 78 },
      { nickname: "FedeRama", fullname: "", playerNumber: 79 },
      { nickname: "Federico", fullname: "", playerNumber: 80 },
      { nickname: "Federico Albor", fullname: "", playerNumber: 81 },
      { nickname: "Felipe (CL)", fullname: "", playerNumber: 82, countryCode: 'CHL' },
      { nickname: "Fer", fullname: "", playerNumber: 83 },
      { nickname: "Fernando A", fullname: "", playerNumber: 84 },
      { nickname: "Figo/Iori", fullname: "", playerNumber: 85 },
      { nickname: "Franco", fullname: "", playerNumber: 86 },
      { nickname: "Franco (CL) (furanchizuko)", fullname: "", playerNumber: 87, countryCode: 'CHL' },
      { nickname: "Franco Albor", fullname: "", playerNumber: 88 },
      { nickname: "Gilberto K.", fullname: "", playerNumber: 89 },
      { nickname: "Guido (BR)", fullname: "", playerNumber: 90, countryCode: 'BRA' },
      { nickname: "Ian", fullname: "", playerNumber: 91 },
      { nickname: "Ini", fullname: "", playerNumber: 92 },
      { nickname: "Dario", fullname: "Dario", playerNumber: 93 },
      { nickname: "Szarps", fullname: "", playerNumber: 94 },
      { nickname: "JC", fullname: "", playerNumber: 95 },
      { nickname: "Jhony", fullname: "", playerNumber: 96 },
      { nickname: "Jonathan", fullname: "", playerNumber: 97 },
      { nickname: "Jorge", fullname: "", playerNumber: 98 },
      { nickname: "Juan Mateo", fullname: "", playerNumber: 99 },
      { nickname: "Juan", fullname: "", playerNumber: 100 },
      { nickname: "Juan M.", fullname: "", playerNumber: 101 },
      { nickname: "Juan Mateo", fullname: "", playerNumber: 102 },
      { nickname: "Juli F", fullname: "", playerNumber: 103 },
      { nickname: "Kelo", fullname: "", playerNumber: 104 },
      { nickname: "Kevin", fullname: "", playerNumber: 105 },
      { nickname: "Koki", fullname: "", playerNumber: 106 },
      { nickname: "Kress", fullname: "", playerNumber: 107 },
      { nickname: "Lautaro (LP) DiG.", fullname: "", playerNumber: 108 },
      { nickname: "Leonardo (CL) (caballo)", fullname: "", playerNumber: 109, countryCode: 'CHL' },
      { nickname: "Lucas Albor", fullname: "", playerNumber: 110 },
      { nickname: "Lucas R. (BR) (LagadoBR)", fullname: "", playerNumber: 111, countryCode: 'BRA' },
      { nickname: "Lucila (Luuucilu", fullname: "", playerNumber: 112 },
      { nickname: "Lui", fullname: "", playerNumber: 113 },
      { nickname: "Luli", fullname: "", playerNumber: 114 },
      { nickname: "Manuel P.", fullname: "", playerNumber: 115 },
      { nickname: "Marcelo", fullname: "", playerNumber: 116 },
      { nickname: "Marcos O", fullname: "", playerNumber: 117 },
      { nickname: "Maria C.", fullname: "", playerNumber: 118 },
      { nickname: "Marian", fullname: "", playerNumber: 119 },
      { nickname: "Martin", fullname: "", playerNumber: 120 },
      { nickname: "Martin O.", fullname: "", playerNumber: 121 },
      { nickname: "Mathias", fullname: "", playerNumber: 122 },
      { nickname: "Lucio", fullname: "Lucio", playerNumber: 123 },
      { nickname: "Mati G. (minimati)", fullname: "", playerNumber: 124 },
      { nickname: "Mati S.", fullname: "", playerNumber: 125 },
      { nickname: "Max D.", fullname: "", playerNumber: 126 },
      { nickname: "Mayra", fullname: "", playerNumber: 127 },
      { nickname: "Michael", fullname: "", playerNumber: 128, countryCode: 'CAN' },
      { nickname: "Miguel", fullname: "", playerNumber: 129 },
      { nickname: "Feli", fullname: "", playerNumber: 130 },
      { nickname: "Mikami", fullname: "", playerNumber: 131 },
      { nickname: "Nadia", fullname: "", playerNumber: 132 },
      { nickname: "Nahuel", fullname: "", playerNumber: 133 },
      { nickname: "Nakanaki", fullname: "", playerNumber: 134 },
      { nickname: "Naoko", fullname: "", playerNumber: 135 },
      { nickname: "Juli", fullname: "Julián", playerNumber: 136 },
      { nickname: "Nicolas (Claudio friend)", fullname: "", playerNumber: 137 },
      { nickname: "Nicolas (old)", fullname: "", playerNumber: 138 },
      { nickname: "Nicolas M.", fullname: "", playerNumber: 139 },
      { nickname: "Nyamikki (DISCORD)", fullname: "", playerNumber: 140 },
      { nickname: "Octavio", fullname: "", playerNumber: 141 },
      { nickname: "Oli", fullname: "", playerNumber: 142 },
      { nickname: "Osqui", fullname: "", playerNumber: 143 },
      { nickname: "Pablo (2de6)", fullname: "", playerNumber: 144 },
      { nickname: "Pablo G.", fullname: "", playerNumber: 145 },
      { nickname: "Pancho", fullname: "", playerNumber: 146 },
      { nickname: "Pedro", fullname: "", playerNumber: 147 },
      { nickname: "Pol", fullname: "", playerNumber: 148 },
      { nickname: "Quimei", fullname: "", playerNumber: 149 },
      { nickname: "Romo", fullname: "", playerNumber: 150 },
      { nickname: "Roy", fullname: "", playerNumber: 151 },
      { nickname: "Samanta", fullname: "", playerNumber: 152 },
      { nickname: "Santiago", fullname: "", playerNumber: 153 },
      { nickname: "Santiago Albor", fullname: "", playerNumber: 154 },
      { nickname: "Saulo", fullname: "", playerNumber: 155 },
      { nickname: "Sebas (CO)", fullname: "", playerNumber: 156, countryCode: 'COL' },
      { nickname: "Sebastián (PE) (SethSeroly)", fullname: "", playerNumber: 157, countryCode: 'PER' },
      { nickname: "Tamara", fullname: "", playerNumber: 158 },
      { nickname: "Taro", fullname: "", playerNumber: 159 },
      { nickname: "Valeria", fullname: "", playerNumber: 160 },
      { nickname: "Virginia", fullname: "", playerNumber: 161 },
      { nickname: "Wapuro", fullname: "", playerNumber: 162 },
      { nickname: "Jrash", fullname: "", playerNumber: 163 },
      { nickname: "Lloocky", fullname: "", playerNumber: 201 },
      { nickname: "Felicitas", fullname: "", playerNumber: 216 },
      { nickname: "Tami", fullname: "Tamara", playerNumber: 303 },
      { nickname: "Dario A", fullname: "", playerNumber: 420 },
      { nickname: "Lautaro", fullname: "", playerNumber: 729 },
      { nickname: "Mel", fullname: "", playerNumber: 813 },
      { nickname: "Lucas?", fullname: "", playerNumber: 912 },
      { nickname: "Buli", fullname: "", playerNumber: 999 },
      { nickname: "Walt", fullname: "", playerNumber: 9023 },
    ];

    let createdAtPlayers = 0;
    for (const playerData of playersData) {
      const countryId = playerData.countryCode ? countryMap[playerData.countryCode] : argCountry.id;

      // Skip if countryId is undefined
      if (!countryId) {
        console.log(`⚠️ Skipping player ${playerData.nickname} - no valid country`);
        continue;
      }

      await (prisma as any).player.upsert({
        where: { nickname: playerData.nickname },
        update: {},
        create: {
          nickname: playerData.nickname,
          fullname: playerData.fullname || null,
          countryId: countryId,
          playerNumber: playerData.playerNumber,
          birthday: null,
        },
      });
      createdAtPlayers++;
    }

    console.log(`✅ createdAt ${createdAtPlayers} players`);

    // Seed Online Accounts
    console.log('🎮 Creating online accounts...');
    const onlineAccountsData = [
      { nickname: "Mati", onlineNickname: "Matute", onlineId: "125332078" },
      { nickname: "Nico", onlineNickname: "Tacosss", onlineId: "117735022" },
      { nickname: "Lukas", onlineNickname: "LukasSW", onlineId: "94424812" },
      { nickname: "Guile", onlineNickname: "TAMIYO", onlineId: "87187434" },
      { nickname: "Chiwi", onlineNickname: "Chiwi", onlineId: "" },
      { nickname: "Pato", onlineNickname: "Scipio", onlineId: "119758702" },
      { nickname: "Marce", onlineNickname: "Marcelomecozzi", onlineId: "" },
      { nickname: "Lucas", onlineNickname: "daibutsu", onlineId: "126927854" },
      { nickname: "German", onlineNickname: "Ger11Man", onlineId: "123677166" },
      { nickname: "Adrian", onlineNickname: "Kamai", onlineId: "117355118" },
      { nickname: "Ailén", onlineNickname: "Airenea", onlineId: "" },
      { nickname: "Claudia", onlineNickname: "Ophiuchus", onlineId: "" },
      { nickname: "Mauro", onlineNickname: "chuuren_c", onlineId: "" },
      { nickname: "Gabriela", onlineNickname: "Gabyybg", onlineId: "" },
      { nickname: "Haku/Kozi", onlineNickname: "Hakundo", onlineId: "120580965" },
      { nickname: "Andres", onlineNickname: "Phibrizzo", onlineId: "120517989" },
      { nickname: "Tomas", onlineNickname: "DonLapa", onlineId: "126223342" },
      { nickname: "Danbliz", onlineNickname: "Danbliz", onlineId: "118882789" },
      { nickname: "Jess", onlineNickname: "琴鳥Jess", onlineId: "113302126" },
      { nickname: "MegaJL", onlineNickname: "MegaJL", onlineId: "" },
      { nickname: "Paula", onlineNickname: "PrivateIdaho", onlineId: "103775209" },
      { nickname: "Fran", onlineNickname: "Francis1265", onlineId: "" },
      { nickname: "San", onlineNickname: "Anatogis", onlineId: "" },
      { nickname: "Huan", onlineNickname: "Skunkix", onlineId: "87303146" },
      { nickname: "Javilo", onlineNickname: "javilo", onlineId: "" },
      { nickname: "Maxi", onlineNickname: "StMaximilian", onlineId: "82971498" },
      { nickname: "Somar", onlineNickname: "Somar84", onlineId: "99811945" },
      { nickname: "Fofo", onlineNickname: "MasterFofo", onlineId: "120655077" },
      { nickname: "Kime", onlineNickname: "ニコラスNPM", onlineId: "79678852" },
      { nickname: "Uma", onlineNickname: "Sha5", onlineId: "86129124" },
      { nickname: "Guille", onlineNickname: "reokuro", onlineId: "" },
      { nickname: "Dario", onlineNickname: "xjujyx", onlineId: "85769450" },
      { nickname: "Szarps", onlineNickname: "Szarps", onlineId: "86267620" },
      { nickname: "Lucio", onlineNickname: "DrMelon", onlineId: "" },
      { nickname: "Juli", onlineNickname: "junchan_e", onlineId: "" },
      { nickname: "Lloocky", onlineNickname: "Lloock", onlineId: "" },
      { nickname: "Felicitas", onlineNickname: "Isoleri", onlineId: "108929516" },
      { nickname: "Dario A", onlineNickname: "Kychiel", onlineId: "86168805" },
      { nickname: "Lautaro", onlineNickname: "PIBEWNK", onlineId: "96750179" },
      { nickname: "Mel", onlineNickname: "Politeia", onlineId: "" },
    ];

    let createdOnlineAccounts = 0;
    for (const accountData of onlineAccountsData) {
      // Buscar el jugador por nickname
      const player = await prisma.player.findUnique({
        where: { nickname: accountData.nickname }
      });

      if (player) {
        // Verificar si ya existe una cuenta online para este jugador
        const existingOnlineUser = await prisma.onlineUser.findFirst({
          where: {
            playerId: player.id,
            platform: 'MAHJONG_SOUL'
          }
        });

        if (existingOnlineUser) {
          // Actualizar la cuenta existente
          await prisma.onlineUser.update({
            where: { id: existingOnlineUser.id },
            data: {
              username: accountData.onlineNickname,
              idOnline: accountData.onlineId || null,
            },
          });
        } else {
          // Crear nueva cuenta online
          await prisma.onlineUser.create({
            data: {
              playerId: player.id,
              platform: 'MAHJONG_SOUL',
              username: accountData.onlineNickname,
              idOnline: accountData.onlineId || null,
            },
          });
        }
        createdOnlineAccounts++;
      } else {
        console.warn(`⚠️ Player not found: ${accountData.nickname}`);
      }
    }

    console.log(`✅ Created ${createdOnlineAccounts} online accounts`);
  }

  // Seed Tournaments
  console.log('🏆 Seeding tournaments...');
  const tournaments = [
    { id: 1, name: '2do torneo presencial', startDate: '2017-07-16', endDate: '2017-07-16' },
    { id: 2, name: 'Tercero torneo presencial', startDate: '2017-12-16', endDate: '2017-12-17' },
    { id: 3, name: '2do torneo sudamericano SAMA', startDate: '2018-06-02', endDate: '2018-06-03' },
    { id: 4, name: 'Liga CARM 2018', startDate: '2018-02-25', endDate: '2018-09-02' },
    { id: 5, name: 'Primer minitorneo (online)', startDate: '2019-03-02', endDate: '2019-03-02' },
    { id: 6, name: 'Segundo minitorneo (presencial)', startDate: '2019-03-17', endDate: '2019-03-17' },
    { id: 20, name: 'Tercer minitorneo (online)', startDate: '2019-04-07', endDate: '2019-04-07' },
    { id: 7, name: 'Cuarto minitorneo (presencial)', startDate: '2019-04-27', endDate: '2019-04-27' },
    { id: 8, name: 'Quinto minitorneo (online)', startDate: '2019-05-11', endDate: '2019-05-11' },
    { id: 21, name: 'Sexto minitorneo (presencial)', startDate: '2019-05-26', endDate: '2019-05-26' },
    { id: 9, name: '1er torneo online 2019', startDate: '2019-06-30', endDate: '2019-06-30' },
    { id: 10, name: 'Olimpiadas de la mente 2019', startDate: '2019-08-04', endDate: '2019-08-04' },
    { id: 11, name: '4to torneo presencial', startDate: '2019-10-06', endDate: '2019-10-13' },
    { id: 12, name: '10mo Minitorneo Online', startDate: '2019-12-01', endDate: '2019-12-01' },
    { id: 13, name: '2do torneo online 2019', startDate: '2019-12-21', endDate: '2019-12-21' },
    { id: 14, name: 'Primer minitorneo (presencial) 2020', startDate: '2020-03-01', endDate: '2020-03-01' },
    { id: 15, name: 'Torneo online abril 2020 Tenhou', startDate: '2020-04-19', endDate: '2020-04-19' },
    { id: 16, name: 'Torneo Relámpago CARM', startDate: '2020-08-16', endDate: '2020-08-17' },
    { id: 17, name: 'Torneo Septiembre 2020', startDate: '2020-09-26', endDate: '2020-09-27' },
    { id: 18, name: 'Mahjong Soul 2020', startDate: '2020-10-10', endDate: '2020-10-11' },
    { id: 19, name: '1er torneo online', startDate: '2017-09-05', endDate: '2017-12-07' },
    { id: 20, name: 'Tercer minitorneo (online)', startDate: '2019-04-07', endDate: '2019-04-07' },
    { id: 21, name: 'Sexto minitorneo (presencial)', startDate: '2019-05-26', endDate: '2019-05-26' },
    { id: 22, name: 'Torneo Apertura 2023', startDate: '2023-03-18', endDate: '2023-03-19' },
    { id: 23, name: 'Olimpiadas de la mente 2023', startDate: '2023-11-12', endDate: '2023-11-12' },
    { id: 24, name: 'Riichi en pascuas 2024', startDate: '2024-03-31', endDate: '2024-04-02' },
    { id: 25, name: 'Torneo Online Diciembre 2024 Mahjong Soul', startDate: '2024-12-07', endDate: '2024-12-07' },
  ];

  for (const tournament of tournaments) {
    const sd = new Date(tournament.startDate);
    let seasonIdForTournament: number | null = null;

    // Buscar la temporada correspondiente por rango de fechas
    let season = null;
    if (sd >= new Date('2016-09-03') && sd <= new Date('2017-07-11')) {
      season = await prisma.season.findFirst({ where: { name: 'Temporada 1' } });
    } else if (sd >= new Date('2017-07-12') && sd <= new Date('2017-12-17')) {
      season = await prisma.season.findFirst({ where: { name: 'Temporada 2' } });
    } else if (sd >= new Date('2017-12-18') && sd <= new Date('2018-12-31')) {
      season = await prisma.season.findFirst({ where: { name: 'Temporada 3' } });
    } else if (sd >= new Date('2019-01-01') && sd <= new Date('2020-08-15')) {
      season = await prisma.season.findFirst({ where: { name: 'Temporada 4' } });
    } else if (sd >= new Date('2020-08-16') && sd <= new Date('2023-12-31')) {
      season = await prisma.season.findFirst({ where: { name: 'Temporada 5' } });
    } else if (sd >= new Date('2024-01-01') && sd <= new Date('2025-12-31')) {
      season = await prisma.season.findFirst({ where: { name: 'Temporada 2024/2025' } });
    }

    if (season) {
      seasonIdForTournament = season.id;
    }

    await prisma.tournament.upsert({
      where: { id: tournament.id },
      update: {},
      create: {
        id: tournament.id,
        seasonId: seasonIdForTournament,
        name: tournament.name,
        description: `Torneo ${tournament.id} - ${tournament.name}`,
        type: 'INDIVIDUAL',
        startDate: new Date(tournament.startDate),
        endDate: new Date(tournament.endDate),
        isCompleted: true,
        extraData: {
          source: 'csv_import',
          originalId: tournament.id,
        },
      },
    });
  }
  console.log(`✅ createdAt ${tournaments.length} tournaments`);


  async function findPlayerByNickname(nickname: string) {
    return await prisma.player.findFirst({ where: { nickname } });
  }

  async function getSeasonIdByName(name: string): Promise<number | null> {
    const season = await prisma.season.findFirst({ where: { name } });
    return season ? season.id : null;
  }

  // Seed SeasonResult Top 3 for season 1 (legacy, no Tonpu breakdown)
  console.log('🏅 Seeding SeasonResult Top 3 for Season 1...');
  const season1Top = [
    {
      nickname: 'Figo/Iori',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 47,
      avgPos: 1.91,
      first: 18,
      second: 17,
      third: 10,
      fourth: 2,
      firstPlaceH: 15,
      secondPlaceH: 15,
      thirdPlaceH: 9,
      fourthPlaceH: 2,
      firstPlaceT: 3,
      secondPlaceT: 2,
      thirdPlaceT: 1,
      fourthPlaceT: 0,
      points: 1952
    },
    {
      nickname: 'Nico',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 63,
      avgPos: 3.59,
      first: 0,
      second: 3,
      third: 20,
      fourth: 40,
      firstPlaceH: 0,
      secondPlaceH: 3,
      thirdPlaceH: 16,
      fourthPlaceH: 35,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 4,
      fourthPlaceT: 5,
      points: 1717
    },
    {
      nickname: 'Haku/Kozi',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 39,
      avgPos: 2.49,
      first: 7,
      second: 9,
      third: 20,
      fourth: 3,
      firstPlaceH: 7,
      secondPlaceH: 9,
      thirdPlaceH: 19,
      fourthPlaceH: 3,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 1,
      fourthPlaceT: 0,
      points: 1633
    },
    {
      nickname: 'Jess',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 15,
      avgPos: 2.13,
      first: 4,
      second: 6,
      third: 4,
      fourth: 1,
      firstPlaceH: 3,
      secondPlaceH: 2,
      thirdPlaceH: 4,
      fourthPlaceH: 1,
      firstPlaceT: 1,
      secondPlaceT: 4,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1624
    },
    {
      nickname: 'Pato',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 39,
      avgPos: 3.67,
      first: 0,
      second: 0,
      third: 13,
      fourth: 26,
      firstPlaceH: 0,
      secondPlaceH: 0,
      thirdPlaceH: 13,
      fourthPlaceH: 21,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 5,
      points: 1611
    },
    {
      nickname: 'Michael',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 25,
      avgPos: 3,
      first: 0,
      second: 7,
      third: 11,
      fourth: 7,
      firstPlaceH: 0,
      secondPlaceH: 7,
      thirdPlaceH: 8,
      fourthPlaceH: 4,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 3,
      fourthPlaceT: 3,
      points: 1608
    },
    {
      nickname: 'Mati',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 42,
      avgPos: 2.6,
      first: 2,
      second: 18,
      third: 17,
      fourth: 5,
      firstPlaceH: 2,
      secondPlaceH: 16,
      thirdPlaceH: 15,
      fourthPlaceH: 2,
      firstPlaceT: 0,
      secondPlaceT: 2,
      thirdPlaceT: 2,
      fourthPlaceT: 3,
      points: 1600
    },
    {
      nickname: 'Alejandro',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 14,
      avgPos: 1.07,
      first: 13,
      second: 1,
      third: 0,
      fourth: 0,
      firstPlaceH: 10,
      secondPlaceH: 1,
      thirdPlaceH: 0,
      fourthPlaceH: 0,
      firstPlaceT: 3,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1582
    },
    {
      nickname: 'Jhony',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 13,
      avgPos: 1.92,
      first: 3,
      second: 8,
      third: 2,
      fourth: 0,
      firstPlaceH: 1,
      secondPlaceH: 4,
      thirdPlaceH: 2,
      fourthPlaceH: 0,
      firstPlaceT: 2,
      secondPlaceT: 4,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1575
    },
    {
      nickname: 'Max D.',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 28,
      avgPos: 2.89,
      first: 0,
      second: 7,
      third: 17,
      fourth: 4,
      firstPlaceH: 0,
      secondPlaceH: 6,
      thirdPlaceH: 15,
      fourthPlaceH: 4,
      firstPlaceT: 0,
      secondPlaceT: 1,
      thirdPlaceT: 2,
      fourthPlaceT: 0,
      points: 1556
    },
    {
      nickname: 'Azul',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 10,
      avgPos: 1.4,
      first: 6,
      second: 4,
      third: 0,
      fourth: 0,
      firstPlaceH: 6,
      secondPlaceH: 4,
      thirdPlaceH: 0,
      fourthPlaceH: 0,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1540
    },
    {
      nickname: 'JC',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 1,
      avgPos: 1,
      first: 1,
      second: 0,
      third: 0,
      fourth: 0,
      firstPlaceH: 1,
      secondPlaceH: 0,
      thirdPlaceH: 0,
      fourthPlaceH: 0,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1532
    },
    {
      nickname: 'Koki',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 67,
      avgPos: 2.09,
      first: 18,
      second: 28,
      third: 18,
      fourth: 3,
      firstPlaceH: 16,
      secondPlaceH: 23,
      thirdPlaceH: 11,
      fourthPlaceH: 3,
      firstPlaceT: 2,
      secondPlaceT: 5,
      thirdPlaceT: 7,
      fourthPlaceT: 0,
      points: 1531
    },
    {
      nickname: 'Tamara',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 1,
      avgPos: 4,
      first: 0,
      second: 0,
      third: 0,
      fourth: 1,
      firstPlaceH: 0,
      secondPlaceH: 0,
      thirdPlaceH: 0,
      fourthPlaceH: 1,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1530
    },
    {
      nickname: 'Lautaro (LP) DiG.',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 3,
      avgPos: 3,
      first: 0,
      second: 1,
      third: 1,
      fourth: 1,
      firstPlaceH: 0,
      secondPlaceH: 1,
      thirdPlaceH: 1,
      fourthPlaceH: 1,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1528
    },
    {
      nickname: 'Angel',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 5,
      avgPos: 1.2,
      first: 4,
      second: 1,
      third: 0,
      fourth: 0,
      firstPlaceH: 3,
      secondPlaceH: 1,
      thirdPlaceH: 0,
      fourthPlaceH: 0,
      firstPlaceT: 1,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1522
    },
    {
      nickname: 'Daniel (old)',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 2,
      avgPos: 2,
      first: 0,
      second: 2,
      third: 0,
      fourth: 0,
      firstPlaceH: 0,
      secondPlaceH: 2,
      thirdPlaceH: 0,
      fourthPlaceH: 0,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1519
    },
    {
      nickname: 'Santiago',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 3,
      avgPos: 4,
      first: 0,
      second: 0,
      third: 0,
      fourth: 3,
      firstPlaceH: 0,
      secondPlaceH: 0,
      thirdPlaceH: 0,
      fourthPlaceH: 0,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 3,
      points: 1518
    },
    {
      nickname: 'Dario',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 16,
      avgPos: 1.25,
      first: 12,
      second: 4,
      third: 0,
      fourth: 0,
      firstPlaceH: 8,
      secondPlaceH: 3,
      thirdPlaceH: 0,
      fourthPlaceH: 0,
      firstPlaceT: 4,
      secondPlaceT: 1,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1512
    },
    {
      nickname: 'Emi',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 1,
      avgPos: 1,
      first: 1,
      second: 0,
      third: 0,
      fourth: 0,
      firstPlaceH: 1,
      secondPlaceH: 0,
      thirdPlaceH: 0,
      fourthPlaceH: 0,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1511
    },
    {
      nickname: 'Lucas',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 18,
      avgPos: 2.44,
      first: 0,
      second: 10,
      third: 8,
      fourth: 0,
      firstPlaceH: 0,
      secondPlaceH: 5,
      thirdPlaceH: 5,
      fourthPlaceH: 0,
      firstPlaceT: 0,
      secondPlaceT: 5,
      thirdPlaceT: 3,
      fourthPlaceT: 0,
      points: 1510
    },
    {
      nickname: 'Diego (old)',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 1,
      avgPos: 1,
      first: 1,
      second: 0,
      third: 0,
      fourth: 0,
      firstPlaceH: 1,
      secondPlaceH: 0,
      thirdPlaceH: 0,
      fourthPlaceH: 0,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1510
    },
    {
      nickname: 'Alan',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 1,
      avgPos: 1,
      first: 1,
      second: 0,
      third: 0,
      fourth: 0,
      firstPlaceH: 1,
      secondPlaceH: 0,
      thirdPlaceH: 0,
      fourthPlaceH: 0,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1510
    },
    {
      nickname: 'Pablo (2de6)',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 1,
      avgPos: 4,
      first: 0,
      second: 0,
      third: 0,
      fourth: 1,
      firstPlaceH: 0,
      secondPlaceH: 0,
      thirdPlaceH: 0,
      fourthPlaceH: 1,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1510
    },
    {
      nickname: 'Pedro',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 16,
      avgPos: 3.88,
      first: 0,
      second: 0,
      third: 2,
      fourth: 14,
      firstPlaceH: 0,
      secondPlaceH: 0,
      thirdPlaceH: 1,
      fourthPlaceH: 13,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 1,
      fourthPlaceT: 1,
      points: 1509
    },
    {
      nickname: 'Daniela',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 1,
      avgPos: 1,
      first: 1,
      second: 0,
      third: 0,
      fourth: 0,
      firstPlaceH: 0,
      secondPlaceH: 0,
      thirdPlaceH: 0,
      fourthPlaceH: 0,
      firstPlaceT: 1,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1506
    },
    {
      nickname: 'Chiwi',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 53,
      avgPos: 1.34,
      first: 37,
      second: 14,
      third: 2,
      fourth: 0,
      firstPlaceH: 30,
      secondPlaceH: 14,
      thirdPlaceH: 2,
      fourthPlaceH: 0,
      firstPlaceT: 7,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1504
    },
    {
      nickname: 'Guile',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 2,
      avgPos: 1.5,
      first: 1,
      second: 1,
      third: 0,
      fourth: 0,
      firstPlaceH: 1,
      secondPlaceH: 1,
      thirdPlaceH: 0,
      fourthPlaceH: 0,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1501
    },
    {
      nickname: 'Wapuro',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 2,
      avgPos: 4,
      first: 0,
      second: 0,
      third: 0,
      fourth: 2,
      firstPlaceH: 0,
      secondPlaceH: 0,
      thirdPlaceH: 0,
      fourthPlaceH: 2,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1499
    },
    {
      nickname: 'Marcos O',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 1,
      avgPos: 4,
      first: 0,
      second: 0,
      third: 0,
      fourth: 1,
      firstPlaceH: 0,
      secondPlaceH: 0,
      thirdPlaceH: 0,
      fourthPlaceH: 1,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1493
    },
    {
      nickname: 'Lucas Albor',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 3,
      avgPos: 3,
      first: 0,
      second: 0,
      third: 3,
      fourth: 0,
      firstPlaceH: 0,
      secondPlaceH: 0,
      thirdPlaceH: 0,
      fourthPlaceH: 0,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 3,
      fourthPlaceT: 0,
      points: 1493
    },
    {
      nickname: 'Alberto',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 1,
      avgPos: 1,
      first: 1,
      second: 0,
      third: 0,
      fourth: 0,
      firstPlaceH: 1,
      secondPlaceH: 0,
      thirdPlaceH: 0,
      fourthPlaceH: 0,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1491
    },
    {
      nickname: 'Nadia',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 4,
      avgPos: 2.5,
      first: 0,
      second: 2,
      third: 2,
      fourth: 0,
      firstPlaceH: 0,
      secondPlaceH: 1,
      thirdPlaceH: 2,
      fourthPlaceH: 0,
      firstPlaceT: 0,
      secondPlaceT: 1,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1490
    },
    {
      nickname: 'Davy',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 1,
      avgPos: 2,
      first: 0,
      second: 1,
      third: 0,
      fourth: 0,
      firstPlaceH: 0,
      secondPlaceH: 1,
      thirdPlaceH: 0,
      fourthPlaceH: 0,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1490
    },
    {
      nickname: 'Agus',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 1,
      avgPos: 1,
      first: 1,
      second: 0,
      third: 0,
      fourth: 0,
      firstPlaceH: 1,
      secondPlaceH: 0,
      thirdPlaceH: 0,
      fourthPlaceH: 0,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1490
    },
    {
      nickname: 'Mayra',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 25,
      avgPos: 3.36,
      first: 0,
      second: 3,
      third: 10,
      fourth: 12,
      firstPlaceH: 0,
      secondPlaceH: 3,
      thirdPlaceH: 9,
      fourthPlaceH: 11,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 1,
      fourthPlaceT: 1,
      points: 1490
    },
    {
      nickname: 'Angie',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 2,
      avgPos: 1.5,
      first: 1,
      second: 1,
      third: 0,
      fourth: 0,
      firstPlaceH: 1,
      secondPlaceH: 1,
      thirdPlaceH: 0,
      fourthPlaceH: 0,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1482
    },
    {
      nickname: 'Romo',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 23,
      avgPos: 4,
      first: 0,
      second: 0,
      third: 0,
      fourth: 23,
      firstPlaceH: 0,
      secondPlaceH: 0,
      thirdPlaceH: 0,
      fourthPlaceH: 20,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 3,
      points: 1479
    },
    {
      nickname: 'Naoko',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 58,
      avgPos: 3.59,
      first: 0,
      second: 3,
      third: 18,
      fourth: 37,
      firstPlaceH: 0,
      secondPlaceH: 3,
      thirdPlaceH: 17,
      fourthPlaceH: 33,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 1,
      fourthPlaceT: 4,
      points: 1475
    },
    {
      nickname: 'Ernesto',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 7,
      avgPos: 1.43,
      first: 5,
      second: 1,
      third: 1,
      fourth: 0,
      firstPlaceH: 5,
      secondPlaceH: 1,
      thirdPlaceH: 1,
      fourthPlaceH: 0,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1473
    },
    {
      nickname: 'Mauro',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 14,
      avgPos: 3.57,
      first: 0,
      second: 0,
      third: 6,
      fourth: 8,
      firstPlaceH: 0,
      secondPlaceH: 0,
      thirdPlaceH: 3,
      fourthPlaceH: 2,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 3,
      fourthPlaceT: 6,
      points: 1473
    },
    {
      nickname: 'Adrian',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 1,
      avgPos: 1,
      first: 1,
      second: 0,
      third: 0,
      fourth: 0,
      firstPlaceH: 1,
      secondPlaceH: 0,
      thirdPlaceH: 0,
      fourthPlaceH: 0,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1472
    },
    {
      nickname: 'Jorge',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 3,
      avgPos: 1.33,
      first: 2,
      second: 1,
      third: 0,
      fourth: 0,
      firstPlaceH: 2,
      secondPlaceH: 1,
      thirdPlaceH: 0,
      fourthPlaceH: 0,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1472
    },
    {
      nickname: 'Enio',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 4,
      avgPos: 1.5,
      first: 2,
      second: 2,
      third: 0,
      fourth: 0,
      firstPlaceH: 1,
      secondPlaceH: 1,
      thirdPlaceH: 0,
      fourthPlaceH: 0,
      firstPlaceT: 1,
      secondPlaceT: 1,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1471
    },
    {
      nickname: 'Fer',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 17,
      avgPos: 1.53,
      first: 10,
      second: 5,
      third: 2,
      fourth: 0,
      firstPlaceH: 4,
      secondPlaceH: 4,
      thirdPlaceH: 2,
      fourthPlaceH: 0,
      firstPlaceT: 6,
      secondPlaceT: 1,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1470
    },
    {
      nickname: 'Samanta',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 1,
      avgPos: 4,
      first: 0,
      second: 0,
      third: 0,
      fourth: 1,
      firstPlaceH: 0,
      secondPlaceH: 0,
      thirdPlaceH: 0,
      fourthPlaceH: 1,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1470
    },
    {
      nickname: 'Lui',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 6,
      avgPos: 2.33,
      first: 0,
      second: 4,
      third: 2,
      fourth: 0,
      firstPlaceH: 0,
      secondPlaceH: 3,
      thirdPlaceH: 0,
      fourthPlaceH: 0,
      firstPlaceT: 0,
      secondPlaceT: 1,
      thirdPlaceT: 2,
      fourthPlaceT: 0,
      points: 1464
    },
    {
      nickname: 'Quimei',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 4,
      avgPos: 3.75,
      first: 0,
      second: 0,
      third: 1,
      fourth: 3,
      firstPlaceH: 0,
      secondPlaceH: 0,
      thirdPlaceH: 1,
      fourthPlaceH: 3,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1463
    },
    {
      nickname: 'Juan',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 2,
      avgPos: 2,
      first: 1,
      second: 0,
      third: 1,
      fourth: 0,
      firstPlaceH: 1,
      secondPlaceH: 0,
      thirdPlaceH: 1,
      fourthPlaceH: 0,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1460
    },
    {
      nickname: 'Virginia',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 4,
      avgPos: 4,
      first: 0,
      second: 0,
      third: 0,
      fourth: 4,
      firstPlaceH: 0,
      secondPlaceH: 0,
      thirdPlaceH: 0,
      fourthPlaceH: 4,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1460
    },
    {
      nickname: 'Duro',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 6,
      avgPos: 1.67,
      first: 2,
      second: 4,
      third: 0,
      fourth: 0,
      firstPlaceH: 2,
      secondPlaceH: 4,
      thirdPlaceH: 0,
      fourthPlaceH: 0,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1448
    },
    {
      nickname: 'Bata',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 8,
      avgPos: 1,
      first: 8,
      second: 0,
      third: 0,
      fourth: 0,
      firstPlaceH: 5,
      secondPlaceH: 0,
      thirdPlaceH: 0,
      fourthPlaceH: 0,
      firstPlaceT: 3,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1446
    },
    {
      nickname: 'Roy',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 3,
      avgPos: 4,
      first: 0,
      second: 0,
      third: 0,
      fourth: 3,
      firstPlaceH: 0,
      secondPlaceH: 0,
      thirdPlaceH: 0,
      fourthPlaceH: 3,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1431
    },
    {
      nickname: 'Akito',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 14,
      avgPos: 1.07,
      first: 13,
      second: 1,
      third: 0,
      fourth: 0,
      firstPlaceH: 13,
      secondPlaceH: 1,
      thirdPlaceH: 0,
      fourthPlaceH: 0,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1425
    },
    {
      nickname: 'Kime',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 5,
      avgPos: 2,
      first: 0,
      second: 5,
      third: 0,
      fourth: 0,
      firstPlaceH: 0,
      secondPlaceH: 5,
      thirdPlaceH: 0,
      fourthPlaceH: 0,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1423
    },
    {
      nickname: 'Octavio',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 5,
      avgPos: 3.2,
      first: 0,
      second: 1,
      third: 2,
      fourth: 2,
      firstPlaceH: 0,
      secondPlaceH: 1,
      thirdPlaceH: 2,
      fourthPlaceH: 2,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1419
    },
    {
      nickname: 'Ezequiel',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 34,
      avgPos: 1.68,
      first: 14,
      second: 17,
      third: 3,
      fourth: 0,
      firstPlaceH: 11,
      secondPlaceH: 12,
      thirdPlaceH: 3,
      fourthPlaceH: 0,
      firstPlaceT: 3,
      secondPlaceT: 5,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1419
    },
    {
      nickname: 'Juli F',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 8,
      avgPos: 1.25,
      first: 6,
      second: 2,
      third: 0,
      fourth: 0,
      firstPlaceH: 3,
      secondPlaceH: 2,
      thirdPlaceH: 0,
      fourthPlaceH: 0,
      firstPlaceT: 3,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1416
    },
    {
      nickname: 'Carlos',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 10,
      avgPos: 1.1,
      first: 9,
      second: 1,
      third: 0,
      fourth: 0,
      firstPlaceH: 9,
      secondPlaceH: 1,
      thirdPlaceH: 0,
      fourthPlaceH: 0,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1415
    },
    {
      nickname: 'Luli',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 16,
      avgPos: 3.38,
      first: 0,
      second: 3,
      third: 4,
      fourth: 9,
      firstPlaceH: 0,
      secondPlaceH: 0,
      thirdPlaceH: 3,
      fourthPlaceH: 4,
      firstPlaceT: 0,
      secondPlaceT: 3,
      thirdPlaceT: 1,
      fourthPlaceT: 5,
      points: 1375
    },
    {
      nickname: 'Adriel',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 13,
      avgPos: 1,
      first: 13,
      second: 0,
      third: 0,
      fourth: 0,
      firstPlaceH: 13,
      secondPlaceH: 0,
      thirdPlaceH: 0,
      fourthPlaceH: 0,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1355
    },
    {
      nickname: 'Ini',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 23,
      avgPos: 2.04,
      first: 3,
      second: 16,
      third: 4,
      fourth: 0,
      firstPlaceH: 2,
      secondPlaceH: 13,
      thirdPlaceH: 3,
      fourthPlaceH: 0,
      firstPlaceT: 1,
      secondPlaceT: 3,
      thirdPlaceT: 1,
      fourthPlaceT: 0,
      points: 1349
    },
    {
      nickname: 'Lucio',
      seasonId: await getSeasonIdByName('Temporada 1'),
      games: 32,
      avgPos: 2.94,
      first: 0,
      second: 8,
      third: 18,
      fourth: 6,
      firstPlaceH: 0,
      secondPlaceH: 6,
      thirdPlaceH: 13,
      fourthPlaceH: 4,
      firstPlaceT: 0,
      secondPlaceT: 2,
      thirdPlaceT: 5,
      fourthPlaceT: 2,
      points: 1261
    }
  ];

  // Total de jugadores: 63


  for (const row of season1Top) {
    const player = await findPlayerByNickname(row.nickname);
    if (!player) {
      seedFail(`⚠️ Player not found for SeasonResult seed: ${row.nickname}`);
      continue;
    }
    await (prisma as any).seasonResult.upsert({
      where: { seasonId_playerId_isSanma: { seasonId: row.seasonId, playerId: (player as any).id, isSanma: false } },
      update: {
        seasonTotalGames: row.games,
        seasonAveragePosition: row.avgPos,
        seasonFirstPlaceH: row.first,
        seasonSecondPlaceH: row.second,
        seasonThirdPlaceH: row.third,
        seasonFourthPlaceH: row.fourth,
        seasonFirstPlaceT: 0,
        seasonSecondPlaceT: 0,
        seasonThirdPlaceT: 0,
        seasonFourthPlaceT: 0,
        seasonPoints: row.points,
      },
      create: {
        seasonId: row.seasonId,
        playerId: (player as any).id,
        isSanma: false,
        seasonTotalGames: row.games,
        seasonAveragePosition: row.avgPos,
        seasonFirstPlaceH: row.first,
        seasonSecondPlaceH: row.second,
        seasonThirdPlaceH: row.third,
        seasonFourthPlaceH: row.fourth,
        seasonFirstPlaceT: 0,
        seasonSecondPlaceT: 0,
        seasonThirdPlaceT: 0,
        seasonFourthPlaceT: 0,
        seasonPoints: row.points,
      }
    });
  }
  console.log('✅ SeasonResult Top 3 for Season 1 seeded');

  // Seed SeasonResult Top 10 for season 2 (legacy, no Tonpu breakdown)
  console.log('🏅 Seeding SeasonResult Top 10 for Season 2...');
  const season2Top = [
    {
      nickname: 'Nico',
      seasonId: await getSeasonIdByName('Temporada 2'),
      games: 159,
      avgPos: 2.05,
      first: 59,
      second: 48,
      third: 37,
      fourth: 15,
      firstPlaceH: 32,
      secondPlaceH: 37,
      thirdPlaceH: 26,
      fourthPlaceH: 15,
      firstPlaceT: 27,
      secondPlaceT: 11,
      thirdPlaceT: 11,
      fourthPlaceT: 0,
      points: 3400
    },
    {
      nickname: 'Lucas',
      seasonId: await getSeasonIdByName('Temporada 2'),
      games: 65,
      avgPos: 2.14,
      first: 25,
      second: 18,
      third: 10,
      fourth: 12,
      firstPlaceH: 22,
      secondPlaceH: 17,
      thirdPlaceH: 7,
      fourthPlaceH: 9,
      firstPlaceT: 3,
      secondPlaceT: 1,
      thirdPlaceT: 3,
      fourthPlaceT: 3,
      points: 3385
    },
    {
      nickname: 'Figo/Iori',
      seasonId: await getSeasonIdByName('Temporada 2'),
      games: 0,
      avgPos: 0,
      first: 0,
      second: 0,
      third: 0,
      fourth: 0,
      firstPlaceH: 0,
      secondPlaceH: 0,
      thirdPlaceH: 0,
      fourthPlaceH: 0,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 3340
    },
    {
      nickname: 'Adrian',
      seasonId: await getSeasonIdByName('Temporada 2'),
      games: 46,
      avgPos: 2.41,
      first: 14,
      second: 10,
      third: 11,
      fourth: 11,
      firstPlaceH: 14,
      secondPlaceH: 10,
      thirdPlaceH: 11,
      fourthPlaceH: 11,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 2615
    },
    {
      nickname: 'Michael',
      seasonId: await getSeasonIdByName('Temporada 2'),
      games: 39,
      avgPos: 2.49,
      first: 9,
      second: 10,
      third: 12,
      fourth: 8,
      firstPlaceH: 6,
      secondPlaceH: 9,
      thirdPlaceH: 10,
      fourthPlaceH: 8,
      firstPlaceT: 3,
      secondPlaceT: 1,
      thirdPlaceT: 2,
      fourthPlaceT: 0,
      points: 2400
    },
    {
      nickname: 'Lucio',
      seasonId: await getSeasonIdByName('Temporada 2'),
      games: 56,
      avgPos: 2.34,
      first: 19,
      second: 14,
      third: 8,
      fourth: 15,
      firstPlaceH: 11,
      secondPlaceH: 9,
      thirdPlaceH: 4,
      fourthPlaceH: 14,
      firstPlaceT: 8,
      secondPlaceT: 5,
      thirdPlaceT: 4,
      fourthPlaceT: 1,
      points: 2312.5
    },
    {
      nickname: 'Koki',
      seasonId: await getSeasonIdByName('Temporada 2'),
      games: 110,
      avgPos: 2.22,
      first: 20,
      second: 75,
      third: 50,
      fourth: 100,
      firstPlaceH: 29,
      secondPlaceH: 31,
      thirdPlaceH: 19,
      fourthPlaceH: 15,
      firstPlaceT: 3,
      secondPlaceT: 6,
      thirdPlaceT: 7,
      fourthPlaceT: 3,
      points: 2220
    },
    {
      nickname: 'Naoko',
      seasonId: await getSeasonIdByName('Temporada 2'),
      games: 93,
      avgPos: 2.46,
      first: 27,
      second: 20,
      third: 22,
      fourth: 24,
      firstPlaceH: 23,
      secondPlaceH: 15,
      thirdPlaceH: 20,
      fourthPlaceH: 20,
      firstPlaceT: 4,
      secondPlaceT: 5,
      thirdPlaceT: 2,
      fourthPlaceT: 4,
      points: 1980
    },
    {
      nickname: 'Pedro',
      seasonId: await getSeasonIdByName('Temporada 2'),
      games: 23,
      avgPos: 2.26,
      first: 8,
      second: 7,
      third: 2,
      fourth: 6,
      firstPlaceH: 6,
      secondPlaceH: 7,
      thirdPlaceH: 2,
      fourthPlaceH: 3,
      firstPlaceT: 2,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 3,
      points: 1895
    },
    {
      nickname: 'Mauro',
      seasonId: await getSeasonIdByName('Temporada 2'),
      games: 48,
      avgPos: 2.33,
      first: 12,
      second: 16,
      third: 12,
      fourth: 8,
      firstPlaceH: 7,
      secondPlaceH: 14,
      thirdPlaceH: 12,
      fourthPlaceH: 7,
      firstPlaceT: 5,
      secondPlaceT: 2,
      thirdPlaceT: 0,
      fourthPlaceT: 1,
      points: 1770
    },
    {
      nickname: 'Dario',
      seasonId: await getSeasonIdByName('Temporada 2'),
      games: 10,
      avgPos: 2.6,
      first: 2,
      second: 2,
      third: 4,
      fourth: 2,
      firstPlaceH: 2,
      secondPlaceH: 2,
      thirdPlaceH: 4,
      fourthPlaceH: 2,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1735
    },
    {
      nickname: 'Fer',
      seasonId: await getSeasonIdByName('Temporada 2'),
      games: 9,
      avgPos: 2.44,
      first: 2,
      second: 3,
      third: 2,
      fourth: 2,
      firstPlaceH: 2,
      secondPlaceH: 1,
      thirdPlaceH: 0,
      fourthPlaceH: 2,
      firstPlaceT: 0,
      secondPlaceT: 2,
      thirdPlaceT: 2,
      fourthPlaceT: 0,
      points: 1650
    },
    {
      nickname: 'Pato',
      seasonId: await getSeasonIdByName('Temporada 2'),
      games: 28,
      avgPos: 2.46,
      first: 7,
      second: 8,
      third: 6,
      fourth: 7,
      firstPlaceH: 4,
      secondPlaceH: 8,
      thirdPlaceH: 4,
      fourthPlaceH: 7,
      firstPlaceT: 3,
      secondPlaceT: 0,
      thirdPlaceT: 2,
      fourthPlaceT: 0,
      points: 1385
    },
    {
      nickname: 'JC',
      seasonId: await getSeasonIdByName('Temporada 2'),
      games: 0,
      avgPos: 0,
      first: 0,
      second: 0,
      third: 0,
      fourth: 0,
      firstPlaceH: 0,
      secondPlaceH: 0,
      thirdPlaceH: 0,
      fourthPlaceH: 0,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1270
    },
    {
      nickname: 'Duro',
      seasonId: await getSeasonIdByName('Temporada 2'),
      games: 6,
      avgPos: 2.5,
      first: 1,
      second: 2,
      third: 2,
      fourth: 1,
      firstPlaceH: 1,
      secondPlaceH: 2,
      thirdPlaceH: 2,
      fourthPlaceH: 1,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1240
    },
    {
      nickname: 'Romo',
      seasonId: await getSeasonIdByName('Temporada 2'),
      games: 25,
      avgPos: 2.48,
      first: 5,
      second: 8,
      third: 7,
      fourth: 5,
      firstPlaceH: 5,
      secondPlaceH: 8,
      thirdPlaceH: 7,
      fourthPlaceH: 5,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 1170
    },
    {
      nickname: 'Jess',
      seasonId: await getSeasonIdByName('Temporada 2'),
      games: 37,
      avgPos: 2.57,
      first: 7,
      second: 10,
      third: 12,
      fourth: 8,
      firstPlaceH: 5,
      secondPlaceH: 9,
      thirdPlaceH: 6,
      fourthPlaceH: 6,
      firstPlaceT: 2,
      secondPlaceT: 1,
      thirdPlaceT: 6,
      fourthPlaceT: 2,
      points: 1100
    },
    {
      nickname: 'Luli',
      seasonId: await getSeasonIdByName('Temporada 2'),
      games: 17,
      avgPos: 2.65,
      first: 3,
      second: 4,
      third: 6,
      fourth: 4,
      firstPlaceH: 3,
      secondPlaceH: 1,
      thirdPlaceH: 6,
      fourthPlaceH: 3,
      firstPlaceT: 0,
      secondPlaceT: 3,
      thirdPlaceT: 0,
      fourthPlaceT: 1,
      points: 1050
    },
    {
      nickname: 'Mati',
      seasonId: await getSeasonIdByName('Temporada 2'),
      games: 63,
      avgPos: 2.56,
      first: 14,
      second: 16,
      third: 17,
      fourth: 16,
      firstPlaceH: 9,
      secondPlaceH: 10,
      thirdPlaceH: 14,
      fourthPlaceH: 14,
      firstPlaceT: 5,
      secondPlaceT: 6,
      thirdPlaceT: 3,
      fourthPlaceT: 2,
      points: 870
    },
    {
      nickname: 'Alejandro',
      seasonId: await getSeasonIdByName('Temporada 2'),
      games: 0,
      avgPos: 0,
      first: 0,
      second: 0,
      third: 0,
      fourth: 0,
      firstPlaceH: 0,
      secondPlaceH: 0,
      thirdPlaceH: 0,
      fourthPlaceH: 0,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 680
    },
    {
      nickname: 'Haku/Kozi',
      seasonId: await getSeasonIdByName('Temporada 2'),
      games: 4,
      avgPos: 2.75,
      first: 0,
      second: 1,
      third: 3,
      fourth: 0,
      firstPlaceH: 0,
      secondPlaceH: 1,
      thirdPlaceH: 2,
      fourthPlaceH: 0,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 1,
      fourthPlaceT: 0,
      points: 680
    },
    {
      nickname: 'Lucas Albor',
      seasonId: await getSeasonIdByName('Temporada 2'),
      games: 0,
      avgPos: 0,
      first: 0,
      second: 0,
      third: 0,
      fourth: 0,
      firstPlaceH: 0,
      secondPlaceH: 0,
      thirdPlaceH: 0,
      fourthPlaceH: 0,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 640
    },
    {
      nickname: 'Ini',
      seasonId: await getSeasonIdByName('Temporada 2'),
      games: 15,
      avgPos: 3.2,
      first: 1,
      second: 2,
      third: 5,
      fourth: 7,
      firstPlaceH: 1,
      secondPlaceH: 2,
      thirdPlaceH: 5,
      fourthPlaceH: 7,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 600
    },
    {
      nickname: 'Chiwi',
      seasonId: await getSeasonIdByName('Temporada 2'),
      games: 43,
      avgPos: 2.67,
      first: 7,
      second: 12,
      third: 12,
      fourth: 12,
      firstPlaceH: 5,
      secondPlaceH: 8,
      thirdPlaceH: 10,
      fourthPlaceH: 8,
      firstPlaceT: 2,
      secondPlaceT: 4,
      thirdPlaceT: 2,
      fourthPlaceT: 4,
      points: 520
    },
    {
      nickname: 'Enio',
      seasonId: await getSeasonIdByName('Temporada 2'),
      games: 0,
      avgPos: 0,
      first: 0,
      second: 0,
      third: 0,
      fourth: 0,
      firstPlaceH: 0,
      secondPlaceH: 0,
      thirdPlaceH: 0,
      fourthPlaceH: 0,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 520
    },
    {
      nickname: 'Akito',
      seasonId: await getSeasonIdByName('Temporada 2'),
      games: 0,
      avgPos: 0,
      first: 0,
      second: 0,
      third: 0,
      fourth: 0,
      firstPlaceH: 0,
      secondPlaceH: 0,
      thirdPlaceH: 0,
      fourthPlaceH: 0,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 430
    },
    {
      nickname: 'Adriel',
      seasonId: await getSeasonIdByName('Temporada 2'),
      games: 0,
      avgPos: 0,
      first: 0,
      second: 0,
      third: 0,
      fourth: 0,
      firstPlaceH: 0,
      secondPlaceH: 0,
      thirdPlaceH: 0,
      fourthPlaceH: 0,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 340
    },
    {
      nickname: 'Juli F',
      seasonId: await getSeasonIdByName('Temporada 2'),
      games: 1,
      avgPos: 2,
      first: 0,
      second: 1,
      third: 0,
      fourth: 0,
      firstPlaceH: 0,
      secondPlaceH: 1,
      thirdPlaceH: 0,
      fourthPlaceH: 0,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 340
    },
    {
      nickname: 'Kime',
      seasonId: await getSeasonIdByName('Temporada 2'),
      games: 4,
      avgPos: 2.25,
      first: 2,
      second: 0,
      third: 1,
      fourth: 1,
      firstPlaceH: 2,
      secondPlaceH: 0,
      thirdPlaceH: 1,
      fourthPlaceH: 1,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 300
    },
    {
      nickname: 'Max D.',
      seasonId: await getSeasonIdByName('Temporada 2'),
      games: 3,
      avgPos: 2,
      first: 1,
      second: 1,
      third: 1,
      fourth: 0,
      firstPlaceH: 1,
      secondPlaceH: 1,
      thirdPlaceH: 1,
      fourthPlaceH: 0,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 250
    },
    {
      nickname: 'Azul',
      seasonId: await getSeasonIdByName('Temporada 2'),
      games: 0,
      avgPos: 0,
      first: 0,
      second: 0,
      third: 0,
      fourth: 0,
      firstPlaceH: 0,
      secondPlaceH: 0,
      thirdPlaceH: 0,
      fourthPlaceH: 0,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 240
    },
    {
      nickname: 'Wapuro',
      seasonId: await getSeasonIdByName('Temporada 2'),
      games: 0,
      avgPos: 0,
      first: 0,
      second: 0,
      third: 0,
      fourth: 0,
      firstPlaceH: 0,
      secondPlaceH: 0,
      thirdPlaceH: 0,
      fourthPlaceH: 0,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 210
    },
    {
      nickname: 'Tamara',
      seasonId: await getSeasonIdByName('Temporada 2'),
      games: 0,
      avgPos: 0,
      first: 0,
      second: 0,
      third: 0,
      fourth: 0,
      firstPlaceH: 0,
      secondPlaceH: 0,
      thirdPlaceH: 0,
      fourthPlaceH: 0,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 190
    },
    {
      nickname: 'Guile',
      seasonId: await getSeasonIdByName('Temporada 2'),
      games: 85,
      avgPos: 2.39,
      first: 22,
      second: 28,
      third: 15,
      fourth: 20,
      firstPlaceH: 15,
      secondPlaceH: 20,
      thirdPlaceH: 10,
      fourthPlaceH: 15,
      firstPlaceT: 7,
      secondPlaceT: 8,
      thirdPlaceT: 5,
      fourthPlaceT: 5,
      points: 150
    },
    {
      nickname: 'Pablo (2de6)',
      seasonId: await getSeasonIdByName('Temporada 2'),
      games: 0,
      avgPos: 0,
      first: 0,
      second: 0,
      third: 0,
      fourth: 0,
      firstPlaceH: 0,
      secondPlaceH: 0,
      thirdPlaceH: 0,
      fourthPlaceH: 0,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 130
    },
    {
      nickname: 'Mayra',
      seasonId: await getSeasonIdByName('Temporada 2'),
      games: 0,
      avgPos: 0,
      first: 0,
      second: 0,
      third: 0,
      fourth: 0,
      firstPlaceH: 0,
      secondPlaceH: 0,
      thirdPlaceH: 0,
      fourthPlaceH: 0,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 120
    },
    {
      nickname: 'Davy',
      seasonId: await getSeasonIdByName('Temporada 2'),
      games: 11,
      avgPos: 2.45,
      first: 4,
      second: 1,
      third: 3,
      fourth: 3,
      firstPlaceH: 2,
      secondPlaceH: 1,
      thirdPlaceH: 2,
      fourthPlaceH: 2,
      firstPlaceT: 2,
      secondPlaceT: 0,
      thirdPlaceT: 1,
      fourthPlaceT: 1,
      points: 60
    },
    {
      nickname: 'Jhony',
      seasonId: await getSeasonIdByName('Temporada 2'),
      games: 0,
      avgPos: 0,
      first: 0,
      second: 0,
      third: 0,
      fourth: 0,
      firstPlaceH: 0,
      secondPlaceH: 0,
      thirdPlaceH: 0,
      fourthPlaceH: 0,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 40
    },
    {
      nickname: 'Angel',
      seasonId: await getSeasonIdByName('Temporada 2'),
      games: 0,
      avgPos: 0,
      first: 0,
      second: 0,
      third: 0,
      fourth: 0,
      firstPlaceH: 0,
      secondPlaceH: 0,
      thirdPlaceH: 0,
      fourthPlaceH: 0,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 20
    },
    {
      nickname: 'Ernesto',
      seasonId: await getSeasonIdByName('Temporada 2'),
      games: 0,
      avgPos: 0,
      first: 0,
      second: 0,
      third: 0,
      fourth: 0,
      firstPlaceH: 0,
      secondPlaceH: 0,
      thirdPlaceH: 0,
      fourthPlaceH: 0,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 20
    },
    {
      nickname: 'Nadia',
      seasonId: await getSeasonIdByName('Temporada 2'),
      games: 0,
      avgPos: 0,
      first: 0,
      second: 0,
      third: 0,
      fourth: 0,
      firstPlaceH: 0,
      secondPlaceH: 0,
      thirdPlaceH: 0,
      fourthPlaceH: 0,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 20
    },
    {
      nickname: 'Diego (old)',
      seasonId: await getSeasonIdByName('Temporada 2'),
      games: 0,
      avgPos: 0,
      first: 0,
      second: 0,
      third: 0,
      fourth: 0,
      firstPlaceH: 0,
      secondPlaceH: 0,
      thirdPlaceH: 0,
      fourthPlaceH: 0,
      firstPlaceT: 0,
      secondPlaceT: 0,
      thirdPlaceT: 0,
      fourthPlaceT: 0,
      points: 0
    }
  ];

  for (const row of season2Top) {
    const player = await findPlayerByNickname(row.nickname);
    if (!player) {
      seedFail(`⚠️ Player not found for SeasonResult seed: ${row.nickname}`);
      continue;
    }
    await (prisma as any).seasonResult.upsert({
      where: { seasonId_playerId_isSanma: { seasonId: row.seasonId, playerId: (player as any).id, isSanma: false } },
      update: {
        seasonTotalGames: row.games,
        seasonAveragePosition: row.avgPos,
        seasonFirstPlaceH: row.first,
        seasonSecondPlaceH: row.second,
        seasonThirdPlaceH: row.third,
        seasonFourthPlaceH: row.fourth,
        seasonFirstPlaceT: 0,
        seasonSecondPlaceT: 0,
        seasonThirdPlaceT: 0,
        seasonFourthPlaceT: 0,
        seasonPoints: row.points,
      },
      create: {
        seasonId: row.seasonId,
        playerId: (player as any).id,
        isSanma: false,
        seasonTotalGames: row.games,
        seasonAveragePosition: row.avgPos,
        seasonFirstPlaceH: row.first,
        seasonSecondPlaceH: row.second,
        seasonThirdPlaceH: row.third,
        seasonFourthPlaceH: row.fourth,
        seasonFirstPlaceT: 0,
        seasonSecondPlaceT: 0,
        seasonThirdPlaceT: 0,
        seasonFourthPlaceT: 0,
        seasonPoints: row.points,
      }
    });
  }
  console.log('✅ SeasonResult Top 10 for Season 2 seeded');

  // Seed SeasonResult Top 25 for Season 3 (sistema +15/+5/-5/-15)
  console.log('🏅 Seeding SeasonResult Top 25 for Season 3...');
  const season3Top = [
    { nickname: 'Mati', points: 625 },
    { nickname: 'Amauri (BR)', points: 555 },
    { nickname: 'Lucas', points: 375 },
    { nickname: 'Fran', points: 345 },
    { nickname: 'Guile', points: 245 },
    { nickname: 'Mauro', points: 235 },
    { nickname: 'Adrian', points: 215 },
    { nickname: 'Pato', points: 175 },
    { nickname: 'Michael', points: 165 },
    { nickname: 'Ini', points: 155 },
    { nickname: 'Lucio', points: 125 },
    { nickname: 'Facu (UY)', points: 115 },
    { nickname: 'Arthur (BR)', points: 75 },
    { nickname: 'Chiwi', points: 55 },
    { nickname: 'Lautaro (LP) DiG.', points: 45 },
    { nickname: 'Jess', points: 35 },
    { nickname: 'Haku/Kozi', points: 30 },
    { nickname: 'Marcelo', points: 5 },
    { nickname: 'Fer', points: -5 },
    { nickname: 'Felipe (CL)', points: -5 },
    { nickname: 'Romo', points: -15 },
    { nickname: 'Luli', points: -15 },
    { nickname: 'Nico', points: -25 },
    { nickname: 'Adriel', points: -35 },
    { nickname: 'Mati G. (minimati)', points: -55 },
  ];
  const notFoundseason3: string[] = [];
  for (const row of season3Top) {
    const player = await findPlayerByNickname(row.nickname);
    if (!player) {
      notFoundseason3.push(row.nickname);
      continue;
    }
    await (prisma as any).seasonResult.upsert({
      where: { seasonId_playerId_isSanma: { seasonId: await getSeasonIdByName('Temporada 3'), playerId: (player as any).id, isSanma: false } },
      update: {
        seasonPoints: row.points,
      },
      create: {
        seasonId: await getSeasonIdByName('Temporada 3'),
        playerId: (player as any).id,
        isSanma: false,
        seasonPoints: row.points,
      }
    });
  }
  if (notFoundseason3.length > 0) {
    console.log('⚠️ season 3 - players not found (no se crean):', notFoundseason3.join(', '));
  }
  console.log('✅ SeasonResult Top 10 for Season 3 seeded');

  // Seed SeasonResult for season 4 (con breakdown Tonpu/Hanchan) - DATOS COMPLETOS
  console.log('🏅 Seeding SeasonResult for Season 4...');
  const season4Top11 = [
    { nickname: "Koki", games: 110, avgPosition: 2.22, seasonPoints: 2007, firstH: 29, secondH: 31, thirdH: 19, fourthH: 12, firstT: 3, secondT: 6, thirdT: 7, fourthT: 3 },
    { nickname: "Lucas", games: 65, avgPosition: 2.14, seasonPoints: 1634, firstH: 22, secondH: 17, thirdH: 7, fourthH: 9, firstT: 3, secondT: 1, thirdT: 3, fourthT: 3 },
    { nickname: "Nico", games: 72, avgPosition: 2.31, seasonPoints: 1535, firstH: 17, secondH: 16, thirdH: 17, fourthH: 8, firstT: 5, secondT: 1, thirdT: 5, fourthT: 3 },
    { nickname: "Lucio", games: 56, avgPosition: 2.34, seasonPoints: 860, firstH: 11, secondH: 9, thirdH: 4, fourthH: 14, firstT: 8, secondT: 5, thirdT: 4, fourthT: 1 },
    { nickname: "Guile", games: 85, avgPosition: 2.39, seasonPoints: 746, firstH: 15, secondH: 20, thirdH: 10, fourthH: 15, firstT: 7, secondT: 8, thirdT: 5, fourthT: 5 },
    { nickname: "Naoko", games: 93, avgPosition: 2.46, seasonPoints: 629, firstH: 23, secondH: 15, thirdH: 20, fourthH: 20, firstT: 4, secondT: 5, thirdT: 2, fourthT: 4 },
    { nickname: "Fran", games: 29, avgPosition: 2.48, seasonPoints: 576, firstH: 4, secondH: 5, thirdH: 4, fourthH: 5, firstT: 2, secondT: 4, thirdT: 4, fourthT: 1 },
    { nickname: "Mauro", games: 48, avgPosition: 2.33, seasonPoints: 575, firstH: 7, secondH: 14, thirdH: 12, fourthH: 7, firstT: 5, secondT: 2, thirdT: 0, fourthT: 1 },
    { nickname: "Felipe (CL)", games: 12, avgPosition: 2.42, seasonPoints: 515, firstH: 4, secondH: 1, thirdH: 5, fourthH: 2, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Javilo", games: 46, avgPosition: 2.30, seasonPoints: 514, firstH: 9, secondH: 8, thirdH: 13, fourthH: 3, firstT: 5, secondT: 2, thirdT: 3, fourthT: 3 },
    { nickname: "Guido", games: 8, avgPosition: 2.13, seasonPoints: 420, firstH: 3, secondH: 2, thirdH: 2, fourthH: 1, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Facu (UY)", games: 23, avgPosition: 2.26, seasonPoints: 419, firstH: 6, secondH: 7, thirdH: 2, fourthH: 3, firstT: 2, secondT: 0, thirdT: 0, fourthT: 3 },
    { nickname: "Cecilia", games: 18, avgPosition: 2.11, seasonPoints: 400, firstH: 6, secondH: 6, thirdH: 4, fourthH: 2, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Mati", games: 63, avgPosition: 2.56, seasonPoints: 377, firstH: 9, secondH: 10, thirdH: 14, fourthH: 16, firstT: 5, secondT: 6, thirdT: 3, fourthT: 2 },
    { nickname: "Osqui", games: 44, avgPosition: 2.34, seasonPoints: 316, firstH: 11, secondH: 12, thirdH: 12, fourthH: 5, firstT: 0, secondT: 1, thirdT: 2, fourthT: 1 },
    { nickname: "Gilberto K.", games: 8, avgPosition: 2.25, seasonPoints: 290, firstH: 2, secondH: 3, thirdH: 2, fourthH: 1, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Ailen", games: 19, avgPosition: 2.26, seasonPoints: 240, firstH: 5, secondH: 6, thirdH: 3, fourthH: 3, firstT: 0, secondT: 1, thirdT: 1, fourthT: 0 },
    { nickname: "German", games: 28, avgPosition: 2.54, seasonPoints: 238, firstH: 5, secondH: 4, thirdH: 9, fourthH: 4, firstT: 1, secondT: 3, thirdT: 0, fourthT: 2 },
    { nickname: "Pato", games: 28, avgPosition: 2.46, seasonPoints: 227, firstH: 4, secondH: 8, thirdH: 4, fourthH: 7, firstT: 3, secondT: 0, thirdT: 2, fourthT: 0 },
    { nickname: "Mati S.", games: 41, avgPosition: 2.41, seasonPoints: 214, firstH: 9, secondH: 9, thirdH: 6, fourthH: 7, firstT: 3, secondT: 1, thirdT: 3, fourthT: 3 },
    { nickname: "Romo", games: 25, avgPosition: 2.48, seasonPoints: 180, firstH: 5, secondH: 8, thirdH: 7, fourthH: 5, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Adrian", games: 46, avgPosition: 2.41, seasonPoints: 150, firstH: 14, secondH: 10, thirdH: 11, fourthH: 11, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Pablo G.", games: 14, avgPosition: 2.36, seasonPoints: 110, firstH: 3, secondH: 2, thirdH: 1, fourthH: 4, firstT: 1, secondT: 3, thirdT: 0, fourthT: 0 },
    { nickname: "Mikami", games: 6, avgPosition: 2.17, seasonPoints: 104, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 2, secondT: 2, thirdT: 1, fourthT: 1 },
    { nickname: "Kime", games: 4, avgPosition: 2.25, seasonPoints: 100, firstH: 2, secondH: 0, thirdH: 1, fourthH: 1, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Oli", games: 2, avgPosition: 1.50, seasonPoints: 90, firstH: 1, secondH: 1, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Andres", games: 32, avgPosition: 2.72, seasonPoints: 61, firstH: 6, secondH: 6, thirdH: 7, fourthH: 9, firstT: 0, secondT: 1, thirdT: 2, fourthT: 1 },
    { nickname: "Max D.", games: 3, avgPosition: 2.00, seasonPoints: 60, firstH: 1, secondH: 1, thirdH: 1, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Arthur M (MX)", games: 6, avgPosition: 2.67, seasonPoints: 50, firstH: 2, secondH: 1, thirdH: 0, fourthH: 3, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Alex", games: 2, avgPosition: 2.00, seasonPoints: 30, firstH: 1, secondH: 0, thirdH: 1, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Fer", games: 9, avgPosition: 2.44, seasonPoints: 30, firstH: 2, secondH: 1, thirdH: 0, fourthH: 2, firstT: 0, secondT: 2, thirdT: 2, fourthT: 0 },
    { nickname: "Juli F", games: 1, avgPosition: 2.00, seasonPoints: 30, firstH: 0, secondH: 1, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Marian", games: 12, avgPosition: 2.42, seasonPoints: 30, firstH: 4, secondH: 2, thirdH: 3, fourthH: 3, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Jess", games: 37, avgPosition: 2.57, seasonPoints: 30, firstH: 5, secondH: 9, thirdH: 6, fourthH: 6, firstT: 2, secondT: 1, thirdT: 6, fourthT: 2 },
    { nickname: "Michael", games: 39, avgPosition: 2.49, seasonPoints: 15, firstH: 6, secondH: 9, thirdH: 10, fourthH: 8, firstT: 3, secondT: 1, thirdT: 2, fourthT: 0 },
    { nickname: "Agus I", games: 14, avgPosition: 2.57, seasonPoints: 14, firstH: 1, secondH: 3, thirdH: 0, fourthH: 4, firstT: 3, secondT: 1, thirdT: 0, fourthT: 2 },
    { nickname: "Marce", games: 30, avgPosition: 2.67, seasonPoints: 14, firstH: 5, secondH: 9, thirdH: 6, fourthH: 6, firstT: 0, secondT: 0, thirdT: 1, fourthT: 3 },
    { nickname: "Davy", games: 11, avgPosition: 2.45, seasonPoints: 13, firstH: 2, secondH: 1, thirdH: 2, fourthH: 2, firstT: 2, secondT: 0, thirdT: 1, fourthT: 1 },
    { nickname: "Pancho", games: 10, avgPosition: 3.00, seasonPoints: 2, firstH: 0, secondH: 0, thirdH: 0, fourthH: 1, firstT: 2, secondT: 2, thirdT: 0, fourthT: 6 },
    { nickname: "Duro", games: 6, avgPosition: 2.50, seasonPoints: 0, firstH: 1, secondH: 2, thirdH: 2, fourthH: 1, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Jonathan", games: 9, avgPosition: 2.78, seasonPoints: -12, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 1, secondT: 2, thirdT: 4, fourthT: 2 },
    { nickname: "Emma", games: 1, avgPosition: 3.00, seasonPoints: -30, firstH: 0, secondH: 0, thirdH: 1, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Diego C.", games: 4, avgPosition: 2.75, seasonPoints: -30, firstH: 1, secondH: 0, thirdH: 2, fourthH: 1, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Luli", games: 17, avgPosition: 2.65, seasonPoints: -37, firstH: 3, secondH: 1, thirdH: 6, fourthH: 3, firstT: 0, secondT: 3, thirdT: 0, fourthT: 1 },
    { nickname: "Kress", games: 6, avgPosition: 3.00, seasonPoints: -40, firstH: 1, secondH: 1, thirdH: 1, fourthH: 3, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Dario", games: 10, avgPosition: 2.60, seasonPoints: -40, firstH: 2, secondH: 2, thirdH: 4, fourthH: 2, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Kozi/Haku", games: 4, avgPosition: 2.75, seasonPoints: -48, firstH: 0, secondH: 0, thirdH: 1, fourthH: 0, firstT: 0, secondT: 1, thirdT: 2, fourthT: 0 },
    { nickname: "Maria C.", games: 23, avgPosition: 2.70, seasonPoints: -60, firstH: 5, secondH: 4, thirdH: 7, fourthH: 7, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Eze", games: 35, avgPosition: 2.51, seasonPoints: -60, firstH: 11, secondH: 5, thirdH: 9, fourthH: 10, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Francisco", games: 4, avgPosition: 3.00, seasonPoints: -60, firstH: 0, secondH: 0, thirdH: 0, fourthH: 1, firstT: 0, secondT: 2, thirdT: 0, fourthT: 1 },
    { nickname: "Martin O.", games: 4, avgPosition: 3.25, seasonPoints: -62, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 1, secondT: 0, thirdT: 0, fourthT: 3 },
    { nickname: "Manuel P.", games: 4, avgPosition: 3.00, seasonPoints: -80, firstH: 0, secondH: 1, thirdH: 2, fourthH: 1, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Nicolas M.", games: 6, avgPosition: 3.17, seasonPoints: -100, firstH: 1, secondH: 0, thirdH: 2, fourthH: 3, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Nyamikki (DISCORD)", games: 4, avgPosition: 3.25, seasonPoints: -110, firstH: 1, secondH: 0, thirdH: 0, fourthH: 3, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Lautaro (LP) DiG.", games: 4, avgPosition: 3.50, seasonPoints: -114, firstH: 0, secondH: 0, thirdH: 0, fourthH: 1, firstT: 0, secondT: 1, thirdT: 0, fourthT: 2 },
    { nickname: "Falconer", games: 9, avgPosition: 2.78, seasonPoints: -120, firstH: 2, secondH: 1, thirdH: 3, fourthH: 3, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Kelo", games: 9, avgPosition: 2.78, seasonPoints: -120, firstH: 1, secondH: 2, thirdH: 4, fourthH: 2, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Federico", games: 4, avgPosition: 3.25, seasonPoints: -140, firstH: 0, secondH: 0, thirdH: 3, fourthH: 1, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Valeria", games: 4, avgPosition: 3.50, seasonPoints: -140, firstH: 0, secondH: 1, thirdH: 0, fourthH: 3, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Saulo", games: 4, avgPosition: 3.50, seasonPoints: -148, firstH: 0, secondH: 0, thirdH: 0, fourthH: 1, firstT: 0, secondT: 0, thirdT: 2, fourthT: 2 },
    { nickname: "Juan Mateo", games: 11, avgPosition: 3.00, seasonPoints: -148, firstH: 2, secondH: 1, thirdH: 1, fourthH: 3, firstT: 0, secondT: 0, thirdT: 2, fourthT: 2 },
    { nickname: "Sofia", games: 8, avgPosition: 3.13, seasonPoints: -164, firstH: 1, secondH: 0, thirdH: 0, fourthH: 3, firstT: 0, secondT: 1, thirdT: 2, fourthT: 1 },
    { nickname: "Pedro", games: 20, avgPosition: 2.70, seasonPoints: -185, firstH: 4, secondH: 2, thirdH: 5, fourthH: 6, firstT: 1, secondT: 0, thirdT: 2, fourthT: 0 },
    { nickname: "Agustina H", games: 4, avgPosition: 3.00, seasonPoints: -194, firstH: 0, secondH: 0, thirdH: 0, fourthH: 1, firstT: 0, secondT: 1, thirdT: 2, fourthT: 1 },
    { nickname: "Chiwi", games: 43, avgPosition: 2.67, seasonPoints: -196, firstH: 5, secondH: 8, thirdH: 10, fourthH: 8, firstT: 2, secondT: 4, thirdT: 2, fourthT: 4 },
    { nickname: "Ian", games: 9, avgPosition: 3.11, seasonPoints: -210, firstH: 1, secondH: 2, thirdH: 1, fourthH: 5, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Kevin", games: 24, avgPosition: 2.75, seasonPoints: -240, firstH: 6, secondH: 4, thirdH: 4, fourthH: 10, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Mati G. (minimati)", games: 16, avgPosition: 2.94, seasonPoints: -254, firstH: 3, secondH: 1, thirdH: 4, fourthH: 5, firstT: 0, secondT: 1, thirdT: 0, fourthT: 2 },
    { nickname: "Ariel M.", games: 17, avgPosition: 3.12, seasonPoints: -420, firstH: 0, secondH: 5, thirdH: 5, fourthH: 7, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Ini", games: 15, avgPosition: 3.20, seasonPoints: -490, firstH: 1, secondH: 2, thirdH: 5, fourthH: 7, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Wapuro", games: 4, avgPosition: 2.50, seasonPoints: 0, firstH: 1, secondH: 1, thirdH: 1, fourthH: 1, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 }
  ];

  const notFoundseason4 = [];
  for (const row of season4Top11) {
    const player = await findPlayerByNickname(row.nickname);
    if (player) {
      await (prisma as any).seasonResult.upsert({
        where: {
          seasonId_playerId_isSanma: {
            seasonId: await getSeasonIdByName('Temporada 4'),
            playerId: player.id,
            isSanma: false
          }
        },
        update: {},
        create: {
          seasonId: await getSeasonIdByName('Temporada 4'),
          playerId: player.id,
          isSanma: false,
          seasonTotalGames: row.games,
          seasonAveragePosition: row.avgPosition,
          seasonFirstPlaceH: row.firstH,
          seasonSecondPlaceH: row.secondH,
          seasonThirdPlaceH: row.thirdH,
          seasonFourthPlaceH: row.fourthH,
          seasonFirstPlaceT: row.firstT,
          seasonSecondPlaceT: row.secondT,
          seasonThirdPlaceT: row.thirdT,
          seasonFourthPlaceT: row.fourthT,
          seasonPoints: row.seasonPoints,
          extraData: {
            source: 'manual_seed',
            note: 'Temporada 4 - datos completos con breakdown Tonpu/Hanchan'
          }
        }
      });
    } else {
      notFoundseason4.push(row.nickname);
    }
  }
  if (notFoundseason4.length > 0) {
    console.log('⚠️ season 4 - players not found (no se crean):', notFoundseason4.join(', '));
  }
  console.log('✅ SeasonResult Top 11 for Season 4 seeded');

  // Seed SeasonResult for season 5 (con breakdown Tonpu/Hanchan) - TODOS LOS JUGADORES CON PUNTOS FINALES
  console.log('🏅 Seeding SeasonResult for Season 5...');
  const season5Top10 = [
    { nickname: "Nico", games: 24, avgPosition: 2.51, seasonPoints: 780, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Lucas", games: 28, avgPosition: 2.51, seasonPoints: 670, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Jess", games: 24, avgPosition: 2.5, seasonPoints: 648, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Cecilia", games: 12, avgPosition: 2.52, seasonPoints: 560, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Ailén", games: 12, avgPosition: 2.51, seasonPoints: 370, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Lucio", games: 0, avgPosition: 0, seasonPoints: 320, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "German", games: 15, avgPosition: 2.51, seasonPoints: 317, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Romo", games: 12, avgPosition: 2.51, seasonPoints: 220, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Martin", games: 8, avgPosition: 2.51, seasonPoints: 220, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Mauro", games: 0, avgPosition: 0, seasonPoints: 180, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Sebastián (PE) (SethSeroly)", games: 0, avgPosition: 0, seasonPoints: 150, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Chiwi", games: 18, avgPosition: 2.51, seasonPoints: 137, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Guile", games: 6, avgPosition: 2.52, seasonPoints: 130, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Haku/Kozi", games: 6, avgPosition: 2.52, seasonPoints: 110, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Lucas R. (BR) (LagadoBR)", games: 6, avgPosition: 2.51, seasonPoints: 110, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Dario", games: 10, avgPosition: 2.51, seasonPoints: 100, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Andres", games: 0, avgPosition: 0, seasonPoints: 100, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Marian", games: 3, avgPosition: 2.53, seasonPoints: 92, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Davy", games: 6, avgPosition: 2.5, seasonPoints: 90, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Maria C.", games: 0, avgPosition: 0, seasonPoints: 90, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Marcelo", games: 0, avgPosition: 0, seasonPoints: 80, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Jrash", games: 0, avgPosition: 0, seasonPoints: 80, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Cristóbal (CL) (Kenzo)", games: 0, avgPosition: 0, seasonPoints: 80, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Paula", games: 0, avgPosition: 0, seasonPoints: 80, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Facu (UY)", games: 12, avgPosition: 2.52, seasonPoints: 60, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Pedro", games: 0, avgPosition: 0, seasonPoints: 50, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Pato", games: 0, avgPosition: 0, seasonPoints: 50, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Lucila (Luuucilu", games: 4, avgPosition: 2.51, seasonPoints: 40, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Guille", games: 7, avgPosition: 2.5, seasonPoints: 40, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Walt", games: 0, avgPosition: 0, seasonPoints: 40, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Lukas", games: 3, avgPosition: 2.53, seasonPoints: 35, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Andre", games: 0, avgPosition: 0, seasonPoints: 30, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Laura", games: 2, avgPosition: 2.51, seasonPoints: 17, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Leonardo (CL) (caballo)", games: 0, avgPosition: 0, seasonPoints: 10, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Marce", games: 0, avgPosition: 0, seasonPoints: 10, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Camilo", games: 0, avgPosition: 0, seasonPoints: 10, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Tomas", games: 0, avgPosition: 0, seasonPoints: 10, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Pol", games: 0, avgPosition: 0, seasonPoints: 10, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Gabriela", games: 0, avgPosition: 0, seasonPoints: 10, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Lloocky", games: 0, avgPosition: 0, seasonPoints: 10, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Mati S.", games: 0, avgPosition: 0, seasonPoints: 10, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Nicolas (Claudio friend)", games: 0, avgPosition: 0, seasonPoints: 0, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Mati", games: 0, avgPosition: 0, seasonPoints: 0, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Mel", games: 0, avgPosition: 0, seasonPoints: 0, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 },
    { nickname: "Claudia", games: 0, avgPosition: 0, seasonPoints: 0, firstH: 0, secondH: 0, thirdH: 0, fourthH: 0, firstT: 0, secondT: 0, thirdT: 0, fourthT: 0 }
  ];

  const notFoundseason5 = [];
  for (const row of season5Top10) {
    const player = await findPlayerByNickname(row.nickname);
    if (player) {
      await (prisma as any).seasonResult.upsert({
        where: {
          seasonId_playerId_isSanma: {
            seasonId: await getSeasonIdByName('Temporada 5'),
            playerId: player.id,
            isSanma: false
          }
        },
        update: {},
        create: {
          seasonId: await getSeasonIdByName('Temporada 5'),
          playerId: player.id,
          isSanma: false,
          seasonTotalGames: row.games,
          seasonAveragePosition: row.avgPosition,
          seasonFirstPlaceH: row.firstH,
          seasonSecondPlaceH: row.secondH,
          seasonThirdPlaceH: row.thirdH,
          seasonFourthPlaceH: row.fourthH,
          seasonFirstPlaceT: row.firstT,
          seasonSecondPlaceT: row.secondT,
          seasonThirdPlaceT: row.thirdT,
          seasonFourthPlaceT: row.fourthT,
          seasonPoints: row.seasonPoints,
          extraData: {
            source: 'manual_seed',
            note: 'Temporada 5 - datos completos con breakdown Tonpu/Hanchan'
          }
        }
      });
    } else {
      notFoundseason5.push(row.nickname);
    }
  }
  if (notFoundseason5.length > 0) {
    console.log('⚠️ season 5 - players not found (no se crean):', notFoundseason5.join(', '));
  }
  console.log('✅ SeasonResult Top 10 for Season 5 seeded');

  // Seed Tournament Results for "2do torneo presencial"
  // Check if tournament results already exist
  const existingTournamentResults = await prisma.tournamentResult.count();
  if (existingTournamentResults > 0) {
    console.log(`✅ Tournament results already exist (${existingTournamentResults} found), skipping tournament results seeding...`);
  } else {
    console.log('⚠️ Tournament results seeding temporarily disabled due to syntax errors');
    console.log('🔧 This section needs to be fixed manually');
  }

  console.log('🎉 Database seeded successfully!');
  return;

  /* TEMPORARILY COMMENTED OUT - TOURNAMENT RESULTS SEEDING
  // This section has syntax errors that need to be fixed manually

  console.log('🏆 Seeding tournament results for "2do torneo presencial"...');

  // Obtener el torneo "2do torneo presencial"
  const torneo2dotorneopresencial = await prisma.tournament.findFirst({
    where: { name: '2do torneo presencial' }
  });

  if (torneo2dotorneopresencial) {
    const torneo2dotorneopresencialResults = [
      { nickname: 'Mati', points: 400, position: 1 },
      { nickname: 'Akito', points: 300, position: 2 },
      { nickname: 'Jess', points: 250, position: 3 },
      { nickname: 'Adriel', points: 225, position: 4 },
      { nickname: 'Dario', points: 150, position: 5 },
      { nickname: 'Pato', points: 125, position: 6 },
      { nickname: 'Koki', points: 100, position: 7 },
      { nickname: 'Mauro', points: 75, position: 8 },
      { nickname: 'Nico', points: 50, position: 9 },
      { nickname: 'Nicolas (old)', points: 50, position: 10 },
      { nickname: 'Lucas', points: 25, position: 11 },
      { nickname: 'Michael', points: 25, position: 12 },
      { nickname: 'Pedro', points: 25, position: 13 },
      { nickname: 'Romo', points: 10, position: 14 },
      { nickname: 'Azul', points: 10, position: 15 },
      { nickname: 'Jhony', points: 10, position: 16 },
      { nickname: 'Figo/Iori', points: 0, position: 17 },
      { nickname: 'Adrian', points: 0, position: 18 },
      { nickname: 'Lucio', points: 0, position: 19 },
      { nickname: 'Luli', points: 0, position: 20 },
      { nickname: 'Haku/Kozi', points: 0, position: 21 },
      { nickname: 'Alejandro', points: 0, position: 22 },
      { nickname: 'Ini', points: 0, position: 23 },
      { nickname: 'Chiwi', points: 0, position: 24 },
      { nickname: 'Maxi', points: 0, position: 25 },
      { nickname: 'Juli', points: 0, position: 26 },
      { nickname: 'Tamara', points: 0, position: 27 },
      { nickname: 'Taro', points: 0, position: 28 },
      { nickname: 'Ernesto', points: 0, position: 29 },
      { nickname: 'Nadia', points: 0, position: 30 },
    ];

    let createdAtResults = 0;
    for (const result of torneo2dotorneopresencialResults) {
      const player = await prisma.player.findFirst({
        where: { nickname: result.nickname }
      });

      if (player) {
        await prisma.tournamentResult.upsert({
          where: {
            tournamentId_playerId: {
              tournamentId: torneo2dotorneopresencial.id,
              playerId: player.id
            }
          },
          update: {},
          create: {
            tournamentId: torneo2dotorneopresencial.id,
            playerId: player.id,
            pointsWon: result.points,
            position: result.position
          }
        });
        createdAtResults++;
      } else {
        seedFail(`⚠️ Player not found: ${result.nickname}`);
      }
    }
    console.log(`✅ createdAt ${createdAtResults} tournament results for "2do torneo presencial"`);
  } else {
    console.log('⚠️ Tournament "2do torneo presencial" not found');
  }

  // Seed Tournament Results for "Tercero torneo presencial"
  console.log('🏆 Seeding tournament results for "Tercero torneo presencial"...');

  // Obtener el torneo "Tercero torneo presencial"
  const tercerotorneopresencial = await prisma.tournament.findFirst({
    where: { name: 'Tercero torneo presencial' }
  });

  if (tercerotorneopresencial) {
    const tercerotorneopresencialResults = [
      { nickname: 'Pato', points: 400, position: 1 },
      { nickname: 'Enio', points: 300, position: 2 },
      { nickname: 'Fer', points: 250, position: 3 },
      { nickname: 'Naoko', points: 225, position: 4 },
      { nickname: 'Nico', points: 150, position: 5 },
      { nickname: 'Lucas', points: 150, position: 6 },
      { nickname: 'Mati', points: 100, position: 7 },
      { nickname: 'Haku/Kozi', points: 100, position: 8 },
      { nickname: 'Chiwi', points: 75, position: 9 },
      { nickname: 'Facu (UY)', points: 50, position: 10 },
      { nickname: 'Lucio', points: 15, position: 11 },
      { nickname: 'Dario', points: 10, position: 12 },
      { nickname: 'Mauro', points: 10, position: 13 },
      { nickname: 'Jess', points: 10, position: 14 },
      { nickname: 'Juli', points: 10, position: 15 },
      { nickname: 'Figo/Iori', points: 0, position: 16 },
      { nickname: 'Adrian', points: 0, position: 17 },
      { nickname: 'Koki', points: 0, position: 18 },
      { nickname: 'Pedro', points: 0, position: 19 },
      { nickname: 'Romo', points: 0, position: 20 },
      { nickname: 'Mati G. (minimati)', points: 0, position: 21 },
      { nickname: 'Lucas Albor', points: 0, position: 22 },
      { nickname: 'Guile', points: 0, position: 23 },
      { nickname: 'Davy', points: 0, position: 24 },
    ];

    let createdAtResults = 0;
    for (const result of tercerotorneopresencialResults) {
      const player = await prisma.player.findFirst({
        where: { nickname: result.nickname }
      });

      if (player) {
        await upsertTournamentResult(tercerotorneopresencial.id, player.id, result.points, result.position);
        createdAtResults++;
      } else {
        seedFail(`⚠️ Player not found: ${result.nickname}`);
      }
    }
    console.log(`✅ createdAt ${createdAtResults} tournament results for "Tercero torneo presencial"`);
  } else {
    console.log('⚠️ Tournament "Tercero torneo presencial" not found');
  }

  // Seed Tournament Results for "2do torneo sudamericano SAMA"
  console.log('🏆 Seeding tournament results for "2do torneo sudamericano SAMA"...');

  // Obtener el torneo "2do torneo sudamericano SAMA"
  const torneo2dotorneosudamericanosama = await prisma.tournament.findFirst({
    where: { name: '2do torneo sudamericano SAMA' }
  });

  if (torneo2dotorneosudamericanosama) {
    const torneo2dotorneosudamericanosamaResults = [

      { nickname: 'Amauri (BR)', points: 500, position: 1 },
      { nickname: 'Fran', points: 300, position: 2 },
      { nickname: 'Guile', points: 200, position: 3 },
      { nickname: 'Michael', points: 150, position: 4 },
      { nickname: 'Facu (UY)', points: 100, position: 5 },
      { nickname: 'Ini', points: 100, position: 6 },
      { nickname: 'Arthur (BR)', points: 80, position: 7 },
      { nickname: 'Pato', points: 80, position: 8 },
      { nickname: 'Romo', points: 70, position: 9 },
      { nickname: 'Lautaro (LP) DiG.', points: 50, position: 10 },
      { nickname: 'Mati', points: 40, position: 11 },
      { nickname: 'Adrian', points: 30, position: 12 },
      { nickname: 'Jess', points: 20, position: 13 },
      { nickname: 'Lucas', points: 10, position: 14 },
      { nickname: 'Lucio', points: 10, position: 15 },
      { nickname: 'Fer', points: 10, position: 16 },
      { nickname: 'Marcelo', points: 0, position: 17 },
      { nickname: 'Mauro', points: 0, position: 18 },
      { nickname: 'Felipe (CL)', points: 0, position: 19 },
      { nickname: 'Nico', points: 0, position: 20 },
      { nickname: 'Chiwi', points: 0, position: 21 },
      { nickname: 'Luli', points: 0, position: 22 },
      { nickname: 'Adriel', points: 0, position: 23 },
      { nickname: 'Mati G. (minimati)', points: 0, position: 24 },
    ];

    let createdAtResults = 0;
    for (const result of torneo2dotorneosudamericanosamaResults) {
      const player = await prisma.player.findFirst({
        where: { nickname: result.nickname }
      });

      if (player) {
        await prisma.tournamentResult.upsert({
          where: {
            tournamentId_playerId: {
              tournamentId: torneo2dotorneosudamericanosama.id,
            playerId: player.id,
            pointsWon: result.points,
            position: result.position
          }
        });
        createdAtResults++;
      } else {
        seedFail(`⚠️ Player not found: ${result.nickname}`);
      }
    }
    console.log(`✅ createdAt ${createdAtResults} tournament results for "2do torneo sudamericano SAMA"`);
  } else {
    console.log('⚠️ Tournament "2do torneo sudamericano SAMA" not found');
  }

  // Seed Tournament Results for "Liga CARM 2018"
  console.log('🏆 Seeding tournament results for "Liga CARM 2018"...');

  // Obtener el torneo "Liga CARM 2018"
  const ligacarm2018 = await prisma.tournament.findFirst({
    where: { name: 'Liga CARM 2018' }
  });

  if (ligacarm2018) {
    const ligacarm2018Results = [
      { nickname: 'Mati', points: 500, position: 1 },
      { nickname: 'Lucas', points: 300, position: 2 },
      { nickname: 'Mauro', points: 200, position: 3 },
      { nickname: 'Adrian', points: 150, position: 4 },
      { nickname: 'Lucio', points: 100, position: 5 },
      { nickname: 'Pato', points: 100, position: 6 },
      { nickname: 'Chiwi', points: 80, position: 7 },
      { nickname: 'Ini', points: 70, position: 8 },
      { nickname: 'Haku/Kozi', points: 50, position: 9 },
      { nickname: 'Luli', points: 40, position: 10 },
      { nickname: 'Nico', points: 30, position: 11 },
      { nickname: 'Jess', points: 20, position: 12 },
      { nickname: 'Guile', points: 10, position: 13 },
      { nickname: 'Lautaro (LP) DiG.', points: 10, position: 14 },
      { nickname: 'Romo', points: 10, position: 15 },
    ];

    let createdAtResults = 0;
    for (const result of ligacarm2018Results) {
      const player = await prisma.player.findFirst({
        where: { nickname: result.nickname }
      });

      if (player) {
        await prisma.tournamentResult.upsert({
          where: {
            tournamentId_playerId: {
              tournamentId: ligacarm2018.id,
            playerId: player.id,
            pointsWon: result.points,
            position: result.position
          }
        });
        createdAtResults++;
      } else {
        seedFail(`⚠️ Player not found: ${result.nickname}`);
      }
    }
    console.log(`✅ createdAt ${createdAtResults} tournament results for "Liga CARM 2018"`);
  } else {
    console.log('⚠️ Tournament "Liga CARM 2018" not found');
  }

  // Seed Tournament Results for "Primer minitorneo (online)"
  console.log('🏆 Seeding tournament results for "Primer minitorneo (online)"...');

  // Obtener el torneo "Primer minitorneo (online)"
  const primerminitorneoonline = await prisma.tournament.findFirst({
    where: { name: 'Primer minitorneo (online)' }
  });

  if (primerminitorneoonline) {
    const primerminitorneoonlineResults = [
      { nickname: 'Nico', points: 100, position: 1 },
      { nickname: 'Guile', points: 75, position: 2 },
      { nickname: 'Jonathan', points: 50, position: 3 },
      { nickname: 'Facu (UY)', points: 25, position: 4 },
      { nickname: 'Lucas', points: 20, position: 5 },
      { nickname: 'Luli', points: 15, position: 6 },
      { nickname: 'Saulo', points: 10, position: 7 },
      { nickname: 'Agustina H', points: 10, position: 8 },
    ];

    let createdAtResults = 0;
    for (const result of primerminitorneoonlineResults) {
      const player = await prisma.player.findFirst({
        where: { nickname: result.nickname }
      });

      if (player) {
        await prisma.tournamentResult.upsert({
          where: {
            tournamentId_playerId: {
              tournamentId: primerminitorneoonline.id,
            playerId: player.id,
            pointsWon: result.points,
            position: result.position
          }
        });
        createdAtResults++;
      } else {
        seedFail(`⚠️ Player not found: ${result.nickname}`);
      }
    }
    console.log(`✅ createdAt ${createdAtResults} tournament results for "Primer minitorneo (online)"`);
  } else {
    console.log('⚠️ Tournament "Primer minitorneo (online)" not found');
  }

  // Seed Tournament Results for "Sexto minitorneo (presencial)"
  console.log('🏆 Seeding tournament results for "Sexto minitorneo (presencial)"...');

  // Obtener el torneo "Sexto minitorneo (presencial)"
  const sextominitorneopresencial = await prisma.tournament.findFirst({
    where: { name: 'Sexto minitorneo (presencial)' }
  });

  if (sextominitorneopresencial) {
    const sextominitorneopresencialResults = [
      { nickname: 'Javilo', points: 100, position: 1 },
      { nickname: 'Koki', points: 75, position: 2 },
      { nickname: 'Agus I', points: 50, position: 3 },
      { nickname: 'Mati S.', points: 25, position: 4 },
      { nickname: 'Guile', points: 20, position: 5 },
      { nickname: 'Mati', points: 15, position: 6 },
      { nickname: 'Naoko', points: 10, position: 7 },
      { nickname: 'Martin O.', points: 10, position: 8 },
    ];

    let createdAtResults = 0;
    for (const result of sextominitorneopresencialResults) {
      const player = await prisma.player.findFirst({
        where: { nickname: result.nickname }
      });

      if (player) {
        await prisma.tournamentResult.upsert({
          where: {
            tournamentId_playerId: {
              tournamentId: sextominitorneopresencial.id,
            playerId: player.id,
            pointsWon: result.points,
            position: result.position
          }
        });
        createdAtResults++;
      } else {
        seedFail(`⚠️ Player not found: ${result.nickname}`);
      }
    }
    console.log(`✅ createdAt ${createdAtResults} tournament results for "Sexto minitorneo (presencial)"`);
  } else {
    console.log('⚠️ Tournament "Sexto minitorneo (presencial)" not found');
  }

  // Seed Tournament Results for "Olimpiadas de la mente 2019"
  console.log('🏆 Seeding tournament results for "Olimpiadas de la mente 2019"...');

  // Obtener el torneo "Olimpiadas de la mente 2019"
  const olimpiadasdelamente2019 = await prisma.tournament.findFirst({
    where: { name: 'Olimpiadas de la mente 2019' }
  });

  if (olimpiadasdelamente2019) {
    const olimpiadasdelamente2019Results = [
      { nickname: 'Koki', points: 100, position: 1 },
      { nickname: 'Lucio', points: 75, position: 2 },
      { nickname: 'Mauro', points: 50, position: 3 },
      { nickname: 'Pedro', points: 25, position: 4 },
      { nickname: 'Lucas', points: 20, position: 5 },
      { nickname: 'Pato', points: 15, position: 6 },
      { nickname: 'Naoko', points: 10, position: 7 },
      { nickname: 'Mati', points: 10, position: 8 },
      { nickname: 'Fran', points: 0, position: 9 },
      { nickname: 'Javilo', points: 0, position: 10 },
      { nickname: 'Jess', points: 0, position: 11 },
      { nickname: 'Lautaro (LP) DiG.', points: 0, position: 12 },
      { nickname: 'Haku/Kozi', points: 0, position: 13 },
      { nickname: 'Mati G. (minimati)', points: 0, position: 14 },
      { nickname: 'Franco', points: 0, position: 15 },
      { nickname: 'Chiwi', points: 0, position: 16 },
    ];

    let createdAtResults = 0;
    for (const result of olimpiadasdelamente2019Results) {
      const player = await prisma.player.findFirst({
        where: { nickname: result.nickname }
      });

      if (player) {
        await prisma.tournamentResult.upsert({
          where: {
            tournamentId_playerId: {
              tournamentId: olimpiadasdelamente2019.id,
            playerId: player.id,
            pointsWon: result.points,
            position: result.position
          }
        });
        createdAtResults++;
      } else {
        seedFail(`⚠️ Player not found: ${result.nickname}`);
      }
    }
    console.log(`✅ createdAt ${createdAtResults} tournament results for "Olimpiadas de la mente 2019"`);
  } else {
    console.log('⚠️ Tournament "Olimpiadas de la mente 2019" not found');
  }

  // Seed Tournament Results for "Cuarto minitorneo (presencial)"
  console.log('🏆 Seeding tournament results for "Cuarto minitorneo (presencial)"...');

  // Obtener el torneo "Cuarto minitorneo (presencial)"
  const cuartominitorneopresencial = await prisma.tournament.findFirst({
    where: { name: 'Cuarto minitorneo (presencial)' }
  });

  if (cuartominitorneopresencial) {
    const cuartominitorneopresencialResults = [
      { nickname: 'Lucio', points: 100, position: 1 },
      { nickname: 'Pablo G.', points: 50, position: 2 },
      { nickname: 'Nico', points: 25, position: 3 },
      { nickname: 'Pancho', points: 10, position: 4 },
    ];

    let createdAtResults = 0;
    for (const result of cuartominitorneopresencialResults) {
      const player = await prisma.player.findFirst({
        where: { nickname: result.nickname }
      });

      if (player) {
        await prisma.tournamentResult.upsert({
          where: {
            tournamentId_playerId: {
              tournamentId: cuartominitorneopresencial.id,
            playerId: player.id,
            pointsWon: result.points,
            position: result.position
          }
        });
        createdAtResults++;
      } else {
        seedFail(`⚠️ Player not found: ${result.nickname}`);
      }
    }
    console.log(`✅ createdAt ${createdAtResults} tournament results for "Cuarto minitorneo (presencial)"`);
  } else {
    console.log('⚠️ Tournament "Cuarto minitorneo (presencial)" not found');
  }

  // Seed Tournament Results for "4to torneo presencial"
  console.log('🏆 Seeding tournament results for "4to torneo presencial"...');

  // Obtener el torneo "4to torneo presencial"
  const torneo4totorneopresencial = await prisma.tournament.findFirst({
    where: { name: '4to torneo presencial' }
  });

  if (torneo4totorneopresencial) {
    const torneo4totorneopresencialResults = [
      { nickname: 'Naoko', points: 500, position: 1 },
      { nickname: 'Nico', points: 300, position: 2 },
      { nickname: 'Lucas', points: 200, position: 3 },
      { nickname: 'Mati', points: 150, position: 4 },
      { nickname: 'Koki', points: 100, position: 5 },
      { nickname: 'Pato', points: 100, position: 6 },
      { nickname: 'Mauro', points: 80, position: 7 },
      { nickname: 'Luli', points: 80, position: 8 },
      { nickname: 'Romo', points: 70, position: 9 },
      { nickname: 'Javilo', points: 50, position: 10 },
      { nickname: 'German', points: 40, position: 11 },
      { nickname: 'Ailén', points: 30, position: 12 },
      { nickname: 'Lucio', points: 20, position: 13 },
      { nickname: 'Federico', points: 10, position: 14 },
      { nickname: 'Jess', points: 10, position: 15 },
      { nickname: 'Mati G. (minimati)', points: 10, position: 16 },
      { nickname: 'Guile', points: 0, position: 17 },
      { nickname: 'Sofi', points: 0, position: 18 },
    ];

    let createdAtResults = 0;
    for (const result of torneo4totorneopresencialResults) {
      const player = await prisma.player.findFirst({
        where: { nickname: result.nickname }
      });

      if (player) {
        await prisma.tournamentResult.upsert({
          where: {
            tournamentId_playerId: {
              tournamentId: torneo4totorneopresencial.id,
            playerId: player.id,
            pointsWon: result.points,
            position: result.position
          }
        });
        createdAtResults++;
      } else {
        seedFail(`⚠️ Player not found: ${result.nickname}`);
      }
    }
    console.log(`✅ createdAt ${createdAtResults} tournament results for "4to torneo presencial"`);
  } else {
    console.log('⚠️ Tournament "4to torneo presencial" not found');
  }

  // Seed Tournament Results for "Quinto minitorneo (online)"
  console.log('🏆 Seeding tournament results for "Quinto minitorneo (online)"...');

  // Obtener el torneo "Quinto minitorneo (online)"
  const quintominitorneoonline = await prisma.tournament.findFirst({
    where: { name: 'Quinto minitorneo (online)' }
  });

  if (quintominitorneoonline) {
    const quintominitorneoonlineResults = [
      { nickname: 'Mati', points: 100, position: 1 },
      { nickname: 'Lucio', points: 50, position: 2 },
      { nickname: 'Andres', points: 25, position: 3 },
      { nickname: 'Guile', points: 10, position: 4 },
      { nickname: 'Agustina H', points: -100, position: 5 },
    ];

    let createdAtResults = 0;
    for (const result of quintominitorneoonlineResults) {
      const player = await prisma.player.findFirst({
        where: { nickname: result.nickname }
      });

      if (player) {
        await prisma.tournamentResult.upsert({
          where: {
            tournamentId_playerId: {
              tournamentId: quintominitorneoonline.id,
            playerId: player.id,
            pointsWon: result.points,
            position: result.position
          }
        });
        createdAtResults++;
      } else {
        seedFail(`⚠️ Player not found: ${result.nickname}`);
      }
    }
    console.log(`✅ createdAt ${createdAtResults} tournament results for "Quinto minitorneo (online)"`);
  } else {
    console.log('⚠️ Tournament "Quinto minitorneo (online)" not found');
  }

  // Seed Tournament Results for "10mo Minitorneo Online"
  console.log('🏆 Seeding tournament results for "10mo Minitorneo Online"...');

  // Obtener el torneo "10mo Minitorneo Online"
  const torneo10mominitorneoonline = await prisma.tournament.findFirst({
    where: { name: '10mo Minitorneo Online' }
  });

  if (torneo10mominitorneoonline) {
    const torneo10mominitorneoonlineResults = [
      // Top 8 segun planilla
      { nickname: 'Guile', points: 100, position: 1 },
      { nickname: 'Michael', points: 75, position: 2 },
      { nickname: 'German', points: 50, position: 3 },
      { nickname: 'Naoko', points: 25, position: 4 },
      { nickname: 'Koki', points: 20, position: 5 },
      { nickname: 'Mati S.', points: 15, position: 6 },
      { nickname: 'Jess', points: 10, position: 7 },
      { nickname: 'Sofi', points: 10, position: 8 },
    ];

    let createdAtResults = 0;
    for (const result of torneo10mominitorneoonlineResults) {
      const player = await prisma.player.findFirst({
        where: { nickname: result.nickname }
      });

      if (player) {
        await prisma.tournamentResult.upsert({
          where: {
            tournamentId_playerId: {
              tournamentId: torneo10mominitorneoonline.id,
            playerId: player.id,
            pointsWon: result.points,
            position: result.position
          }
        });
        createdAtResults++;
      } else {
        seedFail(`⚠️ Player not found: ${result.nickname}`);
      }
    }
    console.log(`✅ createdAt ${createdAtResults} tournament results for "10mo Minitorneo Online"`);
  } else {
    console.log('⚠️ Tournament "10mo Minitorneo Online" not found');
  }

  // Seed Tournament Results for "Torneo online abril 2020 Tenhou"
  console.log('🏆 Seeding tournament results for "Torneo online abril 2020 Tenhou"...');

  // Obtener el torneo "Torneo online abril 2020 Tenhou"
  const torneoonlineabril2020tenhou = await prisma.tournament.findFirst({
    where: { name: 'Torneo online abril 2020 Tenhou' }
  });

  if (torneoonlineabril2020tenhou) {
    const torneoonlineabril2020tenhouResults = [
      // Top 16 segun planilla
      { nickname: 'Fran', points: 500, position: 1 },
      { nickname: 'Lucio', points: 300, position: 2 },
      { nickname: 'Lucas', points: 200, position: 3 },
      { nickname: 'German', points: 150, position: 4 },
      { nickname: 'Andres', points: 100, position: 5 },
      { nickname: 'Pato', points: 100, position: 6 },
      { nickname: 'Kress', points: 80, position: 7 },
      { nickname: 'Romo', points: 80, position: 8 },
      { nickname: 'Kime', points: 70, position: 9 },
      { nickname: 'Nico', points: 50, position: 10 },
      { nickname: 'Chiwi', points: 40, position: 11 },
      { nickname: 'Mauro', points: 30, position: 12 },
      { nickname: 'Dario', points: 20, position: 13 },
      { nickname: 'Mati', points: 10, position: 14 },
      { nickname: 'Valeria', points: 10, position: 15 },
      { nickname: 'Juan Mateo', points: 10, position: 16 },
      // Restantes con 0
      { nickname: 'Falconer', points: 0, position: 17 },
      { nickname: 'Guile', points: 0, position: 18 },
      { nickname: 'Marian', points: 0, position: 19 },
      { nickname: 'Mati S.', points: 0, position: 20 },
    ];

    let createdAtResults = 0;
    for (const result of torneoonlineabril2020tenhouResults) {
      const player = await prisma.player.findFirst({
        where: { nickname: result.nickname }
      });

      if (player) {
        await prisma.tournamentResult.upsert({
          where: {
            tournamentId_playerId: {
              tournamentId: torneoonlineabril2020tenhou.id,
            playerId: player.id,
            pointsWon: result.points,
            position: result.position
          }
        });
        createdAtResults++;
      } else {
        seedFail(`⚠️ Player not found: ${result.nickname}`);
      }
    }
    console.log(`✅ createdAt ${createdAtResults} tournament results for "Torneo online abril 2020 Tenhou"`);
  } else {
    console.log('⚠️ Tournament "Torneo online abril 2020 Tenhou" not found');
  }

  // Seed Tournament Results for "Torneo Septiembre 2020"
  console.log('🏆 Seeding tournament results for "Torneo Septiembre 2020"...');

  // Obtener el torneo "Torneo Septiembre 2020"
  const torneoseptiembre2020 = await prisma.tournament.findFirst({
    where: { name: 'Torneo Septiembre 2020' }
  });

  if (torneoseptiembre2020) {
    const torneoseptiembre2020Results = [
      // Top 12 segun planilla
      { nickname: 'Jess', points: 500, position: 1 },
      { nickname: 'Lucas', points: 300, position: 2 },
      { nickname: 'German', points: 200, position: 3 },
      { nickname: 'Lucio', points: 150, position: 4 },
      { nickname: 'Romo', points: 100, position: 5 },
      { nickname: 'Andres', points: 100, position: 6 },
      { nickname: 'Marcelo', points: 80, position: 7 },
      { nickname: 'Maria C.', points: 80, position: 8 },
      { nickname: 'Mauro', points: 70, position: 9 },
      { nickname: 'Pedro', points: 50, position: 10 },
      { nickname: 'Jrash', points: 40, position: 11 },
      { nickname: 'Ailén', points: 30, position: 12 },
    ];

    let createdAtResults = 0;
    for (const result of torneoseptiembre2020Results) {
      const player = await prisma.player.findFirst({
        where: { nickname: result.nickname }
      });

      if (player) {
        await prisma.tournamentResult.upsert({
          where: {
            tournamentId_playerId: {
              tournamentId: torneoseptiembre2020.id,
            playerId: player.id,
            pointsWon: result.points,
            position: result.position
          }
        });
        createdAtResults++;
      } else {
        seedFail(`⚠️ Player not found: ${result.nickname}`);
      }
    }
    console.log(`✅ createdAt ${createdAtResults} tournament results for "Torneo Septiembre 2020"`);
  } else {
    console.log('⚠️ Tournament "Torneo Septiembre 2020" not found');
  }

  // Seed Tournament Results for "Torneo Relámpago CARM"
  console.log('🏆 Seeding tournament results for "Torneo Relámpago CARM"...');

  // Obtener el torneo "Torneo Relámpago CARM"
  const torneorelampagocarm = await prisma.tournament.findFirst({
    where: { name: 'Torneo Relámpago CARM' }
  });

  if (torneorelampagocarm) {
    const torneorelampagocarmResults = [
      { nickname: 'Nico', points: 500, position: 1 },
      { nickname: 'Facu (UY)', points: 300, position: 2 },
      { nickname: 'Lucas', points: 200, position: 3 },
      { nickname: 'Lucio', points: 150, position: 4 },
      { nickname: 'Chiwi', points: 100, position: 5 },
      { nickname: 'Dario', points: 100, position: 6 },
      { nickname: 'Jrash', points: 80, position: 7 },
      { nickname: 'Mauro', points: 80, position: 8 },
      { nickname: 'Mati', points: 70, position: 9 },
      { nickname: 'Romo', points: 50, position: 10 },
      { nickname: 'FedeRama', points: 40, position: 11 },
      { nickname: 'Cecilia', points: 30, position: 12 },
      { nickname: 'Wapuro', points: 20, position: 13 },
      { nickname: 'Jess', points: 10, position: 14 },
      { nickname: 'Pato', points: 10, position: 15 },
      { nickname: 'Mati G', points: 10, position: 16 },
      { nickname: 'Pedro', points: 10, position: 17 },
      { nickname: 'Maria C.', points: 10, position: 18 },
      { nickname: 'Luli', points: 10, position: 19 },
      { nickname: 'Andres', points: 10, position: 20 }
    ];

    let createdAtResults = 0;
    for (const result of torneorelampagocarmResults) {
      const player = await prisma.player.findFirst({
        where: { nickname: result.nickname }
      });

      if (player) {
        await prisma.tournamentResult.upsert({
          where: {
            tournamentId_playerId: {
              tournamentId: torneorelampagocarm.id,
            playerId: player.id,
            pointsWon: result.points,
            position: result.position
          }
        });
        createdAtResults++;
      } else {
        seedFail(`⚠️ Player not found: ${result.nickname}`);
      }
    }
    console.log(`✅ createdAt ${createdAtResults} tournament results for "Torneo Relámpago CARM"`);
  } else {
    console.log('⚠️ Tournament "Torneo Relámpago CARM" not found');
  }

  // Seed Tournament Results for "Torneo Apertura 2023"
  console.log('🏆 Seeding tournament results for "Torneo Apertura 2023"...');

  // Obtener el torneo "Torneo Apertura 2023"
  const torneoapertura2023 = await prisma.tournament.findFirst({
    where: { name: 'Torneo Apertura 2023' }
  });

  if (torneoapertura2023) {
    const torneoapertura2023Results = [
      // Posiciones y puntos según reglas del torneo
      { nickname: 'Nico', points: 500, position: 1 },
      { nickname: 'Lucas', points: 300, position: 2 },
      { nickname: 'Martin', points: 200, position: 3 },
      { nickname: 'Lucio', points: 150, position: 4 },
      { nickname: 'German', points: 100, position: 5 },
      { nickname: 'Guile', points: 100, position: 6 },
      { nickname: 'Haku/Kozi', points: 80, position: 7 },
      { nickname: 'Paula', points: 80, position: 8 },
      { nickname: 'Dario', points: 70, position: 9 },
      { nickname: 'Chiwi', points: 50, position: 10 },
      { nickname: 'Walt', points: 40, position: 11 },
      { nickname: 'Andre', points: 30, position: 12 },
      { nickname: 'Jess', points: 20, position: 13 },
      { nickname: 'Camilo', points: 10, position: 14 },
      { nickname: 'Guille', points: 10, position: 15 },
      { nickname: 'Tomas', points: 10, position: 16 },
      { nickname: 'Pol', points: 10, position: 17 },
      { nickname: 'Mauro', points: 10, position: 18 },
      { nickname: 'Gabriela', points: 10, position: 19 },
      { nickname: 'Lloocky', points: 10, position: 20 },
    ];

    let createdAtResults = 0;
    for (const result of torneoapertura2023Results) {
      const player = await prisma.player.findFirst({
        where: { nickname: result.nickname }
      });

      if (player) {
        await prisma.tournamentResult.upsert({
          where: {
            tournamentId_playerId: {
              tournamentId: torneoapertura2023.id,
            playerId: player.id,
            pointsWon: result.points,
            position: result.position
          }
        });
        createdAtResults++;
      } else {
        seedFail(`⚠️ Player not found: ${result.nickname}`);
      }
    }
    console.log(`✅ createdAt ${createdAtResults} tournament results for "Torneo Apertura 2023"`);
  } else {
    console.log('⚠️ Tournament "Torneo Apertura 2023" not found');
  }

  // Seed Tournament Results for "Olimpiadas de la mente 2023"
  console.log('🏆 Seeding tournament results for "Olimpiadas de la mente 2023"...');

  // Obtener el torneo "Olimpiadas de la mente 2023"
  const olimpiadasdelamente2023 = await prisma.tournament.findFirst({
    where: { name: 'Olimpiadas de la mente 2023' }
  });

  if (olimpiadasdelamente2023) {
    const olimpiadasdelamente2023Results = [
      // Top 16 segun planilla
      { nickname: 'Mauro', points: 100, position: 1 },
      { nickname: 'Marian', points: 75, position: 2 },
      { nickname: 'Chiwi', points: 50, position: 3 },
      { nickname: 'Lukas', points: 25, position: 4 },
      { nickname: 'Guille', points: 20, position: 5 },
      { nickname: 'Jess', points: 15, position: 6 },
      { nickname: 'Laura', points: 10, position: 7 },
      { nickname: 'Mati S.', points: 10, position: 8 },
      { nickname: 'German', points: 0, position: 9 },
      { nickname: 'Paula', points: 0, position: 10 },
      { nickname: 'Nicolas (Claudio friend)', points: 0, position: 11 },
      { nickname: 'Mati', points: 0, position: 12 },
      { nickname: 'Lloocky', points: 0, position: 13 },
      { nickname: 'Mel', points: 0, position: 14 },
      { nickname: 'Walt', points: 0, position: 15 },
      { nickname: 'Claudia', points: 0, position: 18 },
    ];

    let createdAtResults = 0;
    for (const result of olimpiadasdelamente2023Results) {
      const player = await prisma.player.findFirst({
        where: { nickname: result.nickname }
      });

      if (player) {
        await prisma.tournamentResult.upsert({
          where: {
            tournamentId_playerId: {
              tournamentId: olimpiadasdelamente2023.id,
            playerId: player.id,
            pointsWon: result.points,
            position: result.position
          }
        });
        createdAtResults++;
      } else {
        seedFail(`⚠️ Player not found: ${result.nickname}`);
      }
    }
    console.log(`✅ createdAt ${createdAtResults} tournament results for "Olimpiadas de la mente 2023"`);
  } else {
    console.log('⚠️ Tournament "Olimpiadas de la mente 2023" not found');
  }

  // Seed Tournament Results for "Mahjong Soul 2020"
  console.log('🏆 Seeding tournament results for "Mahjong Soul 2020"...');

  // Obtener el torneo "Mahjong Soul 2020"
  const mahjongsoul2020 = await prisma.tournament.findFirst({
    where: { name: 'Mahjong Soul 2020' }
  });

  if (mahjongsoul2020) {
    const mahjongsoul2020Results = [
      { nickname: 'Cecilia', points: 500, position: 1 },
      { nickname: 'Ailén', points: 300, position: 2 },
      { nickname: 'Nico', points: 200, position: 3 },
      { nickname: 'Sebastián (PE) (SethSeroly)', points: 150, position: 4 },
      { nickname: 'Lucas R. (BR) (LagadoBR)', points: 100, position: 5 },
      { nickname: 'Jess', points: 100, position: 6 },
      { nickname: 'Davy', points: 80, position: 7 },
      { nickname: 'Cristóbal (CL) (Kenzo)', points: 80, position: 8 },
      { nickname: 'Romo', points: 70, position: 9 },
      { nickname: 'Pato', points: 50, position: 10 },
      { nickname: 'Jrash', points: 40, position: 11 },
      { nickname: 'Lucila (Luuucilu', points: 30, position: 12 },
      { nickname: 'Lucio', points: 20, position: 13 },
      { nickname: 'Leonardo (CL) (caballo)', points: 10, position: 14 },
      { nickname: 'Maria C.', points: 10, position: 15 },
      { nickname: 'Marce', points: 10, position: 16 },
    ];

    let createdAtResults = 0;
    for (const result of mahjongsoul2020Results) {
      const player = await prisma.player.findFirst({
        where: { nickname: result.nickname }
      });

      if (player) {
        await prisma.tournamentResult.upsert({
          where: {
            tournamentId_playerId: {
              tournamentId: mahjongsoul2020.id,
            playerId: player.id,
            pointsWon: result.points,
            position: result.position
          }
        });
        createdAtResults++;
      } else {
        seedFail(`⚠️ Player not found: ${result.nickname}`);
      }
    }
    console.log(`✅ createdAt ${createdAtResults} tournament results for "Mahjong Soul 2020"`);
  } else {
    console.log('⚠️ Tournament "Mahjong Soul 2020" not found');
  }

  // Seed Tournament Results for "1er torneo online"
  console.log('🏆 Seeding tournament results for "1er torneo online"...');

  // Obtener el torneo "1er torneo online"
  const torneo1ertorneoonline = await prisma.tournament.findFirst({
    where: { name: '1er torneo online' }
  });

  if (torneo1ertorneoonline) {
    const torneo1ertorneoonlineResults = [
      { nickname: 'Nico', points: 400, position: 1 },
      { nickname: 'Dario', points: 300, position: 2 },
      { nickname: 'Lucas', points: 250, position: 3 },
      { nickname: 'Kime', points: 225, position: 4 },
      { nickname: 'Pedro', points: 150, position: 5 },
      { nickname: 'Mati', points: 125, position: 6 },
      { nickname: 'Wapuro', points: 100, position: 7 },
      { nickname: 'Adrian', points: 75, position: 8 },
      { nickname: 'Romo', points: 50, position: 9 },
      { nickname: 'Figo/Iori', points: 25, position: 10 },
      { nickname: 'Fran', points: 25, position: 11 },
      { nickname: 'Cristian (CL)', points: 25, position: 12 },
      { nickname: 'Mauro', points: 10, position: 13 },
      { nickname: 'Pato', points: 10, position: 14 },
      { nickname: 'Ini', points: 10, position: 15 },
      { nickname: 'Chiwi', points: 10, position: 16 },
      { nickname: 'Azul', points: 10, position: 17 },
      { nickname: 'Fer', points: 0, position: 18 },
      { nickname: 'Jess', points: 0, position: 19 },
      { nickname: 'Haku/Kozi', points: 0, position: 20 },
      { nickname: 'Facu (UY)', points: 0, position: 21 },
      { nickname: 'Akito', points: 0, position: 22 },
      { nickname: 'Guile', points: 0, position: 23 },
      { nickname: 'Sebas (CO)', points: 0, position: 24 },
      { nickname: 'Ernesto', points: 0, position: 25 },
    ];

    let createdAtResults = 0;
    for (const result of torneo1ertorneoonlineResults) {
      const player = await prisma.player.findFirst({
        where: { nickname: result.nickname }
      });

      if (player) {
        await prisma.tournamentResult.upsert({
          where: {
            tournamentId_playerId: {
              tournamentId: torneo1ertorneoonline.id,
            playerId: player.id,
            pointsWon: result.points,
            position: result.position
          }
        });
        createdAtResults++;
      } else {
        seedFail(`⚠️ Player not found: ${result.nickname}`);
      }
    }
    console.log(`✅ createdAt ${createdAtResults} tournament results for "1er torneo online"`);
  } else {
    console.log('⚠️ Tournament "1er torneo online" not found');
  }

  // Seed Tournament Results for "Riichi en pascuas 2024"
  console.log('🏆 Seeding tournament results for "Riichi en pascuas 2024"...');

  // Obtener el torneo "Riichi en pascuas 2024"
  const riichienpascuas2024 = await prisma.tournament.findFirst({
    where: { name: 'Riichi en pascuas 2024' }
  });

  if (riichienpascuas2024) {
    const riichienpascuas2024Results = [
      { nickname: 'Fran', points: 100, position: 1 },
      { nickname: 'Andres', points: 60, position: 2 },
      { nickname: 'Mati', points: 40, position: 3 },
      { nickname: 'Jess', points: 20, position: 4 },
      { nickname: 'Adrian', points: 0, position: 5 },
      { nickname: 'Chiwi', points: 0, position: 6 },
      { nickname: 'Claudia', points: 0, position: 7 },
      { nickname: 'Danbliz', points: 0, position: 8 },
      { nickname: 'Fofo', points: 0, position: 9 },
      { nickname: 'Haku/Kozi', points: 0, position: 10 },
      { nickname: 'Huan', points: 0, position: 11 },
      { nickname: 'Javilo', points: 0, position: 12 },
      { nickname: 'Marce', points: 0, position: 13 },
      { nickname: 'Mauro', points: 0, position: 14 },
      { nickname: 'Nico', points: 0, position: 15 },
      { nickname: 'Pato', points: 0, position: 16 },
      { nickname: 'Paula', points: 0, position: 17 },
      { nickname: 'San', points: 0, position: 18 },
    ];

    let createdAtResults = 0;
    for (const result of riichienpascuas2024Results) {
      const player = await prisma.player.findFirst({
        where: { nickname: result.nickname }
      });

      if (player) {
        await prisma.tournamentResult.upsert({
          where: {
            tournamentId_playerId: {
              tournamentId: riichienpascuas2024.id,
            playerId: player.id,
            pointsWon: result.points,
            position: result.position
          }
        });
        createdAtResults++;
      } else {
        seedFail(`⚠️ Player not found: ${result.nickname}`);
      }
    }
    console.log(`✅ createdAt ${createdAtResults} tournament results for "Riichi en pascuas 2024"`);
  } else {
    console.log('⚠️ Tournament "Riichi en pascuas 2024" not found');
  }

  // Seed Tournament Results for "Torneo Online Diciembre 2024 Mahjong Soul"
  console.log('🏆 Seeding tournament results for "Torneo Online Diciembre 2024 Mahjong Soul"...');

  // Obtener el torneo "Torneo Online Diciembre 2024 Mahjong Soul"
  const findeaoonline2024 = await prisma.tournament.findFirst({
    where: { name: 'Torneo Online Diciembre 2024 Mahjong Soul' }
  });

  if (findeaoonline2024) {
    const findeaoonline2024Results = [
      { nickname: 'German', points: 500, position: 1 },
      { nickname: 'Maxi', points: 300, position: 2 },
      { nickname: 'Tomas', points: 200, position: 3 },
      { nickname: 'Nico', points: 150, position: 4 },
      { nickname: 'Mati', points: 100, position: 5 },
      { nickname: 'Lukas', points: 100, position: 6 },
      { nickname: 'Dario A', points: 80, position: 7 },
      { nickname: 'Dario', points: 80, position: 8 },
      { nickname: 'Kime', points: 70, position: 9 },
      { nickname: 'Lautaro', points: 50, position: 10 },
      { nickname: 'Szarps', points: 40, position: 11 },
      { nickname: 'Pato', points: 30, position: 12 },
      { nickname: 'Paula', points: 20, position: 13 },
      { nickname: 'Haku/Kozi', points: 10, position: 14 },
      { nickname: 'Lucas', points: 10, position: 15 },
      { nickname: 'Danbliz', points: 10, position: 16 },
      { nickname: 'Andres', points: 0, position: 17 },
      { nickname: 'Felicitas', points: 0, position: 18 },
      { nickname: 'Fofo', points: 0, position: 19 },
      { nickname: 'Guile', points: 0, position: 20 },
      { nickname: 'Huan', points: 0, position: 21 },
      { nickname: 'Jess', points: 0, position: 22 },
      { nickname: 'Somar', points: 0, position: 23 },
      { nickname: 'Uma', points: 0, position: 24 },
    ];

    let createdAtResults = 0;
    for (const result of findeaoonline2024Results) {
      const player = await prisma.player.findFirst({
        where: { nickname: result.nickname }
      });

      if (player) {
        await prisma.tournamentResult.upsert({
          where: {
            tournamentId_playerId: {
              tournamentId: findeaoonline2024.id,
            playerId: player.id,
            pointsWon: result.points,
            position: result.position
          }
        });
        createdAtResults++;
      } else {
        seedFail(`⚠️ Player not found: ${result.nickname}`);
      }
    }
    console.log(`✅ createdAt ${createdAtResults} tournament results for "Torneo Online Diciembre 2024 Mahjong Soul"`);
  } else {
    console.log('⚠️ Tournament "Torneo Online Diciembre 2024 Mahjong Soul" not found');
  }

  // Seed Locations
  console.log('📍 Seeding locations...');
  const locationOnline = await prisma.location.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Online',
      address: null,
      city: null,
      country: null,
      extraData: {
        type: 'virtual',
        platforms: ['Tenhou', 'Mahjong Soul'],
      },
    },
  });

  const locationBuenosAires = await prisma.location.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'Club CAMR - Buenos Aires',
      address: 'Dirección del club',
      city: 'Buenos Aires',
      country: 'Argentina',
      extraData: {
        type: 'physical',
        capacity: 20,
        equipment: 'Mesas automáticas',
      },
    },
  });
  console.log('✅ createdAt locations');


  // Create OWNER user from environment variables
  console.log('👑 Creating OWNER user...');

  const ownerEmail = process.env.OWNER_EMAIL || '';
  const ownerName = process.env.OWNER_NAME || 'Owner';

  // Check if any users exist
  const existingUsers = await prisma.user.count();

  if (existingUsers === 0 && ownerEmail) {
    console.log('🔧 No users found, creating owner from environment variables...');

    const owner = await prisma.user.create({
      data: {
        email: ownerEmail.toLowerCase(),
        name: ownerName,
        role: UserRole.OWNER,
        authorities: ['*'], // Todos los permisos
      },
    });
    console.log('✅ Created OWNER user:', owner.email);

    // 🔑 Crear Account para database sessions
    await prisma.account.create({
      data: {
        userId: owner.id,
        type: "oauth",
        provider: "google",
        providerAccountId: `seed_${owner.id}`, // ID único para seed
      }
    });
    console.log('✅ Created Account for OWNER user (database sessions)');
  } else if (existingUsers === 0) {
    console.log('⚠️ No OWNER_EMAIL configured, skipping owner creation');
  } else {
    console.log('👤 Users already exist, skipping owner creation');
  }

  // Seed DanConfig configurations
  console.log('🥋 Seeding DanConfig configurations...');
  const danConfigs = [
    // Yonma (4 players) configurations - ACTUALIZADAS con nueva paleta de marca
    { rank: "新人", sanma: false, minPoints: 0, maxPoints: 50, firstPlace: 60, secondPlace: 30, thirdPlace: 0, fourthPlace: 0, isProtected: true, color: "#f3f4f6", cssClass: "rank-beginner", isLastRank: false },
    { rank: "9級", sanma: false, minPoints: 50, maxPoints: 100, firstPlace: 60, secondPlace: 30, thirdPlace: 0, fourthPlace: 0, isProtected: true, color: "#60a5fa", cssClass: "rank-kyu", isLastRank: false },
    { rank: "8級", sanma: false, minPoints: 100, maxPoints: 200, firstPlace: 60, secondPlace: 30, thirdPlace: 0, fourthPlace: 0, isProtected: true, color: "#60a5fa", cssClass: "rank-kyu", isLastRank: false },
    { rank: "7級", sanma: false, minPoints: 200, maxPoints: 300, firstPlace: 60, secondPlace: 30, thirdPlace: 0, fourthPlace: 0, isProtected: true, color: "#60a5fa", cssClass: "rank-kyu", isLastRank: false },
    { rank: "6級", sanma: false, minPoints: 300, maxPoints: 400, firstPlace: 60, secondPlace: 30, thirdPlace: 0, fourthPlace: 0, isProtected: true, color: "#3b82f6", cssClass: "rank-kyu", isLastRank: false },
    { rank: "5級", sanma: false, minPoints: 400, maxPoints: 500, firstPlace: 60, secondPlace: 30, thirdPlace: 0, fourthPlace: 0, isProtected: true, color: "#3b82f6", cssClass: "rank-kyu", isLastRank: false },
    { rank: "4級", sanma: false, minPoints: 500, maxPoints: 600, firstPlace: 60, secondPlace: 30, thirdPlace: 0, fourthPlace: 0, isProtected: true, color: "#3b82f6", cssClass: "rank-kyu", isLastRank: false },
    { rank: "3級", sanma: false, minPoints: 600, maxPoints: 700, firstPlace: 60, secondPlace: 30, thirdPlace: 0, fourthPlace: 0, isProtected: true, color: "#2563eb", cssClass: "rank-kyu", isLastRank: false },
    { rank: "2級", sanma: false, minPoints: 700, maxPoints: 850, firstPlace: 60, secondPlace: 30, thirdPlace: 0, fourthPlace: 0, isProtected: true, color: "#2563eb", cssClass: "rank-kyu", isLastRank: false },
    { rank: "1級", sanma: false, minPoints: 850, maxPoints: 1000, firstPlace: 60, secondPlace: 30, thirdPlace: 0, fourthPlace: -30, isProtected: true, color: "#1d4ed8", cssClass: "rank-kyu", isLastRank: false },
    { rank: "初段", sanma: false, minPoints: 1000, maxPoints: 1200, firstPlace: 60, secondPlace: 30, thirdPlace: 0, fourthPlace: -30, isProtected: true, color: "#10b981", cssClass: "rank-dan-low", isLastRank: false },
    { rank: "二段", sanma: false, minPoints: 1200, maxPoints: 1600, firstPlace: 60, secondPlace: 30, thirdPlace: 0, fourthPlace: -30, isProtected: false, color: "#10b981", cssClass: "rank-dan-low", isLastRank: false },
    { rank: "三段", sanma: false, minPoints: 1600, maxPoints: 2000, firstPlace: 60, secondPlace: 30, thirdPlace: 0, fourthPlace: -30, isProtected: false, color: "#10b981", cssClass: "rank-dan-low", isLastRank: false },
    { rank: "四段", sanma: false, minPoints: 2000, maxPoints: 2600, firstPlace: 60, secondPlace: 30, thirdPlace: -15, fourthPlace: -45, isProtected: false, color: "#f59e0b", cssClass: "rank-dan-mid", isLastRank: false },
    { rank: "五段", sanma: false, minPoints: 2600, maxPoints: 3200, firstPlace: 60, secondPlace: 30, thirdPlace: -15, fourthPlace: -45, isProtected: false, color: "#f59e0b", cssClass: "rank-dan-mid", isLastRank: false },
    { rank: "六段", sanma: false, minPoints: 3200, maxPoints: 4000, firstPlace: 60, secondPlace: 30, thirdPlace: -15, fourthPlace: -45, isProtected: false, color: "#f59e0b", cssClass: "rank-dan-mid", isLastRank: false },
    { rank: "七段", sanma: false, minPoints: 4000, maxPoints: 5000, firstPlace: 60, secondPlace: 30, thirdPlace: -30, fourthPlace: -60, isProtected: false, color: "#d97706", cssClass: "rank-dan-high", isLastRank: false },
    { rank: "八段", sanma: false, minPoints: 5000, maxPoints: 6000, firstPlace: 60, secondPlace: 30, thirdPlace: -30, fourthPlace: -60, isProtected: false, color: "#d97706", cssClass: "rank-dan-high", isLastRank: false },
    { rank: "九段", sanma: false, minPoints: 6000, maxPoints: 7500, firstPlace: 60, secondPlace: 30, thirdPlace: -30, fourthPlace: -75, isProtected: false, color: "#7c3aed", cssClass: "rank-dan-master", isLastRank: false },
    { rank: "十段", sanma: false, minPoints: 7500, maxPoints: 9000, firstPlace: 60, secondPlace: 30, thirdPlace: -45, fourthPlace: -75, isProtected: false, color: "#7c3aed", cssClass: "rank-dan-master", isLastRank: false },
    { rank: "神室王", sanma: false, minPoints: 9000, maxPoints: null, firstPlace: 60, secondPlace: 30, thirdPlace: -30, fourthPlace: -60, isProtected: true, color: "#6d28d9", cssClass: "rank-god", isLastRank: true },

    // Sanma (3 players) configurations - ACTUALIZADAS con nueva paleta de marca
    { rank: "新人", sanma: true, minPoints: 0, maxPoints: 60, firstPlace: 90, secondPlace: 0, thirdPlace: 0, fourthPlace: null, isProtected: true, color: "#f3f4f6", cssClass: "rank-beginner", isLastRank: false },
    { rank: "9級", sanma: true, minPoints: 60, maxPoints: 150, firstPlace: 90, secondPlace: 0, thirdPlace: 0, fourthPlace: null, isProtected: true, color: "#60a5fa", cssClass: "rank-kyu", isLastRank: false },
    { rank: "8級", sanma: true, minPoints: 150, maxPoints: 240, firstPlace: 90, secondPlace: 0, thirdPlace: 0, fourthPlace: null, isProtected: true, color: "#60a5fa", cssClass: "rank-kyu", isLastRank: false },
    { rank: "7級", sanma: true, minPoints: 240, maxPoints: 330, firstPlace: 90, secondPlace: 0, thirdPlace: 0, fourthPlace: null, isProtected: true, color: "#60a5fa", cssClass: "rank-kyu", isLastRank: false },
    { rank: "6級", sanma: true, minPoints: 330, maxPoints: 420, firstPlace: 90, secondPlace: 0, thirdPlace: 0, fourthPlace: null, isProtected: true, color: "#3b82f6", cssClass: "rank-kyu", isLastRank: false },
    { rank: "5級", sanma: true, minPoints: 420, maxPoints: 510, firstPlace: 90, secondPlace: 0, thirdPlace: 0, fourthPlace: null, isProtected: true, color: "#3b82f6", cssClass: "rank-kyu", isLastRank: false },
    { rank: "4級", sanma: true, minPoints: 510, maxPoints: 600, firstPlace: 90, secondPlace: 0, thirdPlace: 0, fourthPlace: null, isProtected: true, color: "#3b82f6", cssClass: "rank-kyu", isLastRank: false },
    { rank: "3級", sanma: true, minPoints: 600, maxPoints: 690, firstPlace: 90, secondPlace: 0, thirdPlace: 0, fourthPlace: null, isProtected: true, color: "#2563eb", cssClass: "rank-kyu", isLastRank: false },
    { rank: "2級", sanma: true, minPoints: 690, maxPoints: 810, firstPlace: 90, secondPlace: 0, thirdPlace: 0, fourthPlace: null, isProtected: true, color: "#2563eb", cssClass: "rank-kyu", isLastRank: false },
    { rank: "1級", sanma: true, minPoints: 810, maxPoints: 930, firstPlace: 90, secondPlace: 0, thirdPlace: 0, fourthPlace: null, isProtected: true, color: "#1d4ed8", cssClass: "rank-kyu", isLastRank: false },
    { rank: "初段", sanma: true, minPoints: 930, maxPoints: 1080, firstPlace: 90, secondPlace: 0, thirdPlace: 0, fourthPlace: null, isProtected: true, color: "#10b981", cssClass: "rank-dan-low", isLastRank: false },
    { rank: "二段", sanma: true, minPoints: 1080, maxPoints: 1380, firstPlace: 90, secondPlace: 0, thirdPlace: -30, fourthPlace: null, isProtected: false, color: "#10b981", cssClass: "rank-dan-low", isLastRank: false },
    { rank: "三段", sanma: true, minPoints: 1380, maxPoints: 1680, firstPlace: 90, secondPlace: 0, thirdPlace: -30, fourthPlace: null, isProtected: false, color: "#10b981", cssClass: "rank-dan-low", isLastRank: false },
    { rank: "四段", sanma: true, minPoints: 1680, maxPoints: 2280, firstPlace: 90, secondPlace: 0, thirdPlace: -60, fourthPlace: null, isProtected: false, color: "#f59e0b", cssClass: "rank-dan-mid", isLastRank: false },
    { rank: "五段", sanma: true, minPoints: 2280, maxPoints: 2880, firstPlace: 90, secondPlace: 0, thirdPlace: -60, fourthPlace: null, isProtected: false, color: "#f59e0b", cssClass: "rank-dan-mid", isLastRank: false },
    { rank: "六段", sanma: true, minPoints: 2880, maxPoints: 3780, firstPlace: 90, secondPlace: 0, thirdPlace: -60, fourthPlace: null, isProtected: false, color: "#f59e0b", cssClass: "rank-dan-mid", isLastRank: false },
    { rank: "七段", sanma: true, minPoints: 3780, maxPoints: 4680, firstPlace: 90, secondPlace: 0, thirdPlace: -90, fourthPlace: null, isProtected: false, color: "#d97706", cssClass: "rank-dan-high", isLastRank: false },
    { rank: "八段", sanma: true, minPoints: 4680, maxPoints: 5580, firstPlace: 90, secondPlace: 0, thirdPlace: -90, fourthPlace: null, isProtected: false, color: "#d97706", cssClass: "rank-dan-high", isLastRank: false },
    { rank: "九段", sanma: true, minPoints: 5580, maxPoints: 6780, firstPlace: 90, secondPlace: 0, thirdPlace: -120, fourthPlace: null, isProtected: false, color: "#7c3aed", cssClass: "rank-dan-master", isLastRank: false },
    { rank: "十段", sanma: true, minPoints: 6780, maxPoints: 7980, firstPlace: 90, secondPlace: 0, thirdPlace: -150, fourthPlace: null, isProtected: false, color: "#7c3aed", cssClass: "rank-dan-master", isLastRank: false },
    { rank: "神室王", sanma: true, minPoints: 7980, maxPoints: null, firstPlace: 90, secondPlace: 0, thirdPlace: -90, fourthPlace: null, isProtected: true, color: "#6d28d9", cssClass: "rank-god", isLastRank: true },
  ];

  for (const config of danConfigs) {
    await (prisma as any).danConfig.upsert({
      where: { rank_sanma: { rank: config.rank, sanma: config.sanma } },
      update: {},
      create: config,
    });
  }
  console.log(`✅ createdAt ${danConfigs.length} DanConfig entries`);

  // Seed RateConfig configurations
  console.log('📊 Seeding RateConfig configurations...');
  const rateConfigs = [
    {
      name: "Standard Yonma",
      sanma: false,
      firstPlace: 30,
      secondPlace: 10,
      thirdPlace: -10,
      fourthPlace: -30,
      adjustmentRate: 0.002,
      adjustmentLimit: 400,
      minAdjustment: 0.2,
    },
    {
      name: "Standard Sanma",
      sanma: true,
      firstPlace: 30,
      secondPlace: 0,
      thirdPlace: -30,
      fourthPlace: null,
      adjustmentRate: 0.002,
      adjustmentLimit: 400,
      minAdjustment: 0.2,
    },
  ];

  for (const config of rateConfigs) {
    await (prisma as any).rateConfig.upsert({
      where: { name_sanma: { name: config.name, sanma: config.sanma } },
      update: {},
      create: config,
    });
  }
  console.log(`✅ createdAt ${rateConfigs.length} RateConfig entries`);

  // Seed SeasonConfig configurations
  console.log('🏆 Seeding SeasonConfig configurations...');
  const seasonConfigs = [
    {
      name: "Default Yonma",
      sanma: false,
      firstPlace: 15,
      secondPlace: 5,
      thirdPlace: -5,
      fourthPlace: -15,
      seasonId: null, // Configuraciones default (no específicas de temporada)
      isDefault: true,
    },
    {
      name: "Default Sanma",
      sanma: true,
      firstPlace: 15,
      secondPlace: 0,
      thirdPlace: -15,
      fourthPlace: null,
      seasonId: null, // Configuraciones default (no específicas de temporada)
      isDefault: true,
    },
  ];

  for (const config of seasonConfigs) {
    // Verificar si ya existe
    const existing = await (prisma as any).seasonConfig.findFirst({
      where: {
        name: config.name,
        sanma: config.sanma,
        seasonId: config.seasonId
      }
    });

    if (!existing) {
      await (prisma as any).seasonConfig.create({
        data: config,
      });
    }
  }
  console.log(`✅ createdAt ${seasonConfigs.length} SeasonConfig entries`);

  // Link existing games to seasons by date ranges
  console.log('🗓️ Linking games to seasons by date...');
  const linkRanges: Array<{ from: string; to: string; seasonId: number | null }> = [
    { from: '2016-09-03', to: '2017-07-11', seasonId: await getSeasonIdByName('Temporada 1') },
    { from: '2017-07-12', to: '2017-12-17', seasonId: await getSeasonIdByName('Temporada 2') },
    { from: '2017-12-18', to: '2018-12-31', seasonId: await getSeasonIdByName('Temporada 3') },
    { from: '2019-01-01', to: '2020-08-15', seasonId: await getSeasonIdByName('Temporada 4') },
    { from: '2020-08-16', to: '2023-12-31', seasonId: await getSeasonIdByName('Temporada 5') },
    { from: '2024-01-01', to: '2025-12-31', seasonId: await getSeasonIdByName('Temporada 2024/2025') },
  ];
  for (const r of linkRanges) {
    if (!r.seasonId) {
      console.log(`⚠️ Season not found for range ${r.from} to ${r.to}, skipping...`);
      continue;
    }
    await prisma.game.updateMany({
      where: {
        gameDate: {
          gte: new Date(r.from),
          lte: new Date(r.to),
        },
      },
      data: { seasonId: r.seasonId },
    });
  }
  console.log('✅ Games linked to seasons');

  // TEMPORARILY COMMENTED OUT - GAME LOADING FOR TESTING
  // console.log('🎮 Loading games from CSV files...');
  // ... resto del código de carga de juegos comentado

  console.log('🎉 Database seeded successfully!');
  */ // END OF COMMENTED TOURNAMENT RESULTS SECTION
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
