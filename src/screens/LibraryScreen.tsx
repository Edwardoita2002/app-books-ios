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
import * as FileSystem from 'expo-file-system/legacy';
import { useFocusEffect } from '@react-navigation/native';
import { addBook, getAllBooks, deleteBook, updateBookTitle, BookWithProgress } from '../db/database';

const BASE_DIR = FileSystem.documentDirectory || '';
const PDF_DIR = BASE_DIR + 'pdfs/';

async function ensurePdfDirExists() {
  try {
    const dirInfo = await FileSystem.getInfoAsync(PDF_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(PDF_DIR, { intermediates: true });
    }
  } catch (error) {
    console.error(error);
  }
}

export default function LibraryScreen({ navigation }: any) {
  const [books, setBooks] = useState<BookWithProgress[]>([]);
  const [loading, setLoading] = useState(false);

  const loadBooks = useCallback(async () => {
    try {
      const result = await getAllBooks();
      setBooks(result);
    } catch (error) {
      console.error(error);
    }
  }, []);

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

      const originalName = asset.name || 'documento.pdf';
      const cleanName = originalName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9.-]/g, '_');

      const uniqueFileName = `${Date.now()}_${cleanName}`;
      const destUri = PDF_DIR + uniqueFileName;
      const decodedSourceUri = decodeURIComponent(asset.uri);

      await FileSystem.copyAsync({ from: decodedSourceUri, to: destUri });

      const cleanTitle = originalName.replace(/\.pdf$/i, '');
      await addBook(cleanTitle, destUri, 0);
      await loadBooks();
      Alert.alert('Éxito', `"${cleanTitle}" se ha guardado.`);
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo importar.');
    } finally {
      setLoading(false);
    }
  }

  // Función directa para renombrar el libro usando el botón del lápiz
  function handleRenameBook(book: BookWithProgress) {
    Alert.prompt(
      'Editar nombre',
      'Ingresa el nuevo título para el libro:',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Guardar',
          onPress: async (newTitle?: string) => {
            if (newTitle && newTitle.trim() !== '') {
              await updateBookTitle(book.id, newTitle.trim());
              await loadBooks();
            }
          }
        }
      ],
      'plain-text',
      book.title
    );
  }

  function handleDeleteBook(book: BookWithProgress) {
    Alert.alert('Eliminar libro', `¿Eliminar permanentemente "${book.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await FileSystem.deleteAsync(book.fileUri, { idempotent: true });
            await deleteBook(book.id);
            await loadBooks();
          } catch (error) {
            console.error(error);
          }
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
          <Text style={styles.emptyText}>No has importado ningún libro aún.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.bookCardContainer}>
            {/* Tarjeta principal (Tocar abre el lector, Mantener presionado elimina) */}
            <TouchableOpacity
              style={styles.bookCardMain}
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

            {/* BOTÓN DEL LÁPIZ INDEPENDIENTE */}
            <TouchableOpacity 
              style={styles.editButton} 
              onPress={() => handleRenameBook(item)}
              activeOpacity={0.6}
            >
              <Text style={styles.editButtonText}>✏️</Text>
            </TouchableOpacity>
          </View>
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
  
  // Contenedor de la tarjeta que agrupa la información y el botón del lápiz
  bookCardContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    overflow: 'hidden',
  },
  // Cuerpo principal de la tarjeta (ocupa el espacio restante de la izquierda)
  bookCardMain: {
    flex: 1,
    padding: 16,
    paddingRight: 8,
  },
  bookTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  bookProgress: { fontSize: 13, color: '#6b7280', marginBottom: 8 },
  progressBarBg: { height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: 6, backgroundColor: '#2563eb' },
  
  // Estilo del botón del lápiz de edición
  editButton: {
    paddingVertical: 20,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#f3f4f6', // Línea sutil divisoria
  },
  editButtonText: {
    fontSize: 18,
  },
});