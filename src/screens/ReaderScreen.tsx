import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { getBookById, BookWithProgress } from '../db/database';

export default function ReaderScreen({ route }: any) {
  const { bookId } = route.params;
  const [book, setBook] = useState<BookWithProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const b = await getBookById(bookId);
      if (b) {
        setBook(b);
      }
      setLoading(false);
    })();
  }, [bookId]);

  if (loading || !book) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: book.fileUri }}
        style={styles.pdf}
        originWhitelist={['*']}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        scalesPageToFit={true}
      />
      <View style={styles.footer}>
        <Text style={styles.footerText} numberOfLines={1}>
          {book.title}
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
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  footerText: { color: '#fff', fontSize: 13, fontWeight: '500' },
});
