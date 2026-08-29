/* ============================================================================
 * src/shared/components/ui/Avatar.tsx
 * Avatar de usuario: muestra la foto de perfil (foto_url, normalmente un
 * data:base64) y cae a las iniciales del nombre si no hay foto o si la imagen
 * falla al cargar. Un solo lugar para el patrón "círculo con la inicial" que
 * estaba repetido por toda la app.
 * ========================================================================= */

import { useState } from 'react';

interface AvatarProps {
  name: string;
  src?: string | null;
  /** Tamaño y forma del contenedor. Por defecto w-10 h-10 rounded-full. */
  className?: string;
  /** Colores/tipografía de las iniciales cuando no hay foto. */
  fallbackClassName?: string;
}

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  return (partes[0][0] + (partes[1]?.[0] ?? '')).toUpperCase();
}

export function Avatar({
  name,
  src,
  className = 'w-10 h-10 rounded-full',
  fallbackClassName = 'bg-primary/15 text-primary font-bold',
}: AvatarProps) {
  const [falló, setFalló] = useState(false);
  const mostrarFoto = !!src && !falló;

  return (
    <div className={`overflow-hidden flex items-center justify-center flex-shrink-0 ${className} ${mostrarFoto ? '' : fallbackClassName}`}>
      {mostrarFoto ? (
        <img
          src={src!}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setFalló(true)}
        />
      ) : (
        <span className="leading-none">{iniciales(name)}</span>
      )}
    </div>
  );
}
