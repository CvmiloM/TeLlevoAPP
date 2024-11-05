# TeLlevoAPP

![Mono Bailando](https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMmp4aWFobmY0ZmIyY2hnNDNjOXRzMmh5YjU1a2tycXpobTZ3Y2J5aSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/kr0OMSLiyKUF2/giphy.gif)



TeLlevoAPP es una aplicación móvil desarrollada en Ionic Angular que conecta a estudiantes que tienen transporte propio con aquellos que necesitan transporte para regresar a casa después de clases. La aplicación facilita la creación y aceptación de viajes, promoviendo el compañerismo y reduciendo la huella de carbono.

## Características

- **Registro e Inicio de Sesión**: Autenticación mediante correo electrónico y contraseña utilizando Firebase Authentication.
- **Selección de Rol**: Los usuarios pueden elegir entre ser conductores o pasajeros.
- **Creación de Viajes**: Los conductores pueden crear viajes especificando el destino, costo por persona y número de asientos disponibles.
- **Aceptación de Viajes**: Los pasajeros pueden ver los viajes disponibles y aceptar uno. Al hacerlo, reservan un asiento y pueden ver la ruta y la ubicación del conductor.
- **Mapa en Tiempo Real**: Utiliza Mapbox para mostrar rutas y ubicaciones en tiempo real.
- **Historial de Viajes**: Los usuarios pueden ver un historial de los viajes que han creado o aceptado.

## Tecnologías Utilizadas

- **Ionic Angular**: Framework para el desarrollo de aplicaciones híbridas.
- **Firebase**: Utilizado para la autenticación y la base de datos en tiempo real.
- **Mapbox**: Integración de mapas y visualización de rutas.
- **Capacitor Geolocation**: Para obtener la ubicación actual del usuario.

## Instalación

Para ejecutar esta aplicación localmente, sigue estos pasos:

### Prerrequisitos

Asegúrate de tener instalados:

- [Node.js](https://nodejs.org/)
- [Ionic CLI](https://ionicframework.com/docs/cli)
- [Firebase CLI](https://firebase.google.com/docs/cli)
- [Capacitor CLI](https://capacitorjs.com/docs/getting-started/with-ionic)

### Pasos de Instalación

1. Clona este repositorio:

   ```bash
   git clone https://github.com/tu-usuario/TeLlevoAPP.git
2. Navega al directorio del proyecto:
   ```bash
   cd TeLlevoAPP

3. Instala las dependencias del proyecto:
    ```bash
    npm install
4. Configura Firebase:
   - Crea un proyecto en Firebase Console.
   - Agrega la configuración de Firebase en environment.ts y environment.prod.ts.
5. Instala Capacitor Plugins:
   ```bash
   npm install @capacitor/core @capacitor/cli
   npm install @capacitor/geolocation @capacitor/google-maps
6. Sincroniza Capacitor:
   ```bash
   npx cap sync
7. Inicia la aplicación en tu navegador:
   ```bash
   ionic serve
## Publicación del APK

- **Compila la aplicación para Android:
   ```bash
    ionic build
    npx cap add android
    npx cap open android
## Publicación del APK
Las contribuciones son bienvenidas. Si deseas mejorar esta aplicación o agregar nuevas funcionalidades, no dudes en hacer un fork y enviar un pull request.

## Licencia
Este proyecto está licenciado bajo la Licencia MIT.


### Explicación

1. **Introducción**: Descripción general de la aplicación.
2. **Características**: Lista de funcionalidades principales.
3. **Tecnologías Utilizadas**: Breve mención de las tecnologías clave.
4. **Instalación**: Pasos detallados para configurar el proyecto localmente.
5. **Publicación del APK**: Instrucciones para compilar y publicar el APK.
6. **Contribución**: Invitación para colaborar en el proyecto.
7. **Licencia**: Información sobre la licencia del proyecto.

Puedes modificar el enlace del repositorio de GitHub y los detalles específicos de la configuración de Firebase según tu proyecto.

