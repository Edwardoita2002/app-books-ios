import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { initDatabase } from './src/db/database'; // Modifica la ruta si es necesario
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LibraryScreen from './src/screens/LibraryScreen';
import ReaderScreen from './src/screens/ReaderScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    async function setup() {
      try {
        await initDatabase();
        setDbReady(true);
      } catch (error) {
        console.error("Error crítico de inicialización:", error);
      }
    }
    setup();
  }, []);

  if (!dbReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Library" component={LibraryScreen} options={{ title: 'Mi Biblioteca' }} />
        <Stack.Screen name="Reader" component={ReaderScreen} options={{ title: 'Lector PDF' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}