/**
 * Comprime una imagen usando Canvas para reducir su peso antes de enviarla al servidor.
 * @param file El archivo original
 * @param maxWidth Ancho máximo (por defecto 1200px)
 * @param quality Calidad JPEG (0.1 a 1.0)
 */
export async function compressImage(file: File, maxWidth = 1200, quality = 0.7): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              // Retornar el más pequeño para no perder calidad si el original ya era pequeño
              resolve(compressedFile.size < file.size ? compressedFile : file);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };
    };
  });
}

/**
 * Valida si un conjunto de archivos supera el límite de Vercel (4.5MB total para base64)
 * @param files Lista de archivos a validar
 * @param maxTotalMB Límite sugerido en MB (3.2MB es seguro para base64)
 */
export function validateTotalSize(files: (File | null | undefined)[], maxTotalMB = 3.2): boolean {
  const totalBytes = files.reduce((acc, file) => acc + (file?.size || 0), 0);
  return totalBytes <= maxTotalMB * 1024 * 1024;
}
