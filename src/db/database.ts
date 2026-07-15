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

export async function initDatabase(): Promise<void> {
  db = await SQLite.openDatabaseAsync('pdf_reader.db');

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

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
    throw new Error('La base de datos no ha sido inicializada. Llama a initDatabase() primero en tu App.tsx.');
  }
  return db;
}

export async function addBook(title: string, fileUri: string, totalPages: number): Promise<number> {
  const database = getDb();
  
  const result = await database.runAsync(
    'INSERT INTO books (title, fileUri, totalPages, addedAt) VALUES (?, ?, ?, ?);',
    title,
    fileUri,
    totalPages,
    new Date().toISOString()
  );
  
  await database.runAsync(
    'INSERT INTO progress (bookId, currentPage, lastReadAt) VALUES (?, ?, ?);',
    result.lastInsertRowId,
    1,
    new Date().toISOString()
  );
  
  return result.lastInsertRowId;
}

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

export async function updateTotalPages(bookId: number, totalPages: number): Promise<void> {
  const database = getDb();
  await database.runAsync('UPDATE books SET totalPages = ? WHERE id = ?;', totalPages, bookId);
}

/** ACTUALIZADO: Permite cambiar el título del libro */
export async function updateBookTitle(bookId: number, newTitle: string): Promise<void> {
  const database = getDb();
  await database.runAsync('UPDATE books SET title = ? WHERE id = ?;', newTitle, bookId);
}

export async function deleteBook(bookId: number): Promise<void> {
  const database = getDb();
  await database.runAsync('DELETE FROM progress WHERE bookId = ?;', bookId);
  await database.runAsync('DELETE FROM books WHERE id = ?;', bookId);
}