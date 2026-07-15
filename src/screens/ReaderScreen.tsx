import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system/legacy';
import { getBookById, BookWithProgress, saveProgress, updateTotalPages } from '../db/database';

export default function ReaderScreen({ route, navigation }: any) {
  const { bookId } = route.params;
  const [book, setBook] = useState<BookWithProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    async function loadBookData() {
      try {
        console.log('Reader: Buscando libro con ID:', bookId);
        const b = await getBookById(bookId);
        if (b) {
          console.log('Reader: Libro encontrado:', b);
          setBook(b);
        } else {
          Alert.alert('Error', 'No se encontró el archivo seleccionado.');
          navigation.goBack();
        }
      } catch (error) {
        console.error('Reader: Error al leer desde base de datos:', error);
      } finally {
        setLoading(false);
      }
    }
    loadBookData();
  }, [bookId]);

  if (loading || !book) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  // JS inyectado que calcula el scroll y restablece la última página leída al abrir
  const injectProgressTracker = `
    (function() {
      setTimeout(function() {
        var totalHeight = document.documentElement.scrollHeight;
        var windowHeight = window.innerHeight;
        var estimatedPages = Math.max(1, Math.round(totalHeight / windowHeight));
        
        // Enviar total de páginas inicial a la DB
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'INIT_PAGES',
          totalPages: estimatedPages
        }));

        // --- AUTOSCROLL A LA PÁGINA GUARDADA ---
        var savedPage = ${book.currentPage};
        if (savedPage > 1 && savedPage <= estimatedPages) {
          var scrollToY = (savedPage - 1) * windowHeight;
          window.scrollTo(0, scrollToY);
        }

        // Listener de scroll para guardar el progreso nuevo
        window.addEventListener('scroll', function() {
          var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          var currentPage = Math.max(1, Math.round((scrollTop + (windowHeight / 2)) / windowHeight) + 1);
          
          if (currentPage > estimatedPages) currentPage = estimatedPages;

          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'UPDATE_PROGRESS',
            currentPage: currentPage
          }));
        });
      }, 800); // Pequeño retraso para dar tiempo a que iOS dibuje el PDF
    })();
    true;
  `;

  async function handleWebViewMessage(event: any) {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (!book) return;

      if (data.type === 'INIT_PAGES') {
        if (book.totalPages === 0 && data.totalPages > 0) {
          console.log(`Actualizando total de páginas en DB: ${data.totalPages}`);
          await updateTotalPages(book.id, data.totalPages);
          setBook(prev => prev ? { ...prev, totalPages: data.totalPages } : null);
        }
      } else if (data.type === 'UPDATE_PROGRESS') {
        const newPage = data.currentPage;
        if (newPage !== book.currentPage && newPage <= (book.totalPages || 9999)) {
          console.log(`Guardando progreso en DB: Página ${newPage}`);
          await saveProgress(book.id, newPage);
          setBook(prev => prev ? { ...prev, currentPage: newPage } : null);
        }
      }
    } catch (e) {
      console.warn("Error leyendo mensaje del WebView:", e);
    }
  }

  const appDocumentDirectory = FileSystem.documentDirectory || '';

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: book.fileUri }}
        style={styles.pdf}
        originWhitelist={['*']}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        allowFileAccessFromFileURLs={true}
        allowingReadAccessToURL={appDocumentDirectory}

        injectedJavaScript={injectProgressTracker}
        onMessage={handleWebViewMessage}

        startInLoadingState={true}
        scalesPageToFit={true}
        renderLoading={() => (
          <View style={styles.absoluteLoader}>
            <ActivityIndicator color="#2563eb" size="large" />
            <Text style={styles.loaderText}>Cargando tu progreso...</Text>
          </View>
        )}
      />
      <View style={styles.footer}>
        <Text style={styles.footerText} numberOfLines={1}>
          {book.title}
        </Text>
        <Text style={styles.progressText}>
          Página {book.currentPage} {book.totalPages > 0 ? `de ${book.totalPages}` : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  pdf: { flex: 1, width: '100%', backgroundColor: '#e5e7eb' },
  absoluteLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loaderText: { marginTop: 12, fontSize: 14, color: '#6b7280', fontWeight: '500' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  footerText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  progressText: { color: '#9ca3af', fontSize: 11, marginTop: 2 },
});