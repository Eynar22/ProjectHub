/* ============================================================================
 * src/shared/components/ui/useAjustarImagen.tsx
 * Hook del editor de fotos del proyecto. Se usa al subir cualquier foto
 * (perfil, logo, galería, imágenes de proyecto) y con el botón "Ajustar"
 * sobre fotos ya subidas.
 *
 *   const { ajustar, editor } = useAjustarImagen();
 *   const file = await ajustar(archivoOUrl, { forma: 'redonda' });   // null = canceló
 *   return <>{...}{editor}</>;
 *
 * Devuelve un File nuevo (JPG, o PNG si el original podía tener transparencia).
 * ========================================================================= */

import { useCallback, useState, type ReactNode } from 'react';
import { EditorImagen } from './AjustarImagen';
import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';

/** De qué foto salió cada resultado del editor (File recién elegido o url ya subida). */
const fuenteDe = new WeakMap<File, File | string>();

/**
 * Sube una foto. Si salió del editor, primero guarda la original completa (o
 * reutiliza la ya subida) y la enlaza, para que "Ajustar" parta siempre de la
 * foto entera. Si no salió del editor, la sube tal cual.
 */
export async function subirAjustada<T extends { url: string }>(
  file: File,
  subir: (f: File, original?: string) => Promise<T>,
): Promise<T> {
  const fuente = fuenteDe.get(file);
  if (!fuente) return subir(file);
  let original: string | undefined;
  try {
    if (fuente instanceof File) original = (await subir(fuente)).url;
    else if (fuente.includes('/api/archivos/')) original = fuente;
  } catch {
    // Sin original solo se pierde poder reajustar desde la foto completa.
  }
  return subir(file, original);
}

export interface Proporcion { etiqueta: string; valor: number }

export const PROPORCIONES = {
  /** Proporción de la propia foto (valor 0 = se calcula al cargarla). Sin recorte. */
  original: { etiqueta: 'Original', valor: 0 },
  cuadrada: { etiqueta: '1:1', valor: 1 },
  vertical: { etiqueta: '4:5', valor: 4 / 5 },
  clasica: { etiqueta: '4:3', valor: 4 / 3 },
  panoramica: { etiqueta: '16:9', valor: 16 / 9 },
  portada: { etiqueta: '3:1', valor: 3 },
} satisfies Record<string, Proporcion>;

export interface OpcionesAjuste {
  titulo?: string;
  /** Redonda para fotos de perfil (el recorte sigue siendo cuadrado, se ve como círculo). */
  forma?: 'redonda' | 'rectangular';
  /** Proporciones que el usuario puede elegir. La primera es la inicial. */
  proporciones?: Proporcion[];
  /** Lado mayor máximo del resultado, en píxeles. */
  maxLado?: number;
}

/** Configuración de cada tipo de foto del proyecto. */
export const AJUSTES = {
  perfil: { titulo: 'Ajustar foto de perfil', forma: 'redonda', proporciones: [PROPORCIONES.cuadrada], maxLado: 600 },
  logo: { titulo: 'Ajustar logo', proporciones: [PROPORCIONES.cuadrada], maxLado: 600 },
  galeria: { titulo: 'Ajustar foto', proporciones: [PROPORCIONES.original, PROPORCIONES.clasica, PROPORCIONES.cuadrada, PROPORCIONES.vertical, PROPORCIONES.panoramica] },
  proyecto: { titulo: 'Ajustar imagen del proyecto', proporciones: [PROPORCIONES.original, PROPORCIONES.panoramica, PROPORCIONES.clasica, PROPORCIONES.cuadrada, PROPORCIONES.portada] },
} satisfies Record<string, OpcionesAjuste>;

export interface Pedido extends OpcionesAjuste {
  url: string;
  nombre: string;
  tipo: string;
  revocar: boolean;
  resolver: (f: File | null) => void;
}

/** Hook: devuelve `ajustar()` (promesa) y el `editor` que hay que renderizar una vez. */
export function useAjustarImagen(): {
  ajustar: (fuente: File | string, opciones?: OpcionesAjuste) => Promise<File | null>;
  ajustarVarios: (archivos: File[], opciones?: OpcionesAjuste) => Promise<File[]>;
  editor: ReactNode;
} {
  const [pedido, setPedido] = useState<Pedido | null>(null);

  const ajustar = useCallback(async (fuente: File | string, opciones: OpcionesAjuste = {}) => {
    let url: string;
    let nombre: string;
    let tipo: string;
    let revocar = true;
    const origen = fuente;
    if (typeof fuente === 'string') {
      // Foto ya subida: si es una recortada, se parte de su original completa.
      try {
        const { url: original } = await apiClient.get<{ url: string | null }>(ENDPOINTS.ARCHIVOS.ORIGINAL, { params: { url: fuente } });
        if (original) fuente = original;
      } catch { /* sin original: se ajusta la que hay */ }
      // Se baja como blob para poder dibujarla en el canvas.
      try {
        const res = await fetch(fuente);
        if (!res.ok) throw new Error();
        const blob = await res.blob();
        url = URL.createObjectURL(blob);
        tipo = blob.type || 'image/jpeg';
      } catch {
        // Si no se pudo bajar (p. ej. data: base64 antiguo), se usa tal cual.
        url = fuente;
        tipo = 'image/jpeg';
        revocar = false;
      }
      nombre = fuente.split('/').pop()?.split('?')[0] || 'imagen';
    } else {
      url = URL.createObjectURL(fuente);
      nombre = fuente.name;
      tipo = fuente.type;
    }
    const resultado = await new Promise<File | null>((resolver) => {
      setPedido({ ...opciones, url, nombre, tipo, revocar, resolver });
    });
    if (resultado) fuenteDe.set(resultado, origen instanceof File ? origen : fuente);
    return resultado;
  }, []);

  /** Ajusta varios archivos uno tras otro. Los cancelados se omiten. */
  const ajustarVarios = useCallback(async (archivos: File[], opciones: OpcionesAjuste = {}) => {
    const listos: File[] = [];
    for (const [i, archivo] of archivos.entries()) {
      const titulo = archivos.length > 1
        ? `${opciones.titulo ?? 'Ajustar foto'} (${i + 1} de ${archivos.length})`
        : opciones.titulo;
      const r = await ajustar(archivo, { ...opciones, titulo });
      if (r) listos.push(r);
    }
    return listos;
  }, [ajustar]);

  const cerrar = (resultado: File | null) => {
    if (!pedido) return;
    if (pedido.revocar) URL.revokeObjectURL(pedido.url);
    pedido.resolver(resultado);
    setPedido(null);
  };

  const editor = pedido ? <EditorImagen key={pedido.url} pedido={pedido} onTerminar={cerrar} /> : null;
  return { ajustar, ajustarVarios, editor };
}

