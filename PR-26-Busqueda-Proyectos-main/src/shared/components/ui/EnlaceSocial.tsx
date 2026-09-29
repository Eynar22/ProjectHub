/* ============================================================================
 * src/shared/components/ui/EnlaceSocial.tsx
 * Tarjeta de un enlace externo que reconoce la red social por la URL
 * (Facebook, Instagram, LinkedIn, X, YouTube, TikTok, WhatsApp, GitHub) y
 * muestra su ícono y color; cualquier otro dominio se trata como sitio web.
 * ========================================================================= */

import { Facebook, Instagram, Linkedin, Youtube, Twitter, Github, Globe, MessageCircle, Music2, Mail, ExternalLink } from 'lucide-react';
import type { ComponentType } from 'react';

type IconoLucide = ComponentType<{ className?: string }>;

interface Red { nombre: string; icono: IconoLucide; color: string; dominios: string[] }

const REDES: Red[] = [
  { nombre: 'Facebook',  icono: Facebook,      color: '#1877F2', dominios: ['facebook.com', 'fb.com', 'fb.me'] },
  { nombre: 'Instagram', icono: Instagram,     color: '#E4405F', dominios: ['instagram.com', 'instagr.am'] },
  { nombre: 'LinkedIn',  icono: Linkedin,      color: '#0A66C2', dominios: ['linkedin.com', 'lnkd.in'] },
  { nombre: 'X',         icono: Twitter,       color: '#6B7280', dominios: ['x.com', 'twitter.com'] },
  { nombre: 'YouTube',   icono: Youtube,       color: '#FF0000', dominios: ['youtube.com', 'youtu.be'] },
  { nombre: 'TikTok',    icono: Music2,        color: '#EE1D52', dominios: ['tiktok.com'] },
  { nombre: 'WhatsApp',  icono: MessageCircle, color: '#25D366', dominios: ['wa.me', 'whatsapp.com'] },
  { nombre: 'GitHub',    icono: Github,        color: '#6E5494', dominios: ['github.com'] },
];

const SITIO_WEB: Omit<Red, 'dominios'> = { nombre: 'Sitio web', icono: Globe, color: 'var(--color-primary)' };

/** Normaliza la URL (agrega https:// si falta) y detecta la red. */
function analizar(url: string) {
  const esCorreo = url.startsWith('mailto:');
  const href = esCorreo || /^https?:\/\//i.test(url) ? url : `https://${url}`;
  if (esCorreo) return { href, dominio: url.slice(7), red: { nombre: 'Correo', icono: Mail, color: 'var(--color-primary)' } };
  let dominio = url;
  try { dominio = new URL(href).hostname.replace(/^www\./, ''); } catch { /* se muestra tal cual */ }
  const red = REDES.find((r) => r.dominios.some((d) => dominio === d || dominio.endsWith(`.${d}`))) ?? SITIO_WEB;
  return { href, dominio, red };
}

export function EnlaceSocial({ url, nombre }: { url: string; nombre?: string | null }) {
  const { href, dominio, red } = analizar(url.trim());
  const Icono = red.icono;
  // Si el nombre guardado no dice nada útil (vacío o igual a la url), se usa el de la red.
  const titulo = nombre?.trim() && nombre.trim() !== url ? nombre.trim() : red.nombre;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-background p-3 transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-border outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-sm"
        style={{ backgroundColor: red.color }}
      >
        <Icono className="w-5 h-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold leading-tight truncate">{titulo}</span>
        <span className="block text-xs text-muted-foreground truncate mt-0.5">
          {titulo === red.nombre ? dominio : `${red.nombre} · ${dominio}`}
        </span>
      </span>
      <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" aria-hidden="true" />
      <span className="sr-only">(se abre en una pestaña nueva)</span>
    </a>
  );
}
