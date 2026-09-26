/* ============================================================================
 * src/shared/components/landing/ParaQuien.tsx
 * Sección "¿Para quién es ProjectHub?" del landing: una tarjeta con foto por
 * tipo de usuario (empresa, profesional independiente, equipo), con lo que
 * puede hacer y un botón a su acción.
 * Efectos: la tarjeta se inclina siguiendo el mouse, la foto hace zoom y el
 * borde se ilumina con el color del perfil. Respeta prefers-reduced-motion.
 * Fotos: Unsplash (licencia libre), guardadas en public/images/landing/.
 * ========================================================================= */

import { type MouseEvent } from 'react';
import { Link } from 'react-router';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';
import { ArrowRight, Building2, CheckCircle2, Lightbulb, Users, type LucideIcon } from 'lucide-react';
import { Reveal } from '@/shared/components/Reveal';

interface Perfil {
  icon: LucideIcon;
  etiqueta: string;
  titulo: string;
  texto: string;
  puntos: string[];
  cta: { texto: string; to: string };
  foto: string;
  alt: string;
  color: string;
}

const PERFILES: Perfil[] = [
  {
    icon: Building2,
    etiqueta: 'Tengo un problema',
    titulo: 'Empresas',
    texto: 'Publica el problema que quieres resolver y recibe propuestas de profesionales y equipos.',
    puntos: ['Publica proyectos con fechas y financiamiento', 'Declara a qué ODS aporta', 'Revisa propuestas y elige la mejor'],
    cta: { texto: 'Registrar mi empresa', to: '/register' },
    foto: '/images/landing/empresas.jpg',
    alt: 'Equipo de una empresa planificando frente a una pizarra con notas',
    color: '#2563eb',
  },
  {
    icon: Lightbulb,
    etiqueta: 'Sé cómo resolverlo',
    titulo: 'Profesionales independientes',
    texto: 'Encuentra proyectos reales donde aportar lo que sabes, sin necesidad de pertenecer a una empresa.',
    puntos: ['Explora proyectos abiertos', 'Postula con tu propuesta y tu CV', 'Súmate al equipo si te aceptan'],
    cta: { texto: 'Ver proyectos abiertos', to: '/explore' },
    foto: '/images/landing/profesionales.jpg',
    alt: 'Profesional sonriendo con su laptop',
    color: '#6366f1',
  },
  {
    icon: Users,
    etiqueta: 'Trabajo en una empresa',
    titulo: 'Equipos de trabajo',
    texto: 'Únete a tu empresa y colabora en cada proyecto con todo el equipo en el mismo lugar.',
    puntos: ['Tablero de tareas con responsables', 'Chat del proyecto', 'Archivos y carpetas compartidos'],
    cta: { texto: 'Unirme a mi empresa', to: '/register' },
    foto: '/images/landing/equipos.jpg',
    alt: 'Equipo trabajando junto en una mesa con sus laptops',
    color: '#d97706',
  },
];

export function ParaQuien() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
      {PERFILES.map((p, i) => (
        <Reveal key={p.titulo} delay={i * 0.12} className="h-full [perspective:1200px]">
          <TarjetaPerfil perfil={p} />
        </Reveal>
      ))}
    </div>
  );
}

function TarjetaPerfil({ perfil: p }: { perfil: Perfil }) {
  const reducir = useReducedMotion();

  // Inclinación 3D suave según la posición del mouse dentro de la tarjeta.
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rotX = useSpring(useTransform(my, [0, 1], [6, -6]), { stiffness: 200, damping: 20 });
  const rotY = useSpring(useTransform(mx, [0, 1], [-6, 6]), { stiffness: 200, damping: 20 });

  const mover = (e: MouseEvent<HTMLDivElement>) => {
    if (reducir) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  };
  const salir = () => { mx.set(0.5); my.set(0.5); };

  return (
    <motion.div
      onMouseMove={mover}
      onMouseLeave={salir}
      style={{ rotateX: reducir ? 0 : rotX, rotateY: reducir ? 0 : rotY, ['--c' as string]: p.color }}
      whileHover={reducir ? undefined : { y: -8 }}
      transition={{ type: 'spring', stiffness: 250, damping: 22 }}
      className="group relative h-full flex flex-col rounded-3xl bg-card border border-border/60 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-[var(--c)] hover:shadow-[0_20px_60px_-15px_var(--c)] transition-[border-color,box-shadow] duration-500"
    >
      {/* Foto */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={p.foto}
          alt={p.alt}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
        <span
          className="absolute top-4 left-4 rounded-full px-3 py-1 text-xs font-bold text-white backdrop-blur-md shadow-sm"
          style={{ backgroundColor: `${p.color}cc` }}
        >
          {p.etiqueta}
        </span>
      </div>

      {/* Ícono que monta sobre la foto */}
      <div
        className="relative -mt-8 ml-6 w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110"
        style={{ backgroundColor: p.color }}
      >
        <p.icon className="w-7 h-7" />
      </div>

      <div className="flex-1 flex flex-col p-6 pt-4">
        <h3 className="text-2xl font-extrabold font-serif mb-2 text-foreground">{p.titulo}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed mb-5">{p.texto}</p>

        <ul className="space-y-2.5 mb-6">
          {p.puntos.map((punto, i) => (
            <li
              key={punto}
              className="flex items-start gap-2 text-sm text-foreground transition-transform duration-300 group-hover:translate-x-1"
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: p.color }} />
              {punto}
            </li>
          ))}
        </ul>

        <Link
          to={p.cta.to}
          className="mt-auto inline-flex items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm font-semibold border border-border/70 text-foreground transition-colors duration-300 group-hover:text-white group-hover:border-transparent group-hover:bg-[var(--c)]"
        >
          {p.cta.texto}
          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
    </motion.div>
  );
}
