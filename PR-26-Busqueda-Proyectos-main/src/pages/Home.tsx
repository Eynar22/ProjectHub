import { Link } from 'react-router';
import { motion, useReducedMotion, useScroll, useSpring } from 'motion/react';
import { Button } from '@/shared/components/ui/Button';
import { Reveal } from '@/shared/components/Reveal';
import { AppLayout } from '@/shared/components/layout/AppLayout';
import { useApp } from '@/app/context/AppContext';
import { useProyectos } from '@/features/proyectos';
import { useEmpresas } from '@/features/empresas';
import { ODS_LIST } from '@/shared/constants/ods';
import { ComoFunciona } from '@/shared/components/landing/ComoFunciona';
import { ParaQuien } from '@/shared/components/landing/ParaQuien';
import { PorQueExiste } from '@/shared/components/landing/PorQueExiste';
import { TodoEnUnLugar } from '@/shared/components/landing/TodoEnUnLugar';
import { CtaFinal } from '@/shared/components/landing/CtaFinal';
import { OdsImpacto } from '@/shared/components/landing/OdsImpacto';
import { HechoEnBolivia } from '@/shared/components/landing/HechoEnBolivia';
import { HeroPrincipal } from '@/shared/components/landing/HeroPrincipal';
import { FraseImpacto } from '@/shared/components/landing/FraseImpacto';
import { Contador } from '@/shared/components/Contador';
import {
  Building2,
  Globe,
  Search,
  FolderUp,
  ChevronDown,
} from 'lucide-react';


export default function Home() {
  const { currentUser } = useApp();
  const { data: projects = [] } = useProyectos();
  const { data: empresas = [] } = useEmpresas();
  const reducirMovimiento = useReducedMotion();

  // Barra de progreso de lectura (0 → 1 en toda la página).
  const { scrollYProgress } = useScroll();
  const progresoLectura = useSpring(scrollYProgress, { stiffness: 140, damping: 30 });

  // ODS con al menos un proyecto (para la barra de cifras del hero).
  const odsCubiertos = ODS_LIST.filter(o => projects.some(p => Array.isArray(p.ods) && p.ods.includes(o.id))).length;
  const proyectosEnCurso = projects.filter(p => p.estado === 'en_curso').length;
  const empresasVerificadas = empresas.filter(e => e.estado === 'aprobado').length;

  return (
    <AppLayout
      sinSidebar={!currentUser}
      isAdmin={currentUser?.rol === 'superadmin'}
      sinFooter
      mainClassName="flex-1 w-full"
    >
      {!reducirMovimiento && (
        <motion.div
          aria-hidden="true"
          style={{ scaleX: progresoLectura }}
          className="fixed top-0 left-0 right-0 h-[3px] z-[60] origin-left bg-gradient-to-r from-primary to-indigo-400"
        />
      )}
      <div className="relative w-full -mt-20 md:-mt-24">

        {/* HERO */}
        <HeroPrincipal />

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
                    <span className="text-xl md:text-2xl font-extrabold text-foreground leading-none"><Contador valor={c.valor} /></span>
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
        {/* Respiro: frase a pantalla completa */}
        <FraseImpacto />

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
