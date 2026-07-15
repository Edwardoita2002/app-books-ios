# Cómo ejecutar y probar "Mi Lector PDF" en tu iPhone (desde Windows)

Dado que estás en **Windows** y esta app contiene librerías nativas (`react-native-pdf` y `react-native-blob-util`), **no puedes compilar la app localmente para iOS** (ya que requiere Xcode/macOS) y **tampoco puedes usar la app estándar Expo Go** de la App Store directamente.

La solución oficial de Expo es usar **EAS Build (Expo Application Services)** para compilar la app en la nube y descargar un **Cliente de Desarrollo Personalizado (Development Client)** en tu iPhone.

Sigue estos pasos detallados para lograrlo:

---

## Paso 1: Instalar dependencias locales

Primero, asegúrate de que todas las dependencias del proyecto y la herramienta de desarrollo cliente estén instaladas. Abre tu terminal en la carpeta del proyecto y ejecuta:

```bash
npm install
npx expo install expo-dev-client
```

*(El comando `npm install` ya se completó con éxito en segundo plano. Ahora solo debes abrir tu terminal y ejecutar `npx expo install expo-dev-client` para completar este paso).*

---

## Paso 2: Crear una cuenta en Expo

Si no tienes una, regístrate de forma gratuita en [expo.dev](https://expo.dev/). Esto te permitirá usar sus servidores en la nube para compilar la app.

---

## Paso 3: Instalar EAS CLI e iniciar sesión

1. Instala la herramienta de línea de comandos de EAS globalmente en tu computadora:
   ```powershell
   npm install -g eas-cli
   ```
2. Inicia sesión en tu cuenta de Expo desde la terminal:
   ```powershell
   eas login
   ```
   Introduce tu usuario y contraseña de Expo.

---

## Paso 4: Configuración ya completada (Omitir)

*(Ya he creado el archivo `eas.json` y he conectado tu ID de proyecto `49f115af-f076-4a0e-849e-5883deca2c52` en tu archivo `app.json` por ti. No necesitas ejecutar `eas build:configure` ni `eas init`).*

---

## Paso 5: Registrar tu iPhone y compilar la App

Para poder instalar una app de desarrollo en tu iPhone sin subirla a la App Store, Apple requiere registrar el identificador único de tu dispositivo (UDID). EAS automatiza este proceso:

1. Ejecuta el comando de compilación en desarrollo para iOS:
   ```powershell
   eas build --platform ios --profile development
   ```
2. Durante el proceso:
   - **Inicio de sesión en Apple**: EAS te pedirá iniciar sesión con tu cuenta de Apple (Apple ID). Puedes usar una cuenta gratuita.
   - **Registro de dispositivo**: EAS te mostrará un código QR en la terminal. **Escanea este código QR con la cámara de tu iPhone**. Te guiará para instalar un perfil de configuración temporal de Expo que registrará el UDID de tu iPhone de forma segura.
   - **Compilación**: Una vez registrado el dispositivo, EAS comenzará a compilar la app en sus servidores. Esto puede tardar unos minutos.

---

## Paso 6: Instalar la App en tu iPhone

1. Al finalizar la compilación en la terminal, aparecerá un **nuevo código QR** y un enlace.
2. **Escanea ese código QR con tu iPhone** para descargar e instalar la app (se instalará con el nombre "Mi Lector PDF").
3. **Activar el Modo Desarrollador en tu iPhone (Requerido en iOS 16+)**:
   - En tu iPhone, ve a **Ajustes** -> **Privacidad y seguridad**.
   - Desplázate hacia abajo hasta encontrar **Modo de desarrollador**.
   - Actívalo y reinicia tu iPhone cuando te lo pida.
   - Al reiniciar, confirma que deseas activarlo e introduce tu código.

---

## Paso 7: Ejecutar el Servidor Local y Conectar

Ahora que tienes tu cliente de desarrollo personalizado en el iPhone, puedes ejecutar tu código local en él:

1. En tu computadora (Windows), inicia el servidor de desarrollo:
   ```powershell
   npx expo start --dev-client
   ```
2. Asegúrate de que **tu computadora y tu iPhone estén conectados a la misma red Wi-Fi**.
3. Abre la app "Mi Lector PDF" que instalaste en tu iPhone.
4. Escanea el código QR que se muestra en tu terminal de Windows usando la app instalada (o usa la cámara si la app te lo indica).
5. ¡Listo! Tu app se cargará y podrás ver y probar el lector de PDFs con SQLite en tu iPhone de forma 100% nativa.

---

### Solución de problemas de red (Wi-Fi)
Si tu red Wi-Fi bloquea las conexiones locales (común en redes públicas o con aislamiento de AP), puedes iniciar el servidor usando un túnel seguro ejecutando:
```powershell
npx expo start --dev-client --tunnel
```
*(Nota: Si usas `--tunnel` por primera vez, Expo te preguntará si deseas instalar `@expo/ngrok`, dile que sí).*
