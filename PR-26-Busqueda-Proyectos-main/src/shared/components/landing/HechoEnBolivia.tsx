/* ============================================================================
 * src/shared/components/landing/HechoEnBolivia.tsx
 * Mosaico de fotos de Bolivia que conecta el país con los tipos de problemas
 * que se pueden publicar en ProjectHub (y sus ODS). Cada foto hace zoom al
 * pasar el mouse y muestra su descripción; la última celda invita a publicar.
 * Fotos: Unsplash (licencia libre), guardadas en public/images/landing/.
 * ========================================================================= */

import { Link } from 'react-router';
import { ArrowRight, MapPin } from 'lucide-react';
import { Reveal } from '@/shared/components/Reveal';

interface Foto {
  src: string;
  alt: string;
  titulo: string;
  texto: string;
  ods: number[];
  clase: string; // posición en el mosaico
}

const FOTOS: Foto[] = [
  {
    src: '/images/landing/bolivia-teleferico.jpg',
    alt: 'Cabinas del teleférico sobre la ciudad de La Paz',
    titulo: 'Ciudades e infraestructura',
    texto: 'Transporte, servicios y soluciones para ciudades que crecen hacia arriba.',
    ods: [9, 11],
    clase: 'col-span-2 md:row-span-2',
  },
  {
    src: '/images/landing/bolivia-mercado.jpg',
    alt: 'Calle de un mercado con vendedoras y puestos de colores',
    titulo: 'Economía local',
    texto: 'Comercio, emprendimientos y trabajo digno para la gente de aquí.',
    ods: [8],
    clase: 'row-span-2',
  },
  {
    src: '/images/landing/bolivia-murales.jpg',
    alt: 'Casas pintadas con murales de colores en una ladera',
    titulo: 'Comunidades',
    texto: 'Proyectos que nacen del barrio y mejoran la vida de sus vecinos.',
    ods: [11, 10],
    clase: '',
  },
  {
    src: '/images/landing/bolivia-salar.jpg',
    alt: 'Vehículos cruzando el Salar de Uyuni bajo un cielo azul',
    titulo: 'Energía y recursos',
    texto: 'Aprovechar lo que tenemos de forma responsable y sostenible.',
    ods: [7, 12],
    clase: '',
  },
  {
    src: '/images/landing/bolivia-illimani.jpg',
    alt: 'El nevado Illimani sobre las luces de La Paz de noche',
    titulo: 'Agua y clima',
    texto: 'Los glaciares que dan agua a la ciudad necesitan soluciones hoy.',
    ods: [6, 13],
    clase: 'col-span-2',
  },
];

export function HechoEnBolivia() {
  return (
    <section className="relative z-20 py-24 bg-background border-t border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center max-w-3xl mx-auto mb-12">
          <p className="inline-flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-widest mb-3">
            <MapPin className="w-4 h-4" /> Hecho en Bolivia
          </p>
          <h2 className="text-3xl md:text-5xl font-extrabold font-serif mb-4">Problemas de aquí, soluciones de aquí</h2>
          <p className="text-lg text-muted-foreground">
            Cada rincón del país tiene desafíos que una empresa, un profesional o un equipo pueden resolver.
          </p>
        </Reveal>

        <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[200px] md:auto-rows-[230px] gap-3 md:gap-4">
          {FOTOS.map((f, i) => (
            <Reveal key={f.src} delay={i * 0.08} className={f.clase}>
              <figure className="group relative h-full w-full overflow-hidden rounded-3xl bg-muted">
                <img
                  src={f.src}
                  alt={f.alt}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                <span className="absolute top-3 right-3 flex gap-1">
                  {f.ods.map((id) => (
                    <img key={id} src={`/images/ods/${id}.png`} alt={`ODS ${id}`} className="w-7 h-7 rounded-md shadow" />
                  ))}
                </span>

                <figcaption className="absolute inset-x-0 bottom-0 p-4 md:p-5">
                  <p className="text-white font-extrabold text-base md:text-lg leading-tight">{f.titulo}</p>
                  {/* En escritorio el texto aparece al pasar el mouse; en móvil se ve siempre. */}
                  <p className="text-slate-200 text-xs md:text-sm leading-snug mt-1 md:max-h-0 md:opacity-0 md:group-hover:max-h-24 md:group-hover:opacity-100 overflow-hidden transition-all duration-500">
                    {f.texto}
                  </p>
                </figcaption>
              </figure>
            </Reveal>
          ))}

          {/* Celda final: invitación */}
          <Reveal delay={0.4} className="col-span-2">
            <Link
              to="/register"
              className="group relative h-full w-full flex flex-col justify-center rounded-3xl bg-primary p-6 md:p-8 overflow-hidden text-primary-foreground"
            >
              <div aria-hidden="true" className="absolute -right-10 -bottom-10 w-56 h-56 rounded-full bg-white/10 blur-2xl transition-transform duration-700 group-hover:scale-150" />
              <p className="relative text-2xl md:text-3xl font-extrabold leading-tight mb-2">¿Conoces un problema así?</p>
              <p className="relative text-primary-foreground/80 mb-5 max-w-sm">Publícalo en ProjectHub y encuentra quién lo resuelva.</p>
              <span className="relative inline-flex items-center gap-2 font-semibold">
                Publicar un proyecto
                <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </Link>
          </Reveal>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">Fotos: Unsplash.</p>
      </div>
    </section>
  );
}
