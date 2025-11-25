# Guía del Dashboard "Casa de Andalucía"

¡Tu aplicación ha sido transformada en un dashboard profesional! Aquí tienes una guía rápida de las nuevas funciones y cómo configurarlo.

## 1. Configuración de Firebase (IMPORTANTE)
Para que la aplicación funcione y guarde datos, necesitas configurar Firebase.
1.  Ve a [Firebase Console](https://console.firebase.google.com/) y crea un nuevo proyecto.
2.  Añade una "Web App" a tu proyecto.
3.  Copia el objeto `firebaseConfig` que te dan.
4.  Abre el archivo `static/firebase-config.js` en tu editor.
5.  Reemplaza el código de ejemplo con tus credenciales reales.

> [!NOTE]
> Sin este paso, la aplicación cargará pero no podrás guardar ni ver productos.

## 2. Navegación del Dashboard
El menú lateral te permite moverte entre las tres secciones principales:
-   **🍽️ Menú Principal**: Donde creas nuevos menús seleccionando platos.
-   **⏳ Menús Pendientes**: Menús guardados para terminar más tarde.
-   **📜 Historial**: Registro permanente de todos los menús finalizados.

## 3. Uso Diario

### Crear un Menú
1.  Ve a **Menú Principal**.
2.  Selecciona los platos haciendo clic en las tarjetas.
3.  Verás el resumen a la derecha (o abajo en móvil).
    -   **Pan y Bebida** se suman automáticamente.
4.  Escribe un nombre para la mesa (ej: "Mesa 5").
5.  Elige:
    -   **Guardar en Pendientes**: Si la mesa aún no ha terminado.
    -   **Finalizar y Guardar**: Si ya han pagado y quieres archivarlo.

### Gestionar Productos
-   **Añadir**: Pulsa el botón `+` al lado del título de cada categoría.
-   **Editar/Borrar**: Pasa el ratón sobre un producto y pulsa "Editar".
-   **Ordenar**: Usa el desplegable arriba a la derecha para ordenar por precio, nombre o popularidad.

### Historial
-   Puedes ver todos los menús pasados.
-   Pulsa "Eliminar" para borrar un registro antiguo.

## 4. Personalización
El diseño está centralizado en `static/style.css`. Puedes cambiar fácilmente los colores principales editando las variables al principio del archivo:
```css
:root {
    --color-green-dark: #00583F; /* Tu verde principal */
    --color-gold: #C5A059;       /* Color de acento */
}
```
