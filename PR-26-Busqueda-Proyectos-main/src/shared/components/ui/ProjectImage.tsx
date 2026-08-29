/* ============================================================================
 * src/shared/components/ui/ProjectImage.tsx
 * Imagen de un proyecto: primera imagen de project.imagenes (data:base64) o,
 * si no hay o falla, un relleno con ícono. Sirve tanto de miniatura/portada
 * (fallback claro) como de fondo a sangre de una tarjeta estilo Explorar
 * (fallback oscuro, className="absolute inset-0").
 * ========================================================================= */

import { useState } from 'react';
import { FolderKanban, Building2 } from 'lucide-react';

interface ProjectImageProps {
  imagenes?: { id: number; url: string }[];
  alt?: string;
  /** Alto + otras clases del contenedor. Por defecto h-36 w-full. */
  className?: string;
  /** Relleno cuando no hay imagen: claro (miniatura) u oscuro (fondo de tarjeta). */
  fallback?: 'light' | 'dark';
}

export function ProjectImage({
  imagenes,
  alt = 'Proyecto',
  className = 'h-36 w-full',
  fallback = 'light',
}: ProjectImageProps) {
  const [falló, setFalló] = useState(false);
  const url = imagenes?.[0]?.url;
  const mostrarFoto = !!url && !falló;

  return (
    <div className={`overflow-hidden flex items-center justify-center ${className}`}>
      {mostrarFoto ? (
        <img
          src={url!}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setFalló(true)}
        />
      ) : fallback === 'dark' ? (
        <div className="w-full h-full bg-surface-inverse flex items-center justify-center">
          <Building2 className="w-20 h-20 text-white/10" />
        </div>
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
          <FolderKanban className="w-10 h-10 text-primary/40" />
        </div>
      )}
    </div>
  );
}
