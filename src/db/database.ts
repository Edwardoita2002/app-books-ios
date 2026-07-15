import * as SQLite from 'expo-sqlite';

export interface Book {
  id: number;
  title: string;
  fileUri: string;
  totalPages: number;
  addedAt: string;
}

export interface Progress {
  bookId: number;
  currentPage: number;
  lastReadAt: string;
}

export interface BookWithProgress extends Book {
  currentPage: number;
  lastReadAt: string | null;
}

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Abre (o crea) la base de datos local y garantiza que las tablas existan.
 * Se debe llamar una sola vez al iniciar la app.
 */
export async function initDatabase(): Promise<void> {
  db = await SQLite.openDatabaseAsync('pdf_reader.db');

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      fileUri TEXT NOT NULL UNIQUE,
      totalPages INTEGER NOT NULL DEFAULT 0,
      addedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS progress (
      bookId INTEGER PRIMARY KEY,
      currentPage INTEGER NOT NULL DEFAULT 1,
      lastReadAt TEXT NOT NULL,
      FOREIGN KEY (bookId) REFERENCES books (id) ON DELETE CASCADE
    );
  `);
}

function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error('La base de datos no ha sido inicializada. Llama a initDatabase() primero.');
  }
  return db;
}

/** Inserta un nuevo libro en la biblioteca local. */
export async function addBook(title: string, fileUri: string, totalPages: number): Promise<number> {
  const database = getDb();
  const result = await database.runAsync(
    'INSERT INTO books (title, fileUri, totalPages, addedAt) VALUES (?, ?, ?, ?);',
    title,
    fileUri,
    totalPages,
    new Date().toISOString()
  );
  // Creamos el registro de progreso inicial en página 1
  await database.runAsync(
    'INSERT INTO progress (bookId, currentPage, lastReadAt) VALUES (?, ?, ?);',
    result.lastInsertRowId,
    1,
    new Date().toISOString()
  );
  return result.lastInsertRowId;
}

/** Devuelve todos los libros junto con su progreso de lectura actual. */
export async function getAllBooks(): Promise<BookWithProgress[]> {
  const database = getDb();
  const rows = await database.getAllAsync<BookWithProgress>(`
    SELECT b.id, b.title, b.fileUri, b.totalPages, b.addedAt,
           COALESCE(p.currentPage, 1) as currentPage,
           p.lastReadAt as lastReadAt
    FROM books b
    LEFT JOIN progress p ON p.bookId = b.id
    ORDER BY p.lastReadAt DESC;
  `);
  return rows;
}

/** Obtiene un libro específico por id. */
export async function getBookById(bookId: number): Promise<BookWithProgress | null> {
  const database = getDb();
  const row = await database.getFirstAsync<BookWithProgress>(
    `SELECT b.id, b.title, b.fileUri, b.totalPages, b.addedAt,
            COALESCE(p.currentPage, 1) as currentPage,
            p.lastReadAt as lastReadAt
     FROM books b
     LEFT JOIN progress p ON p.bookId = b.id
     WHERE b.id = ?;`,
    bookId
  );
  return row ?? null;
}

/**
 * Guarda el progreso de lectura de un libro (página actual).
 * Se llama cada vez que el usuario cambia de página en el lector.
 */
export async function saveProgress(bookId: number, currentPage: number): Promise<void> {
  const database = getDb();
  await database.runAsync(
    `INSERT INTO progress (bookId, currentPage, lastReadAt)
     VALUES (?, ?, ?)
     ON CONFLICT(bookId) DO UPDATE SET
       currentPage = excluded.currentPage,
       lastReadAt = excluded.lastReadAt;`,
    bookId,
    currentPage,
    new Date().toISOString()
  );
}

/** Actualiza el número total de páginas de un libro (se conoce al abrirlo la primera vez). */
export async function updateTotalPages(bookId: number, totalPages: number): Promise<void> {
  const database = getDb();
  await database.runAsync('UPDATE books SET totalPages = ? WHERE id = ?;', totalPages, bookId);
}

/** Elimina un libro y su progreso asociado. */
export async function deleteBook(bookId: number): Promise<void> {
  const database = getDb();
  await database.runAsync('DELETE FROM progress WHERE bookId = ?;', bookId);
  await database.runAsync('DELETE FROM books WHERE id = ?;', bookId);
}
