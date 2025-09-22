# Patrón BaseModel en Prisma (referencia)

> Patrón recomendado. Recordatorio: Según regla del repo, todos los modelos deben incluir campos de auditoría y `version Int @default(0)`.

## Problema
En Java, podemos crear una clase base con campos comunes y hacer que todas las entidades hereden de ella. En Prisma, no existe herencia directa como en Java, pero podemos usar un patrón similar.

## Solución: Tipo BaseModel

### 1. Definir el tipo base
```prisma
// Tipo base para todos los modelos con campos de auditoría
type BaseModel {
  version   Int      @default(0)
  deleted   Boolean  @default(false)
  createdAt   DateTime @default(now()) @map("created_at")
  createdBy String?  @map("created_by") @db.VarChar(255)
  createdIp String?  @map("created_ip") @db.VarChar(45)
  updatedAt   DateTime @updatedAt @map("updated_at")
  updatedAt String?  @map("updated_at") @db.VarChar(255)
  updatedIp String?  @map("updated_ip") @db.VarChar(45)
}
```

### 2. Usar como referencia en modelos
Aunque no podemos heredar directamente, podemos usar este tipo como referencia para mantener consistencia:

```prisma
model Country {
  id          Int      @id @default(autoincrement())
  isoCode     String   @unique @map("iso_code") @db.VarChar(3)
  fullName    String   @map("full_name") @db.VarChar(255)
  nationality String   @db.VarChar(255)
  
  // Campos del BaseModel (copiar manualmente)
  version   Int      @default(0)
  deleted   Boolean  @default(false)
  createdAt   DateTime @default(now()) @map("created_at")
  createdBy String?  @map("created_by") @db.VarChar(255)
  createdIp String?  @map("created_ip") @db.VarChar(45)
  updatedAt   DateTime @updatedAt @map("updated_at")
  updatedAt String?  @map("updated_at") @db.VarChar(255)
  updatedIp String?  @map("updated_ip") @db.VarChar(45)
  
  players     Player[]

  @@map("country")
  @@schema("carm")
}
```

## Alternativas más avanzadas

### 1. Usar un generador personalizado
Podrías crear un generador de Prisma que automáticamente agregue estos campos a todos los modelos.

### 2. Usar un script de build
Crear un script que lea el schema y automáticamente agregue los campos base a todos los modelos.

### 3. Usar Prisma Migrate con scripts personalizados
Crear migraciones que automáticamente agreguen estos campos a todas las tablas.

## Ventajas del patrón actual

1. **Consistencia**: El tipo `BaseModel` sirve como documentación de qué campos deben tener todos los modelos
2. **Mantenibilidad**: Si necesitas cambiar un campo base, sabes exactamente qué buscar
3. **Claridad**: Es obvio qué campos son comunes a todos los modelos
4. **Flexibilidad**: Puedes tener modelos que no hereden todos los campos si es necesario

## Desventajas

1. **Duplicación**: Los campos se duplican en cada modelo
2. **Mantenimiento manual**: Si cambias `BaseModel`, debes actualizar todos los modelos manualmente
3. **No hay validación automática**: Prisma no valida que todos los modelos tengan estos campos

## Recomendación

Para proyectos pequeños/medianos, este patrón es suficiente. Para proyectos grandes, considera crear un generador personalizado o usar herramientas de build que automáticamente mantengan la consistencia.
