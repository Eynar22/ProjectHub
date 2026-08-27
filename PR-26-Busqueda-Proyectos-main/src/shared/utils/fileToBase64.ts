/* ============================================================================
 * src/shared/utils/fileToBase64.ts
 * Convierte un File a data URL base64. Lo usan varios flujos (registro de
 * empresa/empleado, subida de documentos).
 * ========================================================================= */

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}
