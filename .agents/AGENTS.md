# Reglas de Proyecto: Zona Elite

## Frontend - Autenticación y Tokens
- **Manejo de Expiración de Sesión (JWT)**: Siempre asegúrate de que el frontend gestione correctamente la expiración de tokens. Cuando el backend responda con 401 o 403 debido a un token expirado o inválido ("Invalid or expired token", "Access token required"), el frontend (`client.ts` o equivalente) debe capturar este error, emitir un evento global (e.g., `session-expired`), limpiar el almacenamiento local (`localStorage`) y cerrar la sesión para mostrar la página de inicio/login de forma elegante. Nunca se debe dejar al usuario bloqueado con una sesión inactiva y un mensaje técnico de error. Tener esto en cuenta al realizar tests semanales o correcciones generales de errores.


