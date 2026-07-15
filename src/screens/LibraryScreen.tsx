import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useFocusEffect } from '@react-navigation/native';
import { addBook, getAllBooks, deleteBook, BookWithProgress } from '../db/database';

const PDF_DIR = FileSystem.documentDirectory + 'pdfs/';

async function ensurePdfDirExists() {
  const dirInfo = await FileSystem.getInfoAsync(PDF_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(PDF_DIR, { intermediates: true });
  }
}

export default function LibraryScreen({ navigation }: any) {
  const [books, setBooks] = useState<BookWithProgress[]>([]);
  const [loading, setLoading] = useState(false);

  const loadBooks = useCallback(async () => {
    const result = await getAllBooks();
    setBooks(result);
  }, []);

  // Recarga la lista cada vez que la pantalla vuelve a estar en foco
  // (por ejemplo, al volver del lector con progreso actualizado)
  useFocusEffect(
    useCallback(() => {
      loadBooks();
    }, [loadBooks])
  );

  async function handleImportPdf() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;

      setLoading(true);
      const asset = result.assets[0];

      await ensurePdfDirExists();
      const destUri = PDF_DIR + Date.now() + '_' + asset.name;
      await FileSystem.copyAsync({ from: asset.uri, to: destUri });

      await addBook(asset.name.replace(/\.pdf$/i, ''), destUri, 0);
      await loadBooks();
    } catch (error) {
      Alert.alert('Error', 'No se pudo importar el PDF. Intenta de nuevo.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function handleDeleteBook(book: BookWithProgress) {
    Alert.alert('Eliminar libro', `¿Eliminar "${book.title}" de tu biblioteca?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await FileSystem.deleteAsync(book.fileUri, { idempotent: true });
          await deleteBook(book.id);
          await loadBooks();
        },
      },
    ]);
  }

  function renderProgress(book: BookWithProgress) {
    if (!book.totalPages) return 'Sin abrir aún';
    const pct = Math.round((book.currentPage / book.totalPages) * 100);
    return `Página ${book.currentPage} de ${book.totalPages} · ${pct}%`;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.importButton} onPress={handleImportPdf} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.importButtonText}>+ Importar PDF</Text>
        )}
      </TouchableOpacity>

      <FlatList
        data={books}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Aún no has importado ningún libro. Toca "Importar PDF" para comenzar.
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.bookCard}
            onPress={() => navigation.navigate('Reader', { bookId: item.id })}
            onLongPress={() => handleDeleteBook(item)}
          >
            <Text style={styles.bookTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.bookProgress}>{renderProgress(item)}</Text>
            {item.totalPages > 0 && (
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.min(100, (item.currentPage / item.totalPages) * 100)}%` },
                  ]}
                />
              </View>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7', padding: 16 },
  importButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  importButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  emptyText: { textAlign: 'center', color: '#6b7280', marginTop: 40, fontSize: 14 },
  bookCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  bookTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  bookProgress: { fontSize: 13, color: '#6b7280', marginBottom: 8 },
  progressBarBg: { height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: 6, backgroundColor: '#2563eb' },
});
