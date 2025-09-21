# 🏗️ Arquitectura del Proyecto CARM

## 📋 Índice

1. [Estructura del Proyecto](#estructura-del-proyecto)
2. [Patrones Implementados](#patrones-implementados)
3. [Organización de Componentes](#organización-de-componentes)
4. [Sistema de APIs](#sistema-de-apis)
5. [Gestión de Estado](#gestión-de-estado)
6. [Base de Datos](#base-de-datos)
7. [Autenticación y Autorización](#autenticación-y-autorización)
8. [Internacionalización](#internacionalización)
9. [Sistema de Notificaciones](#sistema-de-notificaciones)
10. [Patrones de UI](#patrones-de-ui)

---

## 📁 Estructura del Proyecto

### **Estructura Actual**

```
carm-rank/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Route groups
│   │   ├── signin/
│   │   └── error/
│   ├── admin/                    # Panel de administración
│   │   ├── abm/                  # Operaciones CRUD
│   │   │   ├── players/
│   │   │   ├── games/
│   │   │   ├── tournaments/
│   │   │   └── seasons/
│   │   ├── games/
│   │   ├── seasons/
│   │   ├── statistics/
│   │   └── users/
│   ├── api/                      # API routes
│   │   ├── abm/                  # APIs CRUD
│   │   ├── auth/                 # Autenticación
│   │   ├── games/                # APIs de juegos
│   │   ├── players/              # APIs de jugadores
│   │   │   └── [legajo]/
│   │   │       ├── profile/
│   │   │       └── history/
│   │   ├── ranking/              # APIs de ranking
│   │   ├── seasons/              # APIs de temporadas
│   │   └── tournaments/          # APIs de torneos
│   ├── history/                  # Historial de juegos
│   ├── player/[legajo]/          # Rutas dinámicas de jugadores
│   ├── reference/                # Páginas de referencia
│   │   └── dan-system/
│   ├── seasons/                  # Páginas de temporadas
│   └── tournaments/[id]/         # Páginas de torneos
├── components/                    # Componentes React
│   ├── admin/                    # Componentes específicos de admin
│   ├── auth/                     # Componentes de autenticación
│   │   └── route-guard.tsx
│   ├── players/                  # Componentes relacionados con jugadores
│   │   ├── player-multi-autocomplete.tsx
│   │   ├── player-single-combobox.tsx
│   │   └── players-picker.tsx
│   ├── providers/                # Context providers
│   │   ├── i18n-provider.tsx
│   │   ├── notification-provider.tsx
│   │   └── theme-provider.tsx
│   ├── shared/                   # Componentes compartidos
│   ├── ui/                       # Componentes base de UI
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── toggle-group.tsx
│   │   ├── hero-stat-card.tsx
│   │   ├── historical-chart.tsx
│   │   ├── player-profile-header.tsx
│   │   ├── player-stats-section.tsx
│   │   ├── sticky-player-header.tsx
│   │   ├── unified-player-card.tsx
│   │   └── edit-player-modal.tsx
│   ├── floating-nav.tsx
│   ├── footer.tsx
│   ├── main-navigation.tsx
│   ├── player-profile.tsx
│   ├── player-profile-new.tsx
│   ├── rank-table.tsx
│   └── server-monitor.tsx
├── hooks/                        # Custom hooks
│   ├── use-abm-operations.ts
│   ├── use-auth-guard.ts
│   ├── use-auth.ts
│   ├── use-effect-once-dev-safe.ts
│   ├── use-enum-i18n.ts
│   ├── use-error-handler.ts
│   ├── use-global-error-boundary.ts
│   └── use-role-assignment.ts
├── lib/                          # Utilidades principales
│   ├── api/
│   │   └── client.ts
│   ├── auth.ts
│   ├── authorization-hierarchy.ts
│   ├── authorization.ts
│   ├── calculations-real.ts
│   ├── config-cache.ts
│   ├── config-initializer.ts
│   ├── countryFlags.ts
│   ├── crypto-helper.js
│   ├── database/
│   │   ├── client.ts
│   │   └── migrations/
│   ├── email-service.ts
│   ├── enum/
│   │   ├── game-type.ts
│   │   ├── player-status.ts
│   │   ├── tournament-type.ts
│   │   └── user-role.ts
│   ├── format-utils.ts
│   ├── game-calculations.ts
│   ├── game-helpers-client.ts
│   ├── game-helpers.ts
│   ├── game-operations.ts
│   ├── game-type-utils.ts
│   ├── i18n/
│   │   ├── translations/
│   │   │   ├── es.json
│   │   │   └── en.json
│   │   └── index.ts
│   ├── image-cleanup-simple.ts
│   ├── image-storage.ts
│   ├── logger.ts
│   ├── model/
│   │   ├── player.ts
│   │   ├── game.ts
│   │   ├── tournament.ts
│   │   └── season.ts
│   ├── playerData.ts
│   ├── request-logger.ts
│   ├── server-authorization.ts
│   ├── services/
│   │   ├── game-service.ts
│   │   ├── player-service.ts
│   │   ├── ranking-service.ts
│   │   └── tournament-service.ts
│   ├── terminal-logger.ts
│   └── utils.ts
├── prisma/                       # Schema y migraciones de DB
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
├── public/                       # Assets estáticos
│   ├── images/
│   ├── carm-logo.png
│   └── logo_riichi_mahjong.png
├── docs/                         # Documentación
│   ├── COLOR_SYSTEM.md
│   ├── I18N_SYSTEM.md
│   ├── RANK_BADGES_SYSTEM.md
│   ├── TOAST_SYSTEM.md
│   ├── TYPOGRAPHY_SYSTEM.md
│   ├── REACT_NEXTJS_PATTERNS.md
│   └── CARM_ARCHITECTURE.md
└── scripts/                      # Scripts de utilidad
    ├── migration.sql
    └── data-processing/
```

---

## 🎨 Patrones Implementados

### **1. Feature-Based Architecture**

El proyecto está organizado por funcionalidades específicas:

```typescript
// Ejemplo: Feature de Players
components/players/           # Componentes específicos
├── player-multi-autocomplete.tsx
├── player-single-combobox.tsx
└── players-picker.tsx

app/player/[legajo]/         # Rutas específicas
└── page.tsx

app/api/players/             # APIs específicas
├── [legajo]/
│   ├── profile/route.ts
│   └── history/route.ts
└── route.ts

lib/services/                # Servicios específicos
└── player-service.ts
```

### **2. Layered Architecture**

```
┌─────────────────────────────────────┐
│           Presentation Layer        │  ← components/, app/
├─────────────────────────────────────┤
│           Business Logic Layer      │  ← lib/services/, hooks/
├─────────────────────────────────────┤
│           Data Access Layer         │  ← lib/database/, prisma/
├─────────────────────────────────────┤
│           Infrastructure Layer      │  ← lib/api/, external services
└─────────────────────────────────────┘
```

### **3. Component Composition Pattern**

```typescript
// Ejemplo: UnifiedPlayerCard
<UnifiedPlayerCard
  playerData={playerData}
  stats={stats}
  onEditProfile={handleEdit}
>
  <PlayerProfileHeader />
  <PlayerStatsSection />
  <HistoricalChart />
</UnifiedPlayerCard>
```

### **4. Provider Pattern para Contexto Global**

```typescript
// lib/providers/i18n-provider.tsx
export function I18nProvider({ children }) {
  const [locale, setLocale] = useState('es');
  const [translations, setTranslations] = useState({});
  
  const value = {
    locale,
    setLocale,
    t: (key: string) => translations[key] || key
  };
  
  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}
```

---

## 🧩 Organización de Componentes

### **Jerarquía de Componentes**

```
components/
├── ui/                          # Componentes base (atoms)
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   └── dialog.tsx
├── shared/                      # Componentes compartidos (molecules)
│   ├── navigation.tsx
│   └── footer.tsx
├── features/                    # Componentes de funcionalidad (organisms)
│   ├── players/
│   ├── games/
│   └── tournaments/
└── pages/                       # Componentes de página (templates)
    ├── player-profile.tsx
    └── admin-dashboard.tsx
```

### **Patrón de Componentes Específicos**

#### **1. Sticky Header Pattern**

```typescript
// components/ui/sticky-player-header.tsx
function StickyPlayerHeader({
  nickname,
  isSanma,
  onSanmaChange,
  gameTypeFilter,
  setGameTypeFilter
}) {
  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur">
      {/* Contenido del header persistente */}
    </div>
  );
}
```

#### **2. Modal Pattern**

```typescript
// components/ui/edit-player-modal.tsx
function EditPlayerModal({
  isOpen,
  onClose,
  playerData,
  onSave
}) {
  // Lógica del modal con validaciones
}
```

#### **3. Card Pattern**

```typescript
// components/ui/hero-stat-card.tsx
interface HeroStatCardProps {
  title: string;
  value: string | number;
  delta?: {
    value: number;
    period: string;
    trend: 'up' | 'down' | 'neutral';
  };
  badge?: string | number;
}
```

---

## 🌐 Sistema de APIs

### **Estructura de API Routes**

```typescript
app/api/
├── abm/                         # CRUD operations
│   ├── players/route.ts
│   ├── games/route.ts
│   └── tournaments/route.ts
├── auth/                        # Authentication
│   ├── signin/route.ts
│   └── callback/route.ts
├── players/                     # Player-specific APIs
│   └── [legajo]/
│       ├── profile/route.ts
│       └── history/route.ts
└── ranking/                     # Ranking APIs
    └── route.ts
```

### **Patrón de API Response**

```typescript
// Ejemplo: app/api/players/[legajo]/profile/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { legajo: string } }
) {
  try {
    // Validación
    const legajo = parseInt(params.legajo);
    if (isNaN(legajo)) {
      return NextResponse.json(
        { error: 'Legajo inválido' },
        { status: 400 }
      );
    }
    
    // Lógica de negocio
    const player = await prisma.player.findUnique({
      where: { legajo },
      include: {
        games: true,
        tournaments: true
      }
    });
    
    if (!player) {
      return NextResponse.json(
        { error: 'Jugador no encontrado' },
        { status: 404 }
      );
    }
    
    // Respuesta exitosa
    return NextResponse.json({
      success: true,
      data: player
    });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
```

### **Middleware de Autenticación**

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token');
  
  // Proteger rutas de admin
  if (request.nextUrl.pathname.startsWith('/admin') && !token) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }
  
  return NextResponse.next();
}
```

---

## 🔄 Gestión de Estado

### **1. Estado Local con useState**

```typescript
// Para estado simple de componentes
const [isSanma, setIsSanma] = useState<boolean>(false);
const [chartType, setChartType] = useState<'dan' | 'rate' | 'position' | 'season'>('dan');
const [submitting, setSubmitting] = useState(false);
```

### **2. Estado Global con Context**

```typescript
// lib/providers/i18n-provider.tsx
const I18nContext = createContext();

export function I18nProvider({ children }) {
  const [locale, setLocale] = useState('es');
  const [translations, setTranslations] = useState({});
  
  const value = {
    locale,
    setLocale,
    t: (key: string) => translations[key] || key
  };
  
  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}
```

### **3. Custom Hooks para Lógica de Estado**

```typescript
// hooks/use-player-stats.ts
export function usePlayerStats(playerId: string) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch(`/api/players/${playerId}/stats`);
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchStats();
  }, [playerId]);
  
  return { stats, loading, error };
}
```

---

## 🗄️ Base de Datos

### **Schema de Prisma**

```prisma
// prisma/schema.prisma
model Player {
  id        Int      @id @default(autoincrement())
  legajo    Int      @unique
  nickname  String
  fullname  String?
  country   String?
  birthday  DateTime?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relaciones
  games     GameResult[]
  tournaments TournamentResult[]
  userLinks UserPlayerLink[]
}

model Game {
  id        Int      @id @default(autoincrement())
  date      DateTime
  isSanma   Boolean  @default(false)
  rulesetId Int
  ruleset   Ruleset  @relation(fields: [rulesetId], references: [id])
  results   GameResult[]
}

model Tournament {
  id        Int      @id @default(autoincrement())
  name      String
  date      DateTime
  isSanma   Boolean  @default(false)
  results   TournamentResult[]
}
```

### **Repository Pattern con Prisma**

```typescript
// lib/database/client.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### **Migrations y Seeding**

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Crear temporadas
  const season1 = await prisma.season.create({
    data: {
      name: 'Temporada 1',
      startDate: new Date('2016-01-01'),
      endDate: new Date('2017-12-31')
    }
  });
  
  // Crear jugadores de ejemplo
  const players = await Promise.all([
    prisma.player.create({
      data: {
        legajo: 1,
        nickname: 'Player1',
        fullname: 'Jugador Uno',
        country: 'AR',
        isActive: true
      }
    }),
    // ... más jugadores
  ]);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## 🔐 Autenticación y Autorización

### **Sistema de Autenticación**

```typescript
// lib/auth-vercel.ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // Lógica de autenticación
        const user = await authenticateUser(credentials);
        return user;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role;
      return session;
    }
  }
};
```

### **Sistema de Autorización**

```typescript
// lib/authorization.ts
export enum UserRole {
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  USER = 'USER'
}

export const ROLE_PERMISSIONS = {
  [UserRole.ADMIN]: [
    'read:admin',
    'write:admin',
    'read:players',
    'write:players',
    'read:games',
    'write:games'
  ],
  [UserRole.MODERATOR]: [
    'read:players',
    'write:players',
    'read:games',
    'write:games'
  ],
  [UserRole.USER]: [
    'read:players',
    'read:games'
  ]
};

export function hasPermission(user: User, action: string, resource: string): boolean {
  const userRole = user.role;
  const permissions = ROLE_PERMISSIONS[userRole];
  return permissions.includes(`${action}:${resource}`);
}
```

### **Route Guards**

```typescript
// components/auth/route-guard.tsx
export function RouteGuard({ 
  children, 
  requiredRole 
}: { 
  children: React.ReactNode;
  requiredRole?: UserRole;
}) {
  const { data: session, status } = useSession();
  
  if (status === 'loading') {
    return <div>Cargando...</div>;
  }
  
  if (!session) {
    return <div>No autorizado</div>;
  }
  
  if (requiredRole && !hasPermission(session.user, 'read', requiredRole)) {
    return <div>No tienes permisos</div>;
  }
  
  return <>{children}</>;
}
```

---

## 🌍 Internacionalización

### **Sistema de Traducciones**

```typescript
// lib/i18n/translations/es.json
{
  "common": {
    "loading": "Cargando...",
    "error": "Error",
    "success": "Éxito",
    "save": "Guardar",
    "cancel": "Cancelar",
    "edit": "Editar",
    "delete": "Eliminar"
  },
  "player": {
    "profilePage": {
      "active": "Activo",
      "inactive": "Inactivo",
      "editProfile": "Editar Perfil",
      "youAreLinked": "Ud está vinculado a este jugador",
      "linkPlayer": "Vincular Jugador"
    }
  },
  "admin": {
    "dashboard": {
      "title": "Panel de Administración",
      "totalPlayers": "Total de Jugadores",
      "totalGames": "Total de Juegos"
    }
  }
}
```

### **Provider de Internacionalización**

```typescript
// components/providers/i18n-provider.tsx
const I18nContext = createContext();

export function I18nProvider({ children }) {
  const [locale, setLocale] = useState('es');
  const [translations, setTranslations] = useState({});
  
  useEffect(() => {
    async function loadTranslations() {
      const translationModule = await import(`@/lib/i18n/translations/${locale}.json`);
      setTranslations(translationModule.default);
    }
    
    loadTranslations();
  }, [locale]);
  
  const t = useCallback((key: string, fallback?: string) => {
    return translations[key] || fallback || key;
  }, [translations]);
  
  const value = {
    locale,
    setLocale,
    t
  };
  
  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}
```

### **Hook de Internacionalización**

```typescript
// hooks/use-enum-i18n.ts
export function useEnumI18n() {
  const { t } = useI18nContext();
  
  const translateEnum = useCallback((enumKey: string, value: string) => {
    return t(`enums.${enumKey}.${value}`, value);
  }, [t]);
  
  return { translateEnum };
}
```

---

## 🔔 Sistema de Notificaciones

### **Provider de Notificaciones**

```typescript
// components/providers/notification-provider.tsx
interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { ...notification, id }]);
    
    // Auto-remove after duration
    setTimeout(() => {
      removeNotification(id);
    }, notification.duration || 5000);
  }, []);
  
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);
  
  return (
    <NotificationContext.Provider value={{ addNotification, removeNotification }}>
      {children}
      <NotificationContainer notifications={notifications} />
    </NotificationContext.Provider>
  );
}
```

### **Hook de Manejo de Errores**

```typescript
// hooks/use-error-handler.ts
export function useErrorHandler() {
  const { addNotification } = useNotifications();
  
  const handleError = useCallback((error: any, context: string) => {
    console.error(`Error in ${context}:`, error);
    
    addNotification({
      type: 'error',
      title: 'Error',
      message: `${context}: ${error.message || 'Error desconocido'}`,
      duration: 5000
    });
  }, [addNotification]);
  
  const handleSuccess = useCallback((message: string, title?: string) => {
    addNotification({
      type: 'success',
      title: title || 'Éxito',
      message,
      duration: 3000
    });
  }, [addNotification]);
  
  return { handleError, handleSuccess };
}
```

---

## 🎨 Patrones de UI

### **1. Design System**

```typescript
// Sistema de colores
const colors = {
  primary: {
    50: '#eff6ff',
    500: '#3b82f6',
    900: '#1e3a8a'
  },
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    900: '#14532d'
  },
  error: {
    50: '#fef2f2',
    500: '#ef4444',
    900: '#7f1d1d'
  }
};

// Sistema de tipografía
const typography = {
  h1: 'text-4xl font-bold',
  h2: 'text-3xl font-semibold',
  h3: 'text-2xl font-medium',
  body: 'text-base',
  caption: 'text-sm text-muted-foreground'
};
```

### **2. Componente de Cards**

```typescript
// components/ui/hero-stat-card.tsx
interface HeroStatCardProps {
  title: string;
  value: string | number;
  delta?: {
    value: number;
    period: string;
    trend: 'up' | 'down' | 'neutral';
  };
  badge?: string | number;
  className?: string;
}

export function HeroStatCard({ 
  title, 
  value, 
  delta, 
  badge, 
  className 
}: HeroStatCardProps) {
  return (
    <Card className={cn('p-6', className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {delta && (
            <div className="flex items-center text-sm">
              <span className={getDeltaColor(delta.trend)}>
                {delta.trend === 'up' ? '↗' : delta.trend === 'down' ? '↘' : '→'}
                {delta.value}
              </span>
              <span className="text-muted-foreground ml-1">{delta.period}</span>
            </div>
          )}
        </div>
        {badge && (
          <Badge variant="secondary">{badge}</Badge>
        )}
      </div>
    </Card>
  );
}
```

### **3. Sistema de Filtros**

```typescript
// components/ui/toggle-group.tsx
<ToggleGroup
  type="single"
  value={selectedValue}
  onValueChange={setSelectedValue}
  className="rounded-full bg-muted p-1 border"
>
  <ToggleGroupItem value="option1">Opción 1</ToggleGroupItem>
  <ToggleGroupItem value="option2">Opción 2</ToggleGroupItem>
</ToggleGroup>
```

### **4. Gráficos Interactivos**

```typescript
// components/ui/historical-chart.tsx
interface HistoricalChartProps {
  chartData: ChartDataPoint[];
  seasonData?: ChartDataPoint[];
  isSanma?: boolean;
  chartType?: 'dan' | 'rate' | 'position' | 'season';
  onChartTypeChange?: (type: string) => void;
}

export function HistoricalChart({
  chartData,
  seasonData = [],
  isSanma = false,
  chartType = 'dan',
  onChartTypeChange
}: HistoricalChartProps) {
  // Lógica del gráfico con SVG
  return (
    <div className="w-full h-64">
      <svg viewBox="0 0 800 200" className="w-full h-full">
        {/* Lógica de renderizado del gráfico */}
      </svg>
    </div>
  );
}
```

---

## 🧪 Testing

### **Estructura de Testing**

```
__tests__/
├── components/
│   ├── ui/
│   │   ├── button.test.tsx
│   │   └── card.test.tsx
│   └── features/
│       └── player-profile.test.tsx
├── api/
│   ├── players.test.ts
│   └── auth.test.ts
├── hooks/
│   └── use-player-stats.test.ts
└── utils/
    └── format-utils.test.ts
```

### **Ejemplo de Test de Componente**

```typescript
// __tests__/components/ui/hero-stat-card.test.tsx
import { render, screen } from '@testing-library/react';
import { HeroStatCard } from '@/components/ui/hero-stat-card';

describe('HeroStatCard', () => {
  it('should render title and value', () => {
    render(
      <HeroStatCard 
        title="Dan Points" 
        value="1500" 
      />
    );
    
    expect(screen.getByText('Dan Points')).toBeInTheDocument();
    expect(screen.getByText('1500')).toBeInTheDocument();
  });
  
  it('should render delta with trend', () => {
    render(
      <HeroStatCard 
        title="Dan Points" 
        value="1500"
        delta={{
          value: 50,
          period: 'vs 30 días',
          trend: 'up'
        }}
      />
    );
    
    expect(screen.getByText('↗50')).toBeInTheDocument();
    expect(screen.getByText('vs 30 días')).toBeInTheDocument();
  });
});
```

---

## 🚀 Performance

### **Optimizaciones Implementadas**

#### **1. Lazy Loading**

```typescript
// components/lazy-components.tsx
import { lazy, Suspense } from 'react';

const HeavyChart = lazy(() => import('./heavy-chart'));

function ChartContainer() {
  return (
    <Suspense fallback={<div>Cargando gráfico...</div>}>
      <HeavyChart />
    </Suspense>
  );
}
```

#### **2. Memoización**

```typescript
// hooks/use-player-stats.ts
export function usePlayerStats(playerId: string) {
  const [stats, setStats] = useState(null);
  
  const memoizedStats = useMemo(() => {
    if (!stats) return null;
    
    return {
      currentDan: calculateCurrentDan(stats.games),
      currentRate: calculateCurrentRate(stats.games),
      maxRate: Math.max(...stats.games.map(g => g.rate))
    };
  }, [stats]);
  
  return memoizedStats;
}
```

#### **3. Server Components**

```typescript
// app/player/[legajo]/page.tsx
// Server Component que obtiene datos en el servidor
export default async function PlayerPage({ params }) {
  const player = await prisma.player.findUnique({
    where: { legajo: parseInt(params.legajo) }
  });
  
  return <PlayerProfile player={player} />;
}
```

---

## 🔧 Configuración y Deployment

### **Variables de Entorno**

```typescript
// lib/config.ts
export const config = {
  database: {
    url: process.env.DATABASE_URL!,
  },
  auth: {
    secret: process.env.NEXTAUTH_SECRET!,
    url: process.env.NEXTAUTH_URL!,
  },
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  },
  features: {
    enableNotifications: process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS === 'true',
    enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  }
};
```

### **Next.js Configuration**

```typescript
// next.config.mjs
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  images: {
    domains: ['example.com'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
};

export default nextConfig;
```

---

## 📊 Monitoreo y Logging

### **Sistema de Logging**

```typescript
// lib/logger.ts
export class Logger {
  static info(message: string, meta?: any) {
    console.log(`[INFO] ${message}`, meta);
  }
  
  static error(message: string, error?: Error, meta?: any) {
    console.error(`[ERROR] ${message}`, error, meta);
  }
  
  static warn(message: string, meta?: any) {
    console.warn(`[WARN] ${message}`, meta);
  }
}

// Uso en APIs
export async function GET() {
  try {
    Logger.info('Fetching players');
    const players = await prisma.player.findMany();
    return NextResponse.json(players);
  } catch (error) {
    Logger.error('Failed to fetch players', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## 🎯 Checklist de Implementación

### **Arquitectura General**
- [ ] ¿Está separada la lógica de negocio de la presentación?
- [ ] ¿Son claras las responsabilidades de cada capa?
- [ ] ¿Es fácil de testear?
- [ ] ¿Es escalable?

### **Componentes**
- [ ] ¿Siguen el patrón de composición?
- [ ] ¿Están bien tipados con TypeScript?
- [ ] ¿Tienen tests unitarios?
- [ ] ¿Siguen las convenciones de naming?

### **APIs**
- [ ] ¿Tienen validación de entrada?
- [ ] ¿Manejan errores correctamente?
- [ ] ¿Están documentadas?
- [ ] ¿Tienen tests de integración?

### **Base de Datos**
- [ ] ¿Está normalizada correctamente?
- [ ] ¿Tiene índices apropiados?
- [ ] ¿Las migraciones son reversibles?
- [ ] ¿Está respaldada regularmente?

### **Seguridad**
- [ ] ¿Está implementada la autenticación?
- [ ] ¿Hay autorización por roles?
- [ ] ¿Se validan todos los inputs?
- [ ] ¿Están protegidas las rutas sensibles?

### **Performance**
- [ ] ¿Están optimizadas las consultas de DB?
- [ ] ¿Se usa lazy loading donde corresponde?
- [ ] ¿Están memoizados los cálculos pesados?
- [ ] ¿Se implementa caché apropiadamente?

### **Internacionalización**
- [ ] ¿Están todas las strings traducidas?
- [ ] ¿Se maneja correctamente el cambio de idioma?
- [ ] ¿Están los archivos de traducción organizados?
- [ ] ¿Se valida la consistencia de traducciones?

---

*Esta documentación de arquitectura del proyecto CARM debe ser actualizada según los cambios en la estructura y las nuevas funcionalidades implementadas.*
