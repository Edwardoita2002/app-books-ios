import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Pdf from 'react-native-pdf';
import { getBookById, saveProgress, updateTotalPages, BookWithProgress } from '../db/database';

// Cada cuántos cambios de página forzamos el guardado a disco.
// Guardar en cada página es barato en SQLite local, pero usamos un
// pequeño debounce para no saturar de escrituras si el usuario pasa
// páginas muy rápido.
const SAVE_DEBOUNCE_MS = 600;

export default function ReaderScreen({ route }: any) {
  const { bookId } = route.params;
  const [book, setBook] = useState<BookWithProgress | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      const b = await getBookById(bookId);
      if (b) {
        setBook(b);
        setCurrentPage(b.currentPage || 1);
      }
      setLoading(false);
    })();

    // Al desmontar (usuario sale del lector), cancelamos cualquier guardado pendiente
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [bookId]);

  function handlePageChanged(page: number, totalPages: number) {
    setCurrentPage(page);

    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveProgress(bookId, page);
    }, SAVE_DEBOUNCE_MS);

    // Guardamos el total de páginas la primera vez que lo conocemos
    if (book && book.totalPages !== totalPages) {
      updateTotalPages(bookId, totalPages);
      setBook({ ...book, totalPages });
    }
  }

  if (loading || !book) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pdf
        source={{ uri: book.fileUri, cache: false }}
        page={currentPage}
        style={styles.pdf}
        onLoadComplete={(numberOfPages) => {
          if (book.totalPages !== numberOfPages) {
            updateTotalPages(bookId, numberOfPages);
          }
        }}
        onPageChanged={(page, numberOfPages) => handlePageChanged(page, numberOfPages)}
        onError={(error) => console.error('Error al cargar PDF:', error)}
        enablePaging={true}
        horizontal={false}
        trustAllCerts={false}
      />
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Página {currentPage} de {book.totalPages || '...'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  pdf: { flex: 1, width: '100%', backgroundColor: '#e5e7eb' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 8,
    alignItems: 'center',
  },
  footerText: { color: '#fff', fontSize: 13, fontWeight: '500' },
});
