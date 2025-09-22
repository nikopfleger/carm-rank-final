# 🏗️ Patrones de Diseño y Arquitectura - React & Next.js (referencia)

> Este documento complementa `docs/AI_CODING_GUIDELINES.md`. Para arquitectura del proyecto ver `docs/CARM_ARCHITECTURE.md`.

## 📋 Índice

1. [Patrones de Diseño en React](#patrones-de-diseño-en-react)
2. [Patrones de Arquitectura en Next.js](#patrones-de-arquitectura-en-nextjs)
3. [Estructura de Carpetas Recomendada](#estructura-de-carpetas-recomendada)
4. [Patrones de Componentes](#patrones-de-componentes)
5. [Patrones de Estado](#patrones-de-estado)
6. [Patrones de API y Datos](#patrones-de-api-y-datos)
7. [Patrones de Testing](#patrones-de-testing)
8. [Mejores Prácticas](#mejores-prácticas)
9. [Anti-patrones a Evitar](#anti-patrones-a-evitar)

---

## 🎨 Patrones de Diseño en React

### 1. **Composición de Componentes**

**Descripción**: Construir componentes complejos combinando componentes más pequeños y reutilizables.

```tsx
// ✅ Bueno: Composición
function Card({ children, title, actions }) {
  return (
    <div className="card">
      <div className="card-header">
        <h3>{title}</h3>
      </div>
      <div className="card-body">
        {children}
      </div>
      {actions && (
        <div className="card-footer">
          {actions}
        </div>
      )}
    </div>
  );
}

// Uso
<Card 
  title="Mi Perfil" 
  actions={<Button>Editar</Button>}
>
  <p>Contenido del perfil...</p>
</Card>
```

### 2. **Componentes Contenedores y de Presentación**

**Descripción**: Separar la lógica de negocio de la presentación.

```tsx
// 🎯 Contenedor (Smart Component)
function UserProfileContainer({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser(userId).then(user => {
      setUser(user);
      setLoading(false);
    });
  }, [userId]);

  return (
    <UserProfilePresentation 
      user={user} 
      loading={loading} 
    />
  );
}

// 🎨 Presentación (Dumb Component)
function UserProfilePresentation({ user, loading }) {
  if (loading) return <Spinner />;
  if (!user) return <div>Usuario no encontrado</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

### 3. **Custom Hooks**

**Descripción**: Extraer lógica reutilizable en hooks personalizados.

```tsx
// Hook personalizado
function useApi(url) {
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

  return { data, loading, error };
}

// Uso en componente
function UserList() {
  const { data: users, loading, error } = useApi('/api/users');

  if (loading) return <Spinner />;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {users?.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### 4. **Render Props**

**Descripción**: Pasar una función como prop para controlar el renderizado.

```tsx
function DataFetcher({ render, url }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      });
  }, [url]);

  return render({ data, loading });
}

// Uso
<DataFetcher 
  url="/api/users"
  render={({ data, loading }) => (
    loading ? <Spinner /> : <UserList users={data} />
  )}
/>
```

### 5. **Higher-Order Components (HOC)**

**Descripción**: Funciones que toman un componente y devuelven un nuevo componente con funcionalidades adicionales.

```tsx
function withLoading(WrappedComponent) {
  return function WithLoadingComponent({ loading, ...props }) {
    if (loading) {
      return <Spinner />;
    }
    return <WrappedComponent {...props} />;
  };
}

// Uso
const UserProfileWithLoading = withLoading(UserProfile);
```

---

## 🏛️ Patrones de Arquitectura en Next.js

### 1. **Arquitectura en Capas**

```
src/
├── presentation/     # UI Components
├── business/         # Business Logic
├── data/            # Data Access
└── infrastructure/  # External Services
```

### 2. **Feature-Based Architecture**

```
src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   ├── users/
│   └── dashboard/
├── shared/
│   ├── components/
│   ├── hooks/
│   └── utils/
└── app/
```

### 3. **Server Components Pattern**

```tsx
// Server Component (por defecto en App Router)
async function UserProfile({ userId }) {
  const user = await fetchUser(userId);
  
  return (
    <div>
      <h1>{user.name}</h1>
      <UserActions userId={userId} />
    </div>
  );
}

// Client Component (cuando necesitas interactividad)
'use client';
function UserActions({ userId }) {
  const [liked, setLiked] = useState(false);
  
  return (
    <button onClick={() => setLiked(!liked)}>
      {liked ? '❤️' : '🤍'}
    </button>
  );
}
```

---

## 📁 Estructura de Carpetas Recomendada

### **Para Proyectos Pequeños-Medianos**

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/
│   ├── dashboard/
│   └── api/
├── components/             # Componentes reutilizables
│   ├── ui/                # Componentes base (Button, Input, etc.)
│   ├── forms/             # Componentes de formularios
│   └── layout/            # Componentes de layout
├── features/              # Funcionalidades específicas
│   ├── auth/
│   ├── users/
│   └── dashboard/
├── hooks/                 # Custom hooks
├── lib/                   # Utilidades y configuraciones
│   ├── api/
│   ├── auth/
│   └── utils/
├── types/                 # TypeScript types
└── styles/               # Estilos globales
```

### **Para Proyectos Grandes**

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

---

## 🧩 Patrones de Componentes

### 1. **Compound Components**

```tsx
function Modal({ children, isOpen, onClose }) {
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

Modal.Header = function ModalHeader({ children }) {
  return <div className="modal-header">{children}</div>;
};

Modal.Body = function ModalBody({ children }) {
  return <div className="modal-body">{children}</div>;
};

Modal.Footer = function ModalFooter({ children }) {
  return <div className="modal-footer">{children}</div>;
};

// Uso
<Modal isOpen={isOpen} onClose={onClose}>
  <Modal.Header>
    <h2>Título del Modal</h2>
  </Modal.Header>
  <Modal.Body>
    <p>Contenido del modal...</p>
  </Modal.Body>
  <Modal.Footer>
    <Button onClick={onClose}>Cerrar</Button>
  </Modal.Footer>
</Modal>
```

### 2. **Provider Pattern**

```tsx
const ThemeContext = createContext();

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  
  const value = {
    theme,
    setTheme,
    toggleTheme: () => setTheme(prev => prev === 'light' ? 'dark' : 'light')
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

### 3. **Render Props Pattern**

```tsx
function Toggle({ children }) {
  const [isOn, setIsOn] = useState(false);
  
  const toggle = () => setIsOn(prev => !prev);
  
  return children({ isOn, toggle });
}

// Uso
<Toggle>
  {({ isOn, toggle }) => (
    <button onClick={toggle}>
      {isOn ? 'ON' : 'OFF'}
    </button>
  )}
</Toggle>
```

---

## 🔄 Patrones de Estado

### 1. **State Reducer Pattern**

```tsx
function useReducer(reducer, initialState) {
  const [state, setState] = useState(initialState);
  
  const dispatch = useCallback((action) => {
    setState(prevState => reducer(prevState, action));
  }, [reducer]);
  
  return [state, dispatch];
}

// Reducer
function counterReducer(state, action) {
  switch (action.type) {
    case 'increment':
      return { ...state, count: state.count + 1 };
    case 'decrement':
      return { ...state, count: state.count - 1 };
    case 'reset':
      return { ...state, count: 0 };
    default:
      return state;
  }
}
```

### 2. **Context + Reducer Pattern**

```tsx
const AppContext = createContext();

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, {
    user: null,
    loading: false
  });
  
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}
```

---

## 🌐 Patrones de API y Datos

### 1. **Repository Pattern**

```tsx
// Repository interface
interface UserRepository {
  findById(id: string): Promise<User>;
  findAll(): Promise<User[]>;
  create(user: CreateUserDto): Promise<User>;
  update(id: string, user: UpdateUserDto): Promise<User>;
  delete(id: string): Promise<void>;
}

// Implementation
class ApiUserRepository implements UserRepository {
  async findById(id: string): Promise<User> {
    const response = await fetch(`/api/users/${id}`);
    return response.json();
  }
  
  async findAll(): Promise<User[]> {
    const response = await fetch('/api/users');
    return response.json();
  }
  
  // ... otros métodos
}
```

### 2. **Service Layer Pattern**

```tsx
class UserService {
  constructor(private userRepository: UserRepository) {}
  
  async getUserWithProfile(id: string) {
    const user = await this.userRepository.findById(id);
    const profile = await this.getUserProfile(id);
    
    return { ...user, profile };
  }
  
  private async getUserProfile(id: string) {
    // Lógica para obtener perfil
  }
}
```

### 3. **Data Fetching Hooks**

```tsx
function useUser(userId: string) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    let cancelled = false;
    
    async function fetchUser() {
      try {
        setLoading(true);
        const userData = await userRepository.findById(userId);
        
        if (!cancelled) {
          setUser(userData);
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
    
    fetchUser();
    
    return () => {
      cancelled = true;
    };
  }, [userId]);
  
  return { user, loading, error };
}
```

---

## 🧪 Patrones de Testing

### 1. **Arrange-Act-Assert (AAA)**

```tsx
describe('UserProfile', () => {
  it('should display user name when user is loaded', () => {
    // Arrange
    const mockUser = { id: '1', name: 'John Doe' };
    jest.spyOn(userService, 'getUser').mockResolvedValue(mockUser);
    
    // Act
    render(<UserProfile userId="1" />);
    
    // Assert
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

### 2. **Test Doubles Pattern**

```tsx
// Mock
const mockUserRepository = {
  findById: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

// Stub
const stubUser = { id: '1', name: 'John Doe' };
mockUserRepository.findById.mockResolvedValue(stubUser);

// Spy
const createSpy = jest.spyOn(userService, 'createUser');
```

---

## ✅ Mejores Prácticas

### 1. **Naming Conventions**

```tsx
// ✅ Componentes: PascalCase
function UserProfile() {}

// ✅ Hooks: camelCase con prefijo 'use'
function useUserData() {}

// ✅ Variables y funciones: camelCase
const userName = 'john';
function calculateAge() {}

// ✅ Constantes: UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com';

// ✅ Archivos: kebab-case
// user-profile.tsx
// user-service.ts
```

### 2. **Component Organization**

```tsx
// ✅ Orden de props y hooks
function UserProfile({ 
  userId, 
  onEdit, 
  className 
}: UserProfileProps) {
  // 1. Hooks
  const [user, setUser] = useState(null);
  const { data, loading, error } = useUser(userId);
  
  // 2. Event handlers
  const handleEdit = useCallback(() => {
    onEdit?.(user);
  }, [user, onEdit]);
  
  // 3. Effects
  useEffect(() => {
    if (data) {
      setUser(data);
    }
  }, [data]);
  
  // 4. Render
  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div className={className}>
      <h1>{user?.name}</h1>
      <button onClick={handleEdit}>Editar</button>
    </div>
  );
}
```

### 3. **Error Boundaries**

```tsx
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
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    
    return this.props.children;
  }
}
```

---

## ❌ Anti-patrones a Evitar

### 1. **Props Drilling**

```tsx
// ❌ Malo: Props drilling
function App() {
  const [user, setUser] = useState(null);
  
  return (
    <div>
      <Header user={user} />
      <Main user={user} setUser={setUser} />
    </div>
  );
}

function Main({ user, setUser }) {
  return (
    <div>
      <Sidebar user={user} />
      <Content user={user} setUser={setUser} />
    </div>
  );
}

// ✅ Bueno: Context
const UserContext = createContext();

function App() {
  const [user, setUser] = useState(null);
  
  return (
    <UserContext.Provider value={{ user, setUser }}>
      <div>
        <Header />
        <Main />
      </div>
    </UserContext.Provider>
  );
}
```

### 2. **Mutación Directa del Estado**

```tsx
// ❌ Malo: Mutación directa
function updateUser(users, userId, updates) {
  const user = users.find(u => u.id === userId);
  user.name = updates.name; // Mutación directa
  return users;
}

// ✅ Bueno: Inmutabilidad
function updateUser(users, userId, updates) {
  return users.map(user => 
    user.id === userId 
      ? { ...user, ...updates }
      : user
  );
}
```

### 3. **Efectos con Dependencias Incorrectas**

```tsx
// ❌ Malo: Dependencias faltantes
useEffect(() => {
  fetchUser(userId);
}, []); // Falta userId

// ✅ Bueno: Dependencias correctas
useEffect(() => {
  fetchUser(userId);
}, [userId]);
```

---

## 🚀 Patrones Avanzados

### 1. **Observer Pattern con Custom Hooks**

```tsx
function useObservable(observable) {
  const [state, setState] = useState(observable.getValue());
  
  useEffect(() => {
    const subscription = observable.subscribe(setState);
    return () => subscription.unsubscribe();
  }, [observable]);
  
  return state;
}
```

### 2. **Command Pattern**

```tsx
class Command {
  constructor(execute, undo) {
    this.execute = execute;
    this.undo = undo;
  }
}

class CommandManager {
  constructor() {
    this.history = [];
    this.currentIndex = -1;
  }
  
  execute(command) {
    command.execute();
    this.history = this.history.slice(0, this.currentIndex + 1);
    this.history.push(command);
    this.currentIndex++;
  }
  
  undo() {
    if (this.currentIndex >= 0) {
      const command = this.history[this.currentIndex];
      command.undo();
      this.currentIndex--;
    }
  }
}
```

---

## 📚 Recursos Adicionales

- [React Patterns](https://reactpatterns.com/)
- [Next.js Best Practices](https://nextjs.org/docs/advanced-features)
- [TypeScript React Patterns](https://react-typescript-cheatsheet.netlify.app/)
- [Testing Library Patterns](https://testing-library.com/docs/guiding-principles)

---

## 🎯 Checklist de Implementación

### Para cada componente:
- [ ] ¿Es reutilizable?
- [ ] ¿Tiene una responsabilidad clara?
- [ ] ¿Está bien tipado?
- [ ] ¿Tiene tests?
- [ ] ¿Sigue las convenciones de naming?

### Para cada feature:
- [ ] ¿Está organizado en su propia carpeta?
- [ ] ¿Tiene sus propios tipos?
- [ ] ¿Tiene sus propios hooks?
- [ ] ¿Está desacoplado de otras features?

### Para la arquitectura general:
- [ ] ¿Está separada la lógica de negocio de la presentación?
- [ ] ¿Son claras las responsabilidades de cada capa?
- [ ] ¿Es fácil de testear?
- [ ] ¿Es escalable?

---

*Esta guía debe ser actualizada regularmente según las mejores prácticas emergentes y los cambios en React/Next.js.*
