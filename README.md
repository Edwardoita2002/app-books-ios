# Mi Lector PDF (React Native + Expo, 100% offline)

App para importar libros en PDF, leerlos y guardar automáticamente el progreso
de lectura (página actual) en una base de datos SQLite local. **No requiere
conexión a internet** en ningún momento: el PDF se copia al almacenamiento
interno del dispositivo y toda la data vive en SQLite.

## Cómo funciona

1. **Importar**: en la pantalla "Mi Biblioteca" tocas "+ Importar PDF", eliges
   un archivo del dispositivo y se copia a `FileSystem.documentDirectory/pdfs/`.
2. **Leer**: al tocar un libro se abre el lector (`react-native-pdf`), que
   muestra el PDF renderizado nativamente (rápido y sin depender de internet).
3. **Progreso**: cada vez que cambias de página, se guarda `currentPage` en la
   tabla `progress` de SQLite (con un pequeño debounce de 600ms para no
   escribir en cada frame). La próxima vez que abras el libro, retoma
   exactamente en esa página.
4. **Eliminar**: mantén presionado un libro en la biblioteca para eliminarlo
   (borra el archivo físico y su registro en la base de datos).

## Instalación

Este proyecto usa `react-native-pdf`, que tiene código nativo. Esto significa
que **no funciona en Expo Go** — necesitas un *development build*.

```bash
# 1. Instalar dependencias
npm install

# 2. Generar los proyectos nativos (android/ e ios/)
npx expo prebuild

# 3a. Ejecutar en Android (requiere Android Studio / emulador o dispositivo con USB debugging)
npx expo run:android

# 3b. Ejecutar en iOS (requiere macOS + Xcode)
npx expo run:ios
```

Después de la primera compilación nativa, puedes seguir desarrollando con:

```bash
npx expo start --dev-client
```

## Estructura del proyecto

```
pdf-reader-app/
├── App.tsx                    # Punto de entrada + navegación
├── app.json                   # Config de Expo (incluye plugin de react-native-pdf)
├── package.json
├── src/
│   ├── db/
│   │   └── database.ts        # Toda la lógica de SQLite (libros + progreso)
│   └── screens/
│       ├── LibraryScreen.tsx  # Biblioteca: importar, listar, eliminar libros
│       └── ReaderScreen.tsx   # Lector de PDF con guardado de progreso
```

## Esquema de la base de datos

```sql
CREATE TABLE books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  fileUri TEXT NOT NULL UNIQUE,
  totalPages INTEGER NOT NULL DEFAULT 0,
  addedAt TEXT NOT NULL
);

CREATE TABLE progress (
  bookId INTEGER PRIMARY KEY,
  currentPage INTEGER NOT NULL DEFAULT 1,
  lastReadAt TEXT NOT NULL,
  FOREIGN KEY (bookId) REFERENCES books (id) ON DELETE CASCADE
);
```

## Posibles mejoras futuras

- Marcadores (bookmarks) en páginas específicas.
- Búsqueda de texto dentro del PDF.
- Modo oscuro para el lector.
- Estadísticas de tiempo de lectura por libro.
- Exportar/importar la biblioteca (backup) sin usar internet, vía compartir
  archivo `.db`.
