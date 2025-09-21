# 🤖 Guía de Código para IA - Proyecto CARM

## 📋 Patrones y Convenciones a Seguir

### **🏗️ Arquitectura del Proyecto**

#### **Estructura en Capas**
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

#### **Feature-Based Organization**
- **components/players/** - Componentes específicos de jugadores
- **app/player/[legajo]/** - Rutas dinámicas de jugadores
- **app/api/players/** - APIs específicas de jugadores
- **lib/services/player-service.ts** - Servicios de jugadores

### **🧩 Patrones de Componentes**

#### **1. Component Composition Pattern**
```typescript
// ✅ Usar composición de componentes
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

#### **2. Provider Pattern para Contexto Global**
```typescript
// ✅ Usar providers para estado global
<I18nProvider>
  <NotificationProvider>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </NotificationProvider>
</I18nProvider>
```

#### **3. Custom Hooks para Lógica de Estado**
```typescript
// ✅ Extraer lógica en custom hooks
function usePlayerStats(playerId: string) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Lógica del hook
  return { stats, loading, error };
}
```

### **🎨 Convenciones de Naming**

#### **Archivos y Carpetas**
- **Componentes**: `PascalCase` (ej: `PlayerProfile.tsx`)
- **Hooks**: `camelCase` con prefijo `use` (ej: `usePlayerStats.ts`)
- **Utilidades**: `camelCase` (ej: `formatUtils.ts`)
- **Archivos**: `kebab-case` (ej: `player-profile.tsx`)
- **Constantes**: `UPPER_SNAKE_CASE` (ej: `API_BASE_URL`)
- **Archivos de Testing**: `[temp]` en el nombre (ej: `[temp]test-player-data.js`, `[temp]debug-calculations.ts`)

#### **Variables y Funciones**
```typescript
// ✅ Correcto
const userName = 'john';
const isPlayerActive = true;
function calculatePlayerStats() {}

// ❌ Incorrecto
const user_name = 'john';
const isplayeractive = true;
function CalculatePlayerStats() {}
```

### **🔧 Patrones de API**

#### **Estructura de API Routes**
```typescript
// ✅ Patrón estándar para APIs
export async function GET(
  request: NextRequest,
  { params }: { params: { legajo: string } }
) {
  try {
    // 1. Validación de parámetros
    const legajo = parseInt(params.legajo);
    if (isNaN(legajo)) {
      return NextResponse.json(
        { error: 'Legajo inválido' },
        { status: 400 }
      );
    }
    
    // 2. Lógica de negocio
    const player = await prisma.player.findUnique({
      where: { legajo }
    });
    
    // 3. Respuesta exitosa
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

### **🔄 Gestión de Estado**

#### **Estado Local**
```typescript
// ✅ Para estado simple de componentes
const [isSanma, setIsSanma] = useState<boolean>(false);
const [chartType, setChartType] = useState<'dan' | 'rate' | 'position' | 'season'>('dan');
const [submitting, setSubmitting] = useState(false);
```

#### **Estado Global con Context**
```typescript
// ✅ Usar context para estado global
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

### **🌍 Internacionalización**

#### **Sistema de Traducciones**
```typescript
// ✅ Siempre usar i18n para strings
const { t } = useI18nContext();

return (
  <div>
    <h1>{t('player.profilePage.title')}</h1>
    <button>{t('common.save')}</button>
  </div>
);
```

#### **Estructura de Traducciones**
```json
{
  "common": {
    "loading": "Cargando...",
    "error": "Error",
    "success": "Éxito",
    "save": "Guardar",
    "cancel": "Cancelar"
  },
  "player": {
    "profilePage": {
      "active": "Activo",
      "inactive": "Inactivo",
      "editProfile": "Editar Perfil"
    }
  }
}
```

### **🔔 Sistema de Notificaciones**

#### **Hook de Manejo de Errores**
```typescript
// ✅ Usar useErrorHandler para notificaciones
const { handleError, handleSuccess } = useErrorHandler();

try {
  await savePlayer(playerData);
  handleSuccess('Jugador guardado exitosamente');
} catch (error) {
  handleError(error, 'Guardar jugador');
}
```

### **🎨 Patrones de UI**

#### **1. Consistencia en Selectores y Opciones**
```typescript
// ✅ Correcto: El valor seleccionado debe coincidir con las opciones
const countries = [
  { value: 'AR', label: 'Argentina' },
  { value: 'BR', label: 'Brasil' },
  { value: 'CL', label: 'Chile' }
];

// En el Select
<Select value={selectedCountry} onValueChange={setSelectedCountry}>
  <SelectTrigger>
    <SelectValue placeholder="Selecciona país" />
  </SelectTrigger>
  <SelectContent>
    {countries.map(country => (
      <SelectItem key={country.value} value={country.value}>
        {country.label}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

// ❌ Incorrecto: Mostrar código ISO cuando el usuario espera nombre del país
<SelectItem value="AR">AR</SelectItem>  // Usuario ve "AR" en lugar de "Argentina"

// ✅ Correcto: Mostrar nombre completo del país
<SelectItem value="AR">Argentina</SelectItem>
```

#### **2. Componentes Base**
```typescript
// ✅ Usar componentes base del design system
<Button variant="outline" size="sm">
  {t('common.cancel')}
</Button>

<Card className="p-6">
  <CardHeader>
    <CardTitle>{title}</CardTitle>
  </CardHeader>
  <CardContent>
    {children}
  </CardContent>
</Card>
```

#### **Sistema de Filtros**
```typescript
// ✅ Usar ToggleGroup para filtros
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

### **🗄️ Base de Datos**

#### **Repository Pattern con Prisma**
```typescript
// ✅ Usar el cliente Prisma singleton
import { prisma } from '@/lib/database/client';

const players = await prisma.player.findMany({
  include: {
    games: true,
    tournaments: true
  }
});
```

### **🔐 Autenticación y Autorización**

#### **Verificación de Permisos**
```typescript
// ✅ Verificar permisos antes de operaciones
const userPlayerLink = await prisma.userPlayerLink.findFirst({
  where: {
    userId: session.user.id,
    player: { legajo: legajo }
  }
});

if (!userPlayerLink) {
  return NextResponse.json(
    { error: 'No tienes permisos para editar este jugador' },
    { status: 403 }
  );
}
```

### **🧪 Testing**

#### **Estructura de Tests**
```typescript
// ✅ Patrón AAA (Arrange-Act-Assert)
describe('PlayerProfile', () => {
  it('should display player information', () => {
    // Arrange
    const mockPlayer = { id: 1, nickname: 'TestPlayer' };
    
    // Act
    render(<PlayerProfile player={mockPlayer} />);
    
    // Assert
    expect(screen.getByText('TestPlayer')).toBeInTheDocument();
  });
});
```

### **⚡ Performance**

#### **Optimizaciones**
```typescript
// ✅ Usar memoización para cálculos pesados
const memoizedStats = useMemo(() => {
  if (!stats) return null;
  
  return {
    currentDan: calculateCurrentDan(stats.games),
    currentRate: calculateCurrentRate(stats.games),
    maxRate: Math.max(...stats.games.map(g => g.rate))
  };
}, [stats]);

// ✅ Usar lazy loading para componentes pesados
const HeavyChart = lazy(() => import('./heavy-chart'));

// ✅ Usar Server Components cuando sea posible
export default async function PlayerPage({ params }) {
  const player = await prisma.player.findUnique({
    where: { legajo: parseInt(params.legajo) }
  });
  
  return <PlayerProfile player={player} />;
}
```

### **❌ Anti-patrones a Evitar**

#### **1. Props Drilling**
```typescript
// ❌ Malo: Props drilling
<App user={user} setUser={setUser}>
  <Main user={user} setUser={setUser}>
    <Content user={user} setUser={setUser} />
  </Main>
</App>

// ✅ Bueno: Context
<UserContext.Provider value={{ user, setUser }}>
  <App>
    <Main>
      <Content />
    </Main>
  </App>
</UserContext.Provider>
```

#### **2. Mutación Directa del Estado**
```typescript
// ❌ Malo: Mutación directa
const updateUser = (users, userId, updates) => {
  const user = users.find(u => u.id === userId);
  user.name = updates.name; // Mutación directa
  return users;
};

// ✅ Bueno: Inmutabilidad
const updateUser = (users, userId, updates) => {
  return users.map(user => 
    user.id === userId 
      ? { ...user, ...updates }
      : user
  );
};
```

#### **3. Efectos con Dependencias Incorrectas**
```typescript
// ❌ Malo: Dependencias faltantes
useEffect(() => {
  fetchUser(userId);
}, []); // Falta userId

// ✅ Bueno: Dependencias correctas
useEffect(() => {
  fetchUser(userId);
}, [userId]);
```

### **📝 Checklist de Implementación**

#### **Para cada componente:**
- [ ] ¿Sigue el patrón de composición?
- [ ] ¿Está bien tipado con TypeScript?
- [ ] ¿Usa i18n para todas las strings?
- [ ] ¿Sigue las convenciones de naming?
- [ ] ¿Tiene responsabilidad única?
- [ ] ¿Es reutilizable?

#### **Para cada API:**
- [ ] ¿Tiene validación de entrada?
- [ ] ¿Maneja errores correctamente?
- [ ] ¿Retorna respuestas consistentes?
- [ ] ¿Está documentada?

#### **Para cada feature:**
- [ ] ¿Está organizado en su propia carpeta?
- [ ] ¿Tiene sus propios tipos?
- [ ] ¿Tiene sus propios hooks?
- [ ] ¿Está desacoplado de otras features?

### **🧪 Archivos de Testing y Temporales**

#### **Convención de Naming para Testing**
```typescript
// ✅ Archivos de testing/debug con [temp]
[temp]test-player-calculations.js
[temp]debug-database-connection.ts
[temp]analyze-tournament-data.js
[temp]verify-i18n-translations.js

// ✅ Archivos de desarrollo con [dev]
[dev]experimental-feature.tsx
[dev]new-calculation-method.js

// ✅ Archivos de migración con [migration]
[migration]update-player-schema.sql
[migration]fix-tournament-data.js
```

#### **Gestión de Archivos Temporales**
```typescript
// ✅ Crear archivos temporales con [temp]
const tempFileName = `[temp]debug-${Date.now()}.js`;
const tempTestFile = `[temp]test-${featureName}.ts`;

// ✅ Documentar propósito en el archivo
/**
 * [TEMP] Archivo de testing para verificar cálculos de puntos
 * Fecha: 2024-01-15
 * Propósito: Debug de función puntajeDan
 * TODO: Eliminar después de verificar
 */
```

#### **Limpieza Automática**
```bash
# ✅ Comando para encontrar archivos temporales
find . -name "[temp]*" -type f

# ✅ Comando para eliminar archivos temporales
find . -name "[temp]*" -type f -delete

# ✅ Comando para encontrar archivos de desarrollo
find . -name "[dev]*" -type f
```

---

### **🎯 Patrones Específicos del Proyecto**

#### **1. Sticky Header Pattern**
```typescript
// components/ui/sticky-player-header.tsx
<div className="sticky top-0 z-50 bg-background/95 backdrop-blur">
  {/* Contenido del header persistente */}
</div>
```

#### **2. Modal Pattern**
```typescript
// components/ui/edit-player-modal.tsx
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>{t("player.profilePage.editProfile")}</DialogTitle>
    </DialogHeader>
    {/* Contenido del modal */}
  </DialogContent>
</Dialog>
```

#### **3. Card Pattern**
```typescript
// components/ui/hero-stat-card.tsx
<Card className="p-6">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
    {badge && <Badge variant="secondary">{badge}</Badge>}
  </div>
</Card>
```

---

## 🏗️ Guidelines de Arquitectura

### **📁 Estructura de Carpetas por Tamaño de Proyecto**

#### **Proyectos Pequeños-Medianos (como CARM)**
```
src/
├── app/                    # Next.js App Router
├── components/             # Componentes reutilizables
│   ├── ui/                # Componentes base (atoms)
│   ├── shared/            # Componentes compartidos (molecules)
│   └── features/          # Componentes de funcionalidad (organisms)
├── hooks/                 # Custom hooks
├── lib/                   # Utilidades y configuraciones
│   ├── api/
│   ├── auth/
│   └── utils/
├── types/                 # TypeScript types
└── styles/               # Estilos globales
```

#### **Proyectos Grandes**
```
src/
├── app/                    # Next.js App Router
├── shared/                 # Código compartido
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   └── types/
├── features/              # Módulos de funcionalidad
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   └── dashboard/
├── core/                  # Lógica de negocio central
│   ├── services/
│   ├── repositories/
│   └── entities/
└── infrastructure/        # Servicios externos
    ├── api/
    ├── database/
    └── external/
```

### **🎯 Patrones de Arquitectura a Seguir**

#### **1. Layered Architecture (Arquitectura en Capas)**
```typescript
// ✅ Separar responsabilidades por capas
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

#### **2. Feature-Based Architecture**
```typescript
// ✅ Organizar por funcionalidades, no por tipo de archivo
features/
├── auth/
│   ├── components/        # Componentes específicos de auth
│   ├── hooks/            # Hooks específicos de auth
│   ├── services/         # Servicios específicos de auth
│   ├── types/            # Tipos específicos de auth
│   └── utils/            # Utilidades específicas de auth
├── players/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   └── types/
└── tournaments/
    ├── components/
    ├── hooks/
    ├── services/
    └── types/
```

#### **3. Server Components Pattern (Next.js App Router)**
```typescript
// ✅ Server Components por defecto (sin 'use client')
async function PlayerProfile({ playerId }) {
  // Datos se obtienen en el servidor
  const player = await prisma.player.findUnique({
    where: { id: playerId }
  });
  
  return (
    <div>
      <h1>{player.name}</h1>
      <PlayerActions playerId={playerId} />
    </div>
  );
}

// ✅ Client Components solo cuando necesitas interactividad
'use client';
function PlayerActions({ playerId }) {
  const [liked, setLiked] = useState(false);
  
  return (
    <button onClick={() => setLiked(!liked)}>
      {liked ? '❤️' : '🤍'}
    </button>
  );
}
```

### **🧩 Patrones de Componentes Avanzados**

#### **1. Compound Components Pattern**
```typescript
// ✅ Crear componentes compuestos
function Card({ children, className }) {
  return (
    <div className={cn("card", className)}>
      {children}
    </div>
  );
}

Card.Header = function CardHeader({ children, className }) {
  return (
    <div className={cn("card-header", className)}>
      {children}
    </div>
  );
};

Card.Body = function CardBody({ children, className }) {
  return (
    <div className={cn("card-body", className)}>
      {children}
    </div>
  );
};

Card.Footer = function CardFooter({ children, className }) {
  return (
    <div className={cn("card-footer", className)}>
      {children}
    </div>
  );
};

// Uso
<Card>
  <Card.Header>
    <h3>Título</h3>
  </Card.Header>
  <Card.Body>
    <p>Contenido</p>
  </Card.Body>
  <Card.Footer>
    <Button>Acción</Button>
  </Card.Footer>
</Card>
```

#### **2. Render Props Pattern**
```typescript
// ✅ Para compartir lógica entre componentes
function DataFetcher({ url, children }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, [url]);

  return children({ data, loading, error });
}

// Uso
<DataFetcher url="/api/players">
  {({ data, loading, error }) => (
    loading ? <Spinner /> : 
    error ? <ErrorMessage error={error} /> :
    <PlayerList players={data} />
  )}
</DataFetcher>
```

#### **3. Higher-Order Components (HOC)**
```typescript
// ✅ Para funcionalidad transversal
function withLoading(WrappedComponent) {
  return function WithLoadingComponent({ loading, ...props }) {
    if (loading) {
      return <Spinner />;
    }
    return <WrappedComponent {...props} />;
  };
}

// Uso
const PlayerProfileWithLoading = withLoading(PlayerProfile);
```

### **🔄 Patrones de Estado Avanzados**

#### **1. State Reducer Pattern**
```typescript
// ✅ Para estado complejo
function useReducer(reducer, initialState) {
  const [state, setState] = useState(initialState);
  
  const dispatch = useCallback((action) => {
    setState(prevState => reducer(prevState, action));
  }, [reducer]);
  
  return [state, dispatch];
}

// Reducer
function playerReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_PLAYER':
      return { ...state, player: action.payload, loading: false };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
}
```

#### **2. Context + Reducer Pattern**
```typescript
// ✅ Para estado global complejo
const AppContext = createContext();

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, {
    user: null,
    loading: false,
    error: null
  });
  
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}
```

### **🌐 Patrones de API y Datos**

#### **1. Repository Pattern**
```typescript
// ✅ Abstraer acceso a datos
interface PlayerRepository {
  findById(id: string): Promise<Player>;
  findAll(): Promise<Player[]>;
  create(player: CreatePlayerDto): Promise<Player>;
  update(id: string, player: UpdatePlayerDto): Promise<Player>;
  delete(id: string): Promise<void>;
}

// Implementación
class PrismaPlayerRepository implements PlayerRepository {
  async findById(id: string): Promise<Player> {
    return await prisma.player.findUnique({
      where: { id: parseInt(id) }
    });
  }
  
  async findAll(): Promise<Player[]> {
    return await prisma.player.findMany();
  }
  
  // ... otros métodos
}
```

#### **2. Service Layer Pattern**
```typescript
// ✅ Lógica de negocio en servicios
class PlayerService {
  constructor(private playerRepository: PlayerRepository) {}
  
  async getPlayerWithStats(id: string) {
    const player = await this.playerRepository.findById(id);
    const stats = await this.calculatePlayerStats(id);
    
    return { ...player, stats };
  }
  
  private async calculatePlayerStats(id: string) {
    // Lógica de cálculo de estadísticas
  }
}
```

#### **3. Data Fetching Hooks**
```typescript
// ✅ Hooks para fetching de datos
function usePlayer(playerId: string) {
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    let cancelled = false;
    
    async function fetchPlayer() {
      try {
        setLoading(true);
        const playerData = await playerRepository.findById(playerId);
        
        if (!cancelled) {
          setPlayer(playerData);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    
    fetchPlayer();
    
    return () => {
      cancelled = true;
    };
  }, [playerId]);
  
  return { player, loading, error };
}
```

### **🧪 Patrones de Testing**

#### **1. Arrange-Act-Assert (AAA)**
```typescript
// ✅ Estructura clara de tests
describe('PlayerProfile', () => {
  it('should display player information when loaded', () => {
    // Arrange
    const mockPlayer = { id: '1', name: 'John Doe' };
    jest.spyOn(playerService, 'getPlayer').mockResolvedValue(mockPlayer);
    
    // Act
    render(<PlayerProfile playerId="1" />);
    
    // Assert
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

#### **2. Test Doubles Pattern**
```typescript
// ✅ Usar mocks, stubs y spies apropiadamente
const mockPlayerRepository = {
  findById: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

// Stub
const stubPlayer = { id: '1', name: 'John Doe' };
mockPlayerRepository.findById.mockResolvedValue(stubPlayer);

// Spy
const createSpy = jest.spyOn(playerService, 'createPlayer');
```

### **⚡ Patrones de Performance**

#### **1. Lazy Loading**
```typescript
// ✅ Cargar componentes bajo demanda
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
// ✅ Memoizar cálculos pesados
const memoizedStats = useMemo(() => {
  if (!player) return null;
  
  return {
    currentDan: calculateCurrentDan(player.games),
    currentRate: calculateCurrentRate(player.games),
    maxRate: Math.max(...player.games.map(g => g.rate))
  };
}, [player]);
```

#### **3. Virtualización**
```typescript
// ✅ Para listas grandes
import { FixedSizeList as List } from 'react-window';

function PlayerList({ players }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      <PlayerItem player={players[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={players.length}
      itemSize={80}
    >
      {Row}
    </List>
  );
}
```

### **🔒 Patrones de Seguridad**

#### **1. Input Validation**
```typescript
// ✅ Validar todos los inputs
function validatePlayerData(data: any): ValidationResult {
  const errors: string[] = [];
  
  if (!data.nickname || data.nickname.length < 2) {
    errors.push('Nickname debe tener al menos 2 caracteres');
  }
  
  if (data.birthday && new Date(data.birthday) > new Date()) {
    errors.push('Fecha de nacimiento no puede ser futura');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
```

#### **2. Authorization Guards**
```typescript
// ✅ Proteger rutas y operaciones
function withAuth(WrappedComponent) {
  return function AuthenticatedComponent(props) {
    const { data: session, status } = useSession();
    
    if (status === 'loading') {
      return <Spinner />;
    }
    
    if (!session) {
      return <div>No autorizado</div>;
    }
    
    return <WrappedComponent {...props} />;
  };
}
```

### **📊 Patrones de Monitoreo**

#### **1. Error Boundaries**
```typescript
// ✅ Capturar errores de React
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Enviar a servicio de monitoreo
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    
    return this.props.children;
  }
}
```

#### **2. Logging Pattern**
```typescript
// ✅ Logging estructurado
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
```

### **🎯 Checklist de Arquitectura**

#### **Antes de implementar una feature:**
- [ ] ¿Está clara la separación de responsabilidades?
- [ ] ¿Sigue el patrón de arquitectura del proyecto?
- [ ] ¿Está organizada en la carpeta correcta?
- [ ] ¿Tiene sus propios tipos y servicios?
- [ ] ¿Está desacoplada de otras features?

#### **Durante el desarrollo:**
- [ ] ¿Usa Server Components cuando es posible?
- [ ] ¿Client Components solo para interactividad?
- [ ] ¿Sigue los patrones de componentes establecidos?
- [ ] ¿Implementa manejo de errores apropiado?
- [ ] ¿Es performante y escalable?

#### **Después del desarrollo:**
- [ ] ¿Está bien documentada?
- [ ] ¿Tiene tests apropiados?
- [ ] ¿Sigue las convenciones del proyecto?
- [ ] ¿Es fácil de mantener?
- [ ] ¿Es reutilizable?

---

## 🚀 Instrucciones para la IA

### **Antes de escribir código:**
1. **Revisar** esta guía para recordar los patrones
2. **Verificar** la estructura de carpetas del proyecto
3. **Usar** los componentes base existentes
4. **Seguir** las convenciones de naming
5. **Implementar** i18n para todas las strings
6. **Aplicar** el patrón de manejo de errores
7. **Usar** `[temp]` para archivos de testing/debug

### **Durante el desarrollo:**
1. **Componer** componentes pequeños y reutilizables
2. **Extraer** lógica en custom hooks
3. **Validar** inputs en APIs
4. **Manejar** errores apropiadamente
5. **Usar** TypeScript estrictamente
6. **Optimizar** performance cuando sea necesario
7. **Asegurar** que valores seleccionados coincidan con las opciones mostradas

### **Después de escribir código:**
1. **Verificar** que sigue los patrones del proyecto
2. **Revisar** que usa i18n correctamente
3. **Confirmar** que maneja errores
4. **Validar** que es reutilizable
5. **Comprobar** que es performante
6. **Limpiar** archivos temporales con `[temp]` cuando termines

---

*Esta guía debe ser consultada antes de escribir cualquier código para el proyecto CARM.*
