# Cómo probar "Mi Lector PDF" en tu iPhone con Expo Go (¡Gratis!)

¡Buenas noticias! He modificado el código del lector de PDFs para usar un componente **WebView** estándar (soportado por iOS nativamente). Esto significa que **ya no necesitas una cuenta de desarrollador de pago ni EAS Build**. 

Puedes probar la aplicación en tu iPhone usando la aplicación gratuita **Expo Go** de la App Store en menos de un minuto.

Sigue estos pasos sencillos:

---

## Paso 1: Descargar Expo Go en tu iPhone
1. Abre el **App Store** en tu iPhone.
2. Busca y descarga la aplicación **Expo Go** (es gratuita y tiene una "Y" como icono).

---

## Paso 2: Iniciar el servidor de desarrollo en tu computadora
En tu computadora (Windows), abre tu terminal en la carpeta del proyecto y ejecuta:

```bash
npx expo start --tunnel
```

*Nota: Usamos el parámetro `--tunnel` para crear una conexión segura y directa a través de internet. Esto evita fallos si tu computadora y tu iPhone tienen problemas para comunicarse directamente en la misma red Wi-Fi (muy común en firewalls de Windows o routers domésticos).*

Si es la primera vez que usas el túnel, la terminal te preguntará si deseas instalar `@expo/ngrok`. Presiona `Y` (Sí) y presiona Enter para que lo instale automáticamente.

---

## Paso 3: Escanear el código QR y abrir la App
1. Una vez que el comando termine de iniciar, verás un **código QR grande** dibujado en tu terminal de Windows.
2. Abre la app de **Cámara** nativa de tu iPhone y apunta al código QR.
3. Toca la notificación amarilla que aparece para **abrir en "Expo Go"**.
4. ¡Listo! La app se descargará en tu iPhone y podrás importar y leer PDFs de inmediato.

---

### Nota sobre el funcionamiento:
* **Importar PDFs**: Podrás tocar "+ Importar PDF" y seleccionar cualquier archivo PDF que tengas guardado en los archivos locales de tu iPhone o en iCloud Drive.
* **Limitación de página**: Dado que usamos WebView para máxima compatibilidad con Expo Go, al leer el PDF podrás hacer scroll de forma fluida, pero la app no guardará automáticamente el número exacto de página en el que te quedaste, ya que WebView no le reporta esa información a React Native en iOS de forma sencilla. Es una pequeña limitación a cambio de poder probarla gratis en tu iPhone hoy mismo.
