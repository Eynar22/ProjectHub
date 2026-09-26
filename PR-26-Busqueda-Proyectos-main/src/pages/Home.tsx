import { Link } from 'react-router';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
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
import { OdsImpacto } from '@/shared/components/landing/OdsImpacto';
import { HechoEnBolivia } from '@/shared/components/landing/HechoEnBolivia';
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



export default function Home() {
  const { currentUser } = useApp();
  const { data: projects = [] } = useProyectos();
  const { data: empresas = [] } = useEmpresas();
  const reducirMovimiento = useReducedMotion();

  // Hooks para el efecto de "Zoom Out" del hero
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 500], [1, 0.85]);
  const heroY = useTransform(scrollY, [0, 500], [0, 60]);

  // ODS con al menos un proyecto (para la barra de cifras del hero).
  const odsCubiertos = ODS_LIST.filter(o => projects.some(p => Array.isArray(p.ods) && p.ods.includes(o.id))).length;
  const proyectosEnCurso = projects.filter(p => p.estado === 'en_curso').length;
  const empresasVerificadas = empresas.filter(e => e.estado === 'aprobado').length;
  // Proyecto real para la demo del hero: el más reciente en curso que tenga problema declarado.
  const proyectoDestacado = [...projects]
    .filter(p => p.estado === 'en_curso' && !p.suspendido && (p.problema || p.descripcion_corta))
    .sort((a, b) => (b.fecha_creacion ?? '').localeCompare(a.fecha_creacion ?? ''))[0];

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

            {/* 1. FONDO: La Paz de noche (Unsplash, public/images/landing/) con un zoom muy
                lento, velado a la izquierda para que el texto se lea y fundido abajo. */}
            <motion.img
              src="/images/landing/hero-la-paz-noche.jpg"
              alt=""
              aria-hidden="true"
              fetchPriority="high"
              className="absolute inset-0 w-full h-full object-cover object-[center_70%]"
              initial={{ scale: 1.08, opacity: 0 }}
              animate={reducirMovimiento ? { scale: 1.05, opacity: 1 } : { scale: [1.05, 1.15], opacity: 1 }}
              transition={reducirMovimiento
                ? { duration: 0.6 }
                : { scale: { duration: 40, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }, opacity: { duration: 1.2 } }}
            />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-[#05050A] via-[#05050A]/80 to-[#05050A]/30" />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-[#05050A]/70 via-transparent to-transparent" />
            <div aria-hidden="true" className="absolute -top-40 -left-40 w-[40rem] h-[40rem] rounded-full bg-primary/20 blur-[140px]" />
            <div aria-hidden="true" className="absolute inset-0 opacity-[0.10] [background-image:radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.6)_1px,transparent_0)] [background-size:28px_28px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#05050A] via-transparent to-transparent opacity-90" />
            <p className="absolute bottom-4 right-4 z-10 text-[10px] text-white/40">La Paz, Bolivia · Foto: Unsplash</p>

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

        {/* HECHO EN BOLIVIA: mosaico de fotos */}
        <HechoEnBolivia />

        {/* SECCIÓN 5: IMPACTO SOSTENIBLE (ODS) */}
        <OdsImpacto proyectos={projects} />

        {/* ======================================= */}
        {/* PREGUNTAS FRECUENTES                    */}
        {/* ======================================= */}
        <section id="preguntas" className="scroll-mt-16 relative z-20 py-24 bg-muted/30 border-t border-border/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-10 lg:gap-14 items-start">
            {/* Columna de la foto */}
            <Reveal className="lg:sticky lg:top-24">
              <p className="text-sm font-bold text-primary uppercase tracking-widest mb-3">Resolvemos tus dudas</p>
              <h2 className="text-3xl md:text-5xl font-extrabold mb-6 font-serif">Preguntas frecuentes</h2>
              <div className="relative hidden sm:block">
                <img
                  src="/images/landing/preguntas.jpg"
                  alt="Dos personas celebrando un logro frente a su laptop"
                  loading="lazy"
                  className="w-full aspect-[4/5] max-h-[460px] object-cover rounded-3xl shadow-xl"
                />
                <div className="absolute -bottom-5 left-5 right-5 rounded-2xl bg-card/95 backdrop-blur border border-border/60 p-4 shadow-lg">
                  <p className="text-sm font-bold text-foreground">¿No encuentras tu respuesta?</p>
                  <p className="text-sm text-muted-foreground">
                    Crea tu cuenta y explora la plataforma: <Link to="/register" className="text-primary font-semibold hover:underline">empieza aquí</Link>.
                  </p>
                </div>
              </div>
            </Reveal>

            <div className="space-y-3 lg:pt-24">
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
