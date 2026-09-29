/* ============================================================================
 * src/shared/components/ui/AjustarImagen.tsx
 * Editor de fotos (recortar, mover, zoom, rotar, proporción) y el botón
 * "Ajustar" para miniaturas. Se abre con el hook useAjustarImagen().
 * ========================================================================= */

import { useEffect, useRef, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { Crop, RotateCcw, RotateCw, ZoomIn, ZoomOut, Undo2 } from 'lucide-react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { PROPORCIONES, type Pedido } from './useAjustarImagen';

/** Zoom menor a 1 permite alejar la foto para que entre completa (el sobrante queda con fondo). */
const MIN_ZOOM = 0.5;

export function EditorImagen({ pedido, onTerminar }: { pedido: Pedido; onTerminar: (f: File | null) => void }) {
  const proporciones = pedido.proporciones?.length ? pedido.proporciones : [PROPORCIONES.cuadrada];
  const redonda = pedido.forma === 'redonda';

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotacion, setRotacion] = useState(0);
  // Proporción elegida (índice) y proporción real de la foto, para la opción "Original".
  const [elegida, setElegida] = useState(0);
  const [aspectoFoto, setAspectoFoto] = useState(1);
  const rotada = Math.abs(rotacion) % 180 === 90;
  const aspecto = proporciones[elegida].valor || (rotada ? 1 / aspectoFoto : aspectoFoto);
  const [area, setArea] = useState<Area | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const terminado = useRef(false);

  // Si se desmonta sin confirmar (p. ej. cambio de página), se trata como cancelar.
  useEffect(() => () => { if (!terminado.current) onTerminar(null); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const reiniciar = () => { setCrop({ x: 0, y: 0 }); setZoom(1); setRotacion(0); setElegida(0); };

  const confirmar = async () => {
    if (!area) return;
    setGuardando(true);
    setError(null);
    try {
      const file = await recortar(pedido.url, area, rotacion, pedido.tipo, pedido.nombre, pedido.maxLado ?? 1600);
      terminado.current = true;
      onTerminar(file);
    } catch {
      setError('No se pudo procesar la imagen. Prueba con otra foto.');
      setGuardando(false);
    }
  };

  const cancelar = () => { terminado.current = true; onTerminar(null); };

  return (
    <Modal
      open
      onClose={cancelar}
      titulo={pedido.titulo ?? 'Ajustar foto'}
      size="lg"
      acciones={
        <>
          <Button variant="outline" onClick={cancelar} disabled={guardando}>Cancelar</Button>
          <Button variant="primary" onClick={confirmar} disabled={guardando || !area}>
            {guardando ? 'Guardando…' : 'Aplicar'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="relative w-full h-[min(60vh,420px)] rounded-2xl overflow-hidden bg-neutral-900">
          <Cropper
            image={pedido.url}
            crop={crop}
            zoom={zoom}
            rotation={rotacion}
            aspect={aspecto}
            cropShape={redonda ? 'round' : 'rect'}
            showGrid={!redonda}
            minZoom={MIN_ZOOM}
            restrictPosition={false}
            onMediaLoaded={(m) => setAspectoFoto(m.naturalWidth / m.naturalHeight)}
            maxZoom={4}
            zoomSpeed={0.2}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotacion}
            onCropComplete={(_, px) => setArea(px)}
          />
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Arrastra para mover la foto. Usa la rueda del mouse, el control de zoom o dos dedos para acercar o alejar. Elige «Original» para no recortarla.
        </p>

        {/* Zoom */}
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - 0.2))} aria-label="Alejar"
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
            <ZoomOut className="w-4 h-4" />
          </button>
          <input
            type="range" min={MIN_ZOOM} max={4} step={0.01} value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            aria-label="Zoom"
            className="flex-1 accent-[var(--color-primary)]"
          />
          <button type="button" onClick={() => setZoom((z) => Math.min(4, z + 0.2))} aria-label="Acercar"
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Proporción */}
          {proporciones.length > 1 ? (
            <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Proporción">
              <Crop className="w-4 h-4 text-muted-foreground mr-1" aria-hidden="true" />
              {proporciones.map((p, i) => (
                <button
                  key={p.etiqueta}
                  type="button"
                  role="radio"
                  aria-checked={elegida === i}
                  onClick={() => { setElegida(i); setCrop({ x: 0, y: 0 }); setZoom(1); }}
                  className={`px-3 h-9 rounded-full text-xs font-semibold border transition-colors ${
                    elegida === i ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'
                  }`}
                >
                  {p.etiqueta}
                </button>
              ))}
            </div>
          ) : <span />}

          {/* Rotación y reinicio */}
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setRotacion((r) => (r - 90) % 360)} aria-label="Rotar a la izquierda"
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => setRotacion((r) => (r + 90) % 360)} aria-label="Rotar a la derecha"
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
              <RotateCw className="w-4 h-4" />
            </button>
            <button type="button" onClick={reiniciar}
              className="ml-1 px-3 h-9 rounded-full text-xs font-semibold flex items-center gap-1.5 hover:bg-muted transition-colors">
              <Undo2 className="w-4 h-4" /> Restablecer
            </button>
          </div>
        </div>

        {error && <p role="alert" className="text-sm text-danger-strong">{error}</p>}
      </div>
    </Modal>
  );
}

/* ─────────────── Recorte en canvas ─────────────── */

function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((ok, fallo) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = fallo;
    img.src = src;
  });
}

/** Aplica rotación + recorte y devuelve un File. `area` viene en píxeles de la imagen rotada. */
async function recortar(src: string, area: Area, rotacion: number, tipo: string, nombre: string, maxLado: number): Promise<File> {
  const img = await cargarImagen(src);
  const rad = (rotacion * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const anchoRot = img.width * cos + img.height * sin;
  const altoRot = img.width * sin + img.height * cos;

  // 1) Imagen rotada completa.
  const lienzo = document.createElement('canvas');
  lienzo.width = Math.round(anchoRot);
  lienzo.height = Math.round(altoRot);
  const ctx = lienzo.getContext('2d')!;
  ctx.translate(anchoRot / 2, altoRot / 2);
  ctx.rotate(rad);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);

  // 2) Recorte, escalado para no pasar de maxLado.
  const escala = Math.min(1, maxLado / Math.max(area.width, area.height));
  const salida = document.createElement('canvas');
  salida.width = Math.round(area.width * escala);
  salida.height = Math.round(area.height * escala);
  const sctx = salida.getContext('2d')!;
  sctx.imageSmoothingQuality = 'high';
  // PNG solo si el original podía tener transparencia (logos); si no, JPG más liviano.
  const png = tipo === 'image/png' || tipo === 'image/webp' || tipo === 'image/gif';
  // El área puede salirse de la foto (zoom < 1 o foto movida al borde): el sobrante
  // queda transparente en PNG y blanco en JPG, en vez de estirar o desplazar la foto.
  if (!png) { sctx.fillStyle = '#fff'; sctx.fillRect(0, 0, salida.width, salida.height); }
  sctx.drawImage(lienzo, -area.x * escala, -area.y * escala, lienzo.width * escala, lienzo.height * escala);

  const mime = png ? 'image/png' : 'image/jpeg';
  const blob = await new Promise<Blob>((ok, fallo) =>
    salida.toBlob((b) => (b ? ok(b) : fallo(new Error('toBlob'))), mime, 0.9),
  );
  const base = nombre.replace(/\.[^.]+$/, '') || 'imagen';
  return new File([blob], `${base}.${png ? 'png' : 'jpg'}`, { type: mime });
}

/* ─────────────── Botón "Ajustar" para miniaturas ─────────────── */

/** Botón pequeño que se superpone a una miniatura para volver a ajustarla. */
export function BotonAjustar({ onClick, className = '' }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Ajustar foto"
      title="Ajustar foto"
      className={`inline-flex items-center gap-1 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur px-2 py-1 text-[11px] font-semibold text-white transition-colors ${className}`}
    >
      <Crop className="w-3.5 h-3.5" /> Ajustar
    </button>
  );
}
