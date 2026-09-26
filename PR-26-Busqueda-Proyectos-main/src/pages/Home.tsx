import { useState } from 'react';
import { Link } from 'react-router';
import { motion, useScroll, useTransform } from 'motion/react';
import { Button } from '@/shared/components/ui/Button';
import { Reveal } from '@/shared/components/Reveal';
import { AppLayout } from '@/shared/components/layout/AppLayout';
import { useApp } from '@/app/context/AppContext';
import { useProyectos } from '@/features/proyectos';
import { useEmpresas } from '@/features/empresas';
import { ODS_LIST } from '@/shared/constants/ods';
import { HeroDemo } from '@/shared/components/landing/HeroDemo';
import { ComoFunciona } from '@/shared/components/landing/ComoFunciona';
import { ParaQuien } from '@/shared/components/landing/ParaQuien';
import { PorQueExiste } from '@/shared/components/landing/PorQueExiste';
import { TodoEnUnLugar } from '@/shared/components/landing/TodoEnUnLugar';
import { CtaFinal } from '@/shared/components/landing/CtaFinal';
import {
  Building2,
  ArrowRight,
  Globe,
  Search,
  FolderUp,
  ShieldCheck,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

const textContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.2 } }
};

const textItem = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
};

// Imagen de fondo de la sección "Impacto Sostenible". TEMPORAL: es de prueba,
// reemplazar luego por la definitiva (idealmente subida a public/images/).
const IMPACTO_BG_URL =
  'https://www.cidob.org/sites/default/files/2024-12/El%20m%C3%B3n%20el%202025_web.jpg';


export default function Home() {
  const { currentUser } = useApp();
  const { data: projects = [] } = useProyectos();
  const { data: empresas = [] } = useEmpresas();

  // Hooks para el efecto de "Zoom Out" del hero
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 500], [1, 0.85]);
  const heroY = useTransform(scrollY, [0, 500], [0, 60]);

  // Cálculos ODS
  const odsConteo = ODS_LIST.map(o => ({
    ...o,
    total: projects.filter(p => Array.isArray(p.ods) && p.ods.includes(o.id)).length,
  })).sort((a, b) => b.total - a.total);
  const totalAportes = odsConteo.reduce((s, o) => s + o.total, 0);
  const proyectosConOds = projects.filter(p => Array.isArray(p.ods) && p.ods.length > 0).length;
  const odsCubiertos = odsConteo.filter(o => o.total > 0).length;
  const proyectosEnCurso = projects.filter(p => p.estado === 'en_curso').length;
  const empresasVerificadas = empresas.filter(e => e.estado === 'aprobado').length;
  // Proyecto real para la demo del hero: el más reciente en curso que tenga problema declarado.
  const proyectoDestacado = [...projects]
    .filter(p => p.estado === 'en_curso' && !p.suspendido && (p.problema || p.descripcion_corta))
    .sort((a, b) => (b.fecha_creacion ?? '').localeCompare(a.fecha_creacion ?? ''))[0];

  const [activeOdsId, setActiveOdsId] = useState<number | string>(1);
  const sortedOds = [...odsConteo].sort((a, b) => Number(a.id) - Number(b.id));
  const activeOds = sortedOds.find(o => o.id === activeOdsId) || sortedOds[0];

  return (
    <AppLayout
      sinSidebar={!currentUser}
      isAdmin={currentUser?.rol === 'superadmin'}
      sinFooter
      mainClassName="flex-1 w-full"
    >
      <div className="relative w-full -mt-20 md:-mt-24">

        {/* ======================================= */}
        {/* HERO SECTION - FONDO FIJO, CONTENIDO 3D */}
        {/* ======================================= */}
        <section className="relative h-[130vh] w-full z-0">
          <div className="sticky top-0 h-[100dvh] w-full bg-[#05050A] overflow-hidden">

            {/* 1. FONDO ESTÁTICO: retícula de puntos + resplandores (antes: foto de stock del espacio,
                repetida en la sección "Por qué existe"). */}
            <div aria-hidden="true" className="absolute inset-0 opacity-[0.18] [background-image:radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.6)_1px,transparent_0)] [background-size:28px_28px]" />
            <div aria-hidden="true" className="absolute -top-40 -left-40 w-[40rem] h-[40rem] rounded-full bg-primary/25 blur-[140px]" />
            <div aria-hidden="true" className="absolute -bottom-40 right-0 w-[36rem] h-[36rem] rounded-full bg-indigo-500/20 blur-[140px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#05050A] via-transparent to-transparent opacity-90" />

            {/* 2. CONTENIDO ANIMADO */}
            <motion.div
              style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
              className="absolute inset-0 w-full h-full flex flex-col justify-center overflow-hidden"
            >
              <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 md:pb-24">

                <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 items-center relative z-20 pointer-events-none">

                  <motion.div variants={textContainer} initial="hidden" animate="show" className="max-w-xl pointer-events-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-primary/20 border border-primary/30 text-blue-400 text-xs font-bold tracking-wide backdrop-blur-sm uppercase">
                      <Sparkles className="w-4 h-4" /> Proyectos con propósito en Bolivia
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 leading-[1.1] tracking-tight drop-shadow-lg text-white">
                      Publica tu problema. <br/>
                      <span className="text-primary italic font-serif">Encuentra quién</span><br/>
                      lo resuelve.
                    </h1>

                    <motion.p variants={textItem} className="text-base md:text-lg text-slate-300 mb-8 leading-relaxed max-w-md font-medium">
                      Las empresas publican proyectos con un problema real. Profesionales y equipos postulan con su propuesta de solución.
                      Y cuando el proyecto arranca, las tareas, el chat y los archivos quedan en un solo lugar.
                    </motion.p>

                    <motion.div variants={textItem} className="flex flex-col sm:flex-row gap-3">
                      <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white bg-primary hover:bg-indigo-600 shadow-[0_0_40px_rgba(37,99,235,0.4)] transition-all">
                        Crear cuenta
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                      <Link to="/explore" className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white border border-white/25 bg-white/5 hover:bg-white/10 backdrop-blur-sm transition-all">
                        <Search className="w-5 h-5" />
                        Ver proyectos abiertos
                      </Link>
                    </motion.div>

                    <motion.p variants={textItem} className="mt-5 text-sm text-slate-400 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-400" />
                      Cada empresa pasa una revisión antes de publicar.
                    </motion.p>
                  </motion.div>

                  {/* Demo del flujo: publicar → propuestas → aceptar → tablero */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.3 }}
                    className="hidden lg:block pointer-events-auto"
                  >
                    <HeroDemo proyecto={proyectoDestacado} />
                  </motion.div>

                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ======================================= */}
        {/* SECCIÓN 2: ¿QUÉ ES PROJECTHUB?          */}
        {/* ======================================= */}
        <section id="para-quien" className="scroll-mt-16 relative z-20 bg-gradient-to-b from-primary/5 via-muted/30 to-background border-t border-border pt-24 pb-24 shadow-[0_-20px_60px_rgba(0,0,0,0.5)]">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.15] [background-image:radial-gradient(circle_at_1px_1px,var(--color-border)_1px,transparent_0)] [background-size:24px_24px]" />

          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div
              animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.05, 1] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-[10%] -left-[10%] w-[45rem] h-[45rem] bg-primary/10 rounded-full blur-[130px]"
            />
            <motion.div
              animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute bottom-[-10%] -right-[5%] w-[35rem] h-[35rem] bg-indigo-500/10 rounded-full blur-[120px]"
            />
          </div>

          <Reveal className="absolute -top-10 md:-top-14 left-1/2 -translate-x-1/2 w-full max-w-5xl px-4 sm:px-6 lg:px-8 z-30">
            <div className="bg-card/95 backdrop-blur-2xl p-2 rounded-[2rem] md:rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-border/50 flex flex-col md:flex-row items-center gap-2 md:gap-0">

              {/* Cifras reales (antes eran filtros de sector/ubicación que no filtraban nada). */}
              {[
                { icon: FolderUp, valor: proyectosEnCurso, etiqueta: proyectosEnCurso === 1 ? 'Proyecto en curso' : 'Proyectos en curso' },
                { icon: Building2, valor: empresasVerificadas, etiqueta: empresasVerificadas === 1 ? 'Empresa verificada' : 'Empresas verificadas' },
                { icon: Globe, valor: odsCubiertos, etiqueta: 'ODS con aportes' },
              ].map((c) => (
                <div key={c.etiqueta} className="flex-1 w-full flex items-center gap-3 px-4 md:px-6 py-2 md:py-0 md:border-r border-border/50">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <c.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl md:text-2xl font-extrabold text-foreground leading-none">{c.valor}</span>
                    <span className="text-[10px] md:text-xs text-muted-foreground font-bold uppercase tracking-wider">{c.etiqueta}</span>
                  </div>
                </div>
              ))}

              <div className="w-full md:w-auto px-2 pb-2 md:p-0 md:pr-1">
                <Link to="/explore" className="w-full block">
                  <Button variant="primary" className="w-full md:w-auto rounded-[1.5rem] md:rounded-full px-8 py-3.5 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all">
                    <Search className="w-5 h-5" />
                    <span className="text-sm md:text-base">Explorar</span>
                  </Button>
                </Link>
              </div>

            </div>
          </Reveal>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <Reveal className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-extrabold mb-4 font-serif">
                ¿Para quién es <span className="text-primary font-sans">Project</span>Hub?
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground">
                Para quien tiene un problema que resolver, para quien sabe cómo resolverlo y para el equipo que lo lleva a cabo.
              </p>
            </Reveal>

            <ParaQuien />
          </div>
        </section>

        {/* SECCIÓN 3: POR QUÉ EXISTE (del caos al orden) */}
        <PorQueExiste />

        {/* SECCIÓN 4: CÓMO FUNCIONA (recorrido con scroll) */}
        <ComoFunciona />

        {/* SECCIÓN: TODO EN UN SOLO LUGAR (demo jugable) */}
        <TodoEnUnLugar />


        {/* ======================================= */}
        {/* SECCIÓN 5: ALINEACIÓN CON LOS ODS (RUEDA INTERACTIVA) */}
        {/* ======================================= */}
        <section id="impacto" className="scroll-mt-16 relative z-20 py-24 border-t border-border/50 overflow-hidden">

          {/* Imagen de fondo (temporal — ver IMPACTO_BG_URL) */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${IMPACTO_BG_URL}')` }}
          />
          {/* Velo: más denso arriba (títulos) y suave sobre la rueda, para que
              la imagen se vea pero el texto siga legible. Ajustar los /NN. */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/40 to-background/65" />

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <Reveal className="text-center mb-10 md:mb-16">
              <p className="inline-flex items-center justify-center gap-2 text-sm font-bold text-primary uppercase tracking-widest mb-3">
                <Globe className="w-4 h-4" /> Impacto Sostenible
              </p>
              <h2 className="text-3xl md:text-5xl font-extrabold mb-4 font-serif">
                Aportando a los <span className="text-primary">ODS de la ONU</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Cada empresa indica a qué Objetivos de Desarrollo Sostenible aporta su proyecto.{' '}
                {proyectosConOds > 0
                  ? <>Hoy <strong className="text-foreground">{proyectosConOds}</strong> {proyectosConOds === 1 ? 'proyecto suma' : 'proyectos suman'} <strong className="text-foreground">{totalAportes}</strong> {totalAportes === 1 ? 'aporte' : 'aportes'} a <strong className="text-foreground">{odsCubiertos}</strong> de los 17 objetivos.</>
                  : <>Sé el primero en publicar un proyecto con impacto.</>}
                {' '}Toca un objetivo para ver cuántos proyectos trabajan en él.
              </p>
            </Reveal>

            <div className="relative w-full max-w-[320px] sm:max-w-[480px] md:max-w-[620px] aspect-square mx-auto mt-12 md:mt-24">

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[55%] h-[55%] md:w-[50%] md:h-[50%] rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.3)] transition-all duration-500 z-20 border border-white/20">
                {activeOds && (
                  <img
                    src={`/images/ods/${activeOds.id}.png`}
                    alt={activeOds.nombre}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-x-0 bottom-0 flex justify-center p-3 md:p-4 bg-gradient-to-t from-black/60 to-transparent">
                  <div className="bg-black/40 px-4 md:px-6 py-1.5 md:py-2 rounded-full backdrop-blur-md border border-white/10 shadow-inner">
                    <span className="text-[10px] md:text-sm font-bold tracking-widest text-white whitespace-nowrap uppercase">
                      {!activeOds?.total
                        ? 'Aún sin proyectos'
                        : `${activeOds.total} ${activeOds.total === 1 ? 'proyecto' : 'proyectos'}`}
                    </span>
                  </div>
                </div>
              </div>

              {sortedOds.map((o, index) => {
                const angle = (index * (360 / 17)) - 90;
                const radians = angle * (Math.PI / 180);
                const radius = 48;
                const left = `calc(50% + ${Math.cos(radians) * radius}%)`;
                const top = `calc(50% + ${Math.sin(radians) * radius}%)`;
                const isActive = activeOdsId === o.id;

                return (
                  <button
                    key={o.id}
                    onClick={() => setActiveOdsId(o.id)}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 sm:w-[4.5rem] sm:h-[4.5rem] md:w-24 md:h-24 rounded-2xl overflow-hidden shadow-lg border-2 transition-all duration-300 focus:outline-none ${
                      isActive
                        ? 'scale-125 z-30 border-white shadow-xl'
                        : 'border-transparent opacity-95 hover:opacity-100 hover:scale-110 hover:z-30 hover:border-white/60 cursor-pointer'
                    }`}
                    style={{ left, top }}
                    title={o.nombre}
                    aria-label={`ODS ${o.id}: ${o.nombre}, ${o.total} ${o.total === 1 ? 'proyecto' : 'proyectos'}`}
                    aria-pressed={isActive}
                  >
                    <img
                      src={`/images/ods/${o.id}.png`}
                      alt={o.nombre}
                      className="w-full h-full object-cover"
                    />
                  </button>
                )
              })}
            </div>

            {/* Nombre del objetivo en texto: la insignia sola no se lee bien en móvil. */}
            {activeOds && (
              <div className="mt-16 md:mt-24 text-center" aria-live="polite">
                <p className="text-sm font-bold uppercase tracking-widest" style={{ color: activeOds.color }}>
                  ODS {activeOds.id}
                </p>
                <p className="text-2xl md:text-3xl font-extrabold font-serif mb-5">{activeOds.nombre}</p>
                <Link to="/explore" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                  Ver proyectos abiertos <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

          </div>
        </section>

        {/* ======================================= */}
        {/* PREGUNTAS FRECUENTES                    */}
        {/* ======================================= */}
        <section id="preguntas" className="scroll-mt-16 relative z-20 py-24 bg-muted/30 border-t border-border/50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-extrabold mb-4 font-serif">Preguntas frecuentes</h2>
            </Reveal>
            <div className="space-y-3">
              {[
                { q: '¿Quién puede publicar proyectos?', a: 'El administrador de una empresa registrada y aprobada. Al registrar tu empresa subes su documentación; el equipo de ProjectHub la revisa y, una vez aprobada, ya puedes publicar.' },
                { q: '¿Puedo postular sin pertenecer a una empresa?', a: 'Sí. Crea una cuenta como profesional independiente y postula a cualquier proyecto abierto con tu propuesta de solución y tu CV.' },
                { q: '¿Cómo me uno al equipo de mi empresa?', a: 'Regístrate eligiendo tu empresa y adjunta un documento que acredite que trabajas ahí. El administrador de la empresa aprueba tu solicitud.' },
                { q: '¿Qué pasa cuando aceptan mi postulación?', a: 'Pasas a formar parte del grupo de trabajo del proyecto, con acceso a sus tareas, chat y archivos.' },
                { q: '¿Qué son los ODS?', a: 'Son los 17 Objetivos de Desarrollo Sostenible de la ONU (fin de la pobreza, educación de calidad, acción por el clima, etc.). Cada proyecto indica a cuáles aporta, y así se ve el impacto de todos juntos.' },
              ].map((item) => (
                <details key={item.q} className="group rounded-2xl bg-card border border-border/60 px-6 open:shadow-md transition-shadow">
                  <summary className="flex items-center justify-between gap-4 cursor-pointer list-none py-5 font-semibold text-foreground min-h-11">
                    {item.q}
                    <ChevronDown className="w-5 h-5 flex-shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <p className="pb-5 text-muted-foreground leading-relaxed">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA FINAL: dos caminos + proyectos que buscan solución */}
        <CtaFinal proyectos={projects} />


        {/* ======================================= */}
        {/* FOOTER                                  */}
        {/* ======================================= */}
        <section className="relative z-20 pt-16 bg-background border-t border-border">
          <footer className="border-t border-border py-12 bg-card">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center md:text-left grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="md:col-span-2">
                <div className="flex justify-center md:justify-start items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xl font-bold">ProjectHub</span>
                </div>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto md:mx-0">
                  Empresas que publican problemas, profesionales que los resuelven y un espacio para trabajar juntos. Hecho en Bolivia.
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-4">Plataforma</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link to="/explore" className="hover:text-primary transition-colors">Explorar proyectos</Link></li>
                  <li><a href="#impacto" className="hover:text-primary transition-colors">Impacto ODS</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4">Cuenta</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link to="/register" className="hover:text-primary transition-colors">Crear cuenta</Link></li>
                  <li><Link to="/login" className="hover:text-primary transition-colors">Iniciar sesión</Link></li>
                </ul>
              </div>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} ProjectHub. Todos los derechos reservados.
            </div>
          </footer>
        </section>

      </div>
    </AppLayout>
  );
}
