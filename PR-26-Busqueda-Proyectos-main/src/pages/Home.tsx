import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Button } from '@/shared/components/ui/Button';
import { Reveal } from '@/shared/components/Reveal';
import { AppLayout } from '@/shared/components/layout/AppLayout';
import { useApp } from '@/app/context/AppContext';
import { useProyectos } from '@/features/proyectos';
import { ODS_LIST } from '@/shared/constants/ods';
import {
  Briefcase,
  Users,
  TrendingUp,
  Shield,
  Zap,
  Building2,
  ArrowRight,
  MapPin,
  Search,
  Globe
} from 'lucide-react';

export default function Home() {
  const { currentUser } = useApp();
  const { data: projects = [] } = useProyectos();

  // Cuántos proyectos aportan a cada ODS (uno puede aportar a varios).
  const odsConteo = ODS_LIST.map(o => ({
    ...o,
    total: projects.filter(p => Array.isArray(p.ods) && p.ods.includes(o.id)).length,
  })).sort((a, b) => b.total - a.total);
  const totalAportes = odsConteo.reduce((s, o) => s + o.total, 0);
  const proyectosConOds = projects.filter(p => Array.isArray(p.ods) && p.ods.length > 0).length;
  
  const features = [
    { icon: Briefcase,  title: 'Oportunidades de Negocio', description: 'Encuentra proyectos y colaboraciones que se ajustan a tu experiencia' },
    { icon: Users,      title: 'Colaboración Efectiva',    description: 'Herramientas integradas de comunicación y gestión de tareas' },
    { icon: TrendingUp, title: 'Crecimiento Mutuo',        description: 'Expande tu red y accede a nuevas oportunidades de negocio' },
    { icon: Shield,     title: 'Seguro y Confiable',       description: 'Proceso de verificación de empresas para garantizar calidad' },
    { icon: Zap,        title: 'Rápido y Eficiente',       description: 'Solicita participación y empieza a colaborar en minutos' },
    { icon: Building2,  title: 'Visibilidad Nacional',     description: 'Conecta con empresas y socios estratégicos en todo el país' },
  ];

  return (
    <AppLayout
      sinSidebar={!currentUser}
      isAdmin={currentUser?.rol === 'superadmin'}
      sinFooter
      mainClassName="flex-1 w-full overflow-hidden"
    >
          {/* Fondo ambiental de toda la landing: base + gradiente + glows indigo + grid de puntos */}
          <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
            <div className="absolute inset-0 bg-background" />
            <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.06] via-transparent to-primary/[0.03]" />
            <div className="absolute -top-40 left-1/2 h-[40rem] w-[62rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[130px]" />
            <div className="absolute -bottom-40 -right-40 h-[36rem] w-[36rem] rounded-full bg-primary/10 blur-[120px]" />
            <div className="absolute inset-0 opacity-[0.35] [background-image:radial-gradient(circle_at_1px_1px,var(--color-border)_1px,transparent_0)] [background-size:22px_22px]" />
          </div>

          {/* ======================================= */}
          {/* HERO SECTION 3D (100% PANTALLA)         */}
          {/* ======================================= */}
          <section className="relative w-full min-h-[100dvh] -mt-14 md:-mt-16 flex items-center justify-center z-10 pb-10">
            
            <div className="absolute inset-0 rounded-b-[3rem] md:rounded-b-[5rem] bg-background/70 backdrop-blur-sm border-b border-border/50 overflow-hidden -z-10">
              <div className="absolute inset-0 bg-primary/5" />
              <div className="absolute top-1/4 left-1/4 w-[30rem] h-[30rem] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
              
              <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                
                {/* Lado Izquierdo: Textos */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className="max-w-2xl"
                >
                  
                  
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-4 lg:mb-6 leading-[1.1] tracking-tight text-foreground">
                    <span className="block mb-1 lg:mb-2">Conecta.</span>
                    <span className="block mb-1 lg:mb-2">Colabora.</span>
                    <span className="text-primary">
                      Escala.
                    </span>
                  </h1>
                  
                  <p className="text-base md:text-lg lg:text-xl text-muted-foreground mb-8 lg:mb-10 leading-relaxed max-w-lg">
                    Somos la plataforma que une a las empresas bolivianas. 
                    Publica proyectos, encuentra aliados estratégicos y trabaja en un entorno seguro.
                  </p>
                  
                  <div className="flex gap-4 flex-wrap">
                    <Link to="/register" className="inline-flex items-center gap-2 rounded-full px-6 py-3 lg:px-8 lg:py-4 text-sm lg:text-base font-semibold text-white bg-primary shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                      Explorar Servicios
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </div>
                </motion.div>

                {/* Lado Derecho: Imagen 3D del Cohete */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                  className="relative hidden lg:flex justify-center items-center"
                >
                  <motion.div
                    animate={{ y: [-15, 15, -15] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="relative z-10 w-full max-w-[14rem] md:max-w-[16rem] lg:max-w-md"
                  >
                    <img 
                      src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Rocket.png" 
                      alt="3D Rocket Growth" 
                      className="w-full h-auto object-contain drop-shadow-2xl"
                    />
                  </motion.div>
                  
                  <div className="absolute bottom-4 w-2/3 h-10 bg-primary/20 blur-2xl rounded-full" />
                </motion.div>

              </div>
            </div>
          </section>

          {/* ======================================= */}
          {/* FEATURES SECTION (NUEVAS TARJETAS GLOW) */}
          {/* ======================================= */}
          <section className="pt-12 pb-24 md:pt-16 md:pb-32 bg-muted/20 relative">
            
            {/* Barra Flotante de Búsqueda */}
            <Reveal className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 relative z-30">
              <div className="bg-card/95 backdrop-blur-2xl p-3 md:p-4 rounded-[2rem] md:rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-border/50 flex flex-col md:flex-row items-center gap-4 md:gap-0">
                
                <div className="flex-1 w-full flex items-center gap-3 px-4 md:px-6 md:border-r border-border/50">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex flex-col w-full">
                    <span className="text-[10px] md:text-xs text-muted-foreground font-bold uppercase tracking-wider">Sector</span>
                    <select className="bg-transparent text-xs md:text-sm font-semibold text-foreground outline-none rounded focus-visible:ring-2 focus-visible:ring-ring cursor-pointer appearance-none w-full">
                      <option>Todos los sectores</option>
                      <option>Tecnología</option>
                      <option>Construcción</option>
                      <option>Agricultura</option>
                    </select>
                  </div>
                </div>

                <div className="flex-1 w-full flex items-center gap-3 px-4 md:px-6">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex flex-col w-full">
                    <span className="text-[10px] md:text-xs text-muted-foreground font-bold uppercase tracking-wider">Ubicación</span>
                    <select className="bg-transparent text-xs md:text-sm font-semibold text-foreground outline-none rounded focus-visible:ring-2 focus-visible:ring-ring cursor-pointer appearance-none w-full">
                      <option>Toda Bolivia</option>
                      <option>Cochabamba</option>
                      <option>Santa Cruz</option>
                      <option>La Paz</option>
                    </select>
                  </div>
                </div>

                <div className="w-full md:w-auto px-2">
                  <Link to="/explore" className="w-full block">
                    <Button variant="primary" className="w-full md:w-auto rounded-full px-6 py-4 md:px-8 md:py-6 flex items-center justify-center gap-2 shadow-md hover:shadow-xl transition-all">
                      <Search className="w-5 h-5" />
                      <span className="text-sm md:text-base">Buscar</span>
                    </Button>
                  </Link>
                </div>

              </div>
            </Reveal>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Reveal className="text-center mb-16 md:mb-24">
                <h2 className="text-3xl md:text-5xl font-extrabold mb-6">
                  Nuestros <span className="text-primary">Servicios</span>
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Soluciones diseñadas para impulsar tu negocio en cada etapa del camino.
                </p>
              </Reveal>

              {/* GRID DE TARJETAS — glow + hover (A) + textura (B) + fondo por card (C) */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <Reveal key={index} delay={index * 0.08} className="h-full">
                      <div className="group relative flex h-full flex-col items-center overflow-hidden rounded-[2rem] border border-border/60 bg-surface-raised p-8 text-center shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-[0_24px_48px_-12px_rgb(0_0_0/0.25)]">
                        {/* C — wash de color y marca de agua del icono, distinta por card */}
                        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.08] via-transparent to-primary/[0.04]" />
                        <Icon
                          aria-hidden="true"
                          className="pointer-events-none absolute -bottom-8 -right-8 h-44 w-44 rotate-[-12deg] text-primary/[0.07] transition-all duration-700 group-hover:rotate-[-6deg] group-hover:scale-110 group-hover:text-primary/[0.12]"
                        />
                        {/* B — textura de puntos + hairline de acento */}
                        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(circle_at_1px_1px,var(--color-border)_1.2px,transparent_0)] [background-size:16px_16px]" />
                        <div aria-hidden="true" className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                        {/* A — resplandor detrás del icono */}
                        <div aria-hidden="true" className="pointer-events-none absolute -top-10 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-primary/15 blur-[60px] transition-all duration-700 group-hover:h-52 group-hover:w-52 group-hover:bg-primary/30" />

                        <div className="relative z-10 mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/20 transition-all duration-500 group-hover:-translate-y-1 group-hover:scale-110 group-hover:shadow-primary/40">
                          <Icon className="h-7 w-7 text-primary-foreground" />
                        </div>

                        <h3 className="relative z-10 mb-3 text-xl font-bold text-foreground">{feature.title}</h3>
                        <p className="relative z-10 flex-1 leading-relaxed text-muted-foreground">{feature.description}</p>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ======================================= */}
          {/* IMPACTO EN LOS ODS                      */}
          {/* ======================================= */}
          <section className="py-24 md:py-32 relative overflow-hidden">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <Reveal className="text-center mb-14 md:mb-20">
                <p className="inline-flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-widest mb-3">
                  <Globe className="w-4 h-4" /> Impacto Sostenible
                </p>
                <h2 className="text-3xl md:text-5xl font-extrabold mb-6">
                  Aportando a los <span className="text-primary">Objetivos de Desarrollo Sostenible</span>
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  {proyectosConOds > 0
                    ? <>Ya son <strong className="text-foreground">{proyectosConOds}</strong> proyecto{proyectosConOds === 1 ? '' : 's'} con <strong className="text-foreground">{totalAportes}</strong> aporte{totalAportes === 1 ? '' : 's'} repartidos entre los 17 ODS de la ONU.</>
                    : <>Cada proyecto publicado en ProjectHub declara a qué ODS de la ONU contribuye.</>}
                </p>
              </Reveal>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {odsConteo.map((o, index) => (
                  <Reveal key={o.id} delay={index * 0.03} className="h-full">
                    <div className="group relative flex h-full items-center gap-3 overflow-hidden rounded-2xl border border-border/60 bg-surface-raised p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                      <div
                        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-lg font-black text-white shadow-inner"
                        style={{ backgroundColor: o.color }}
                      >
                        {o.id}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold leading-tight text-foreground line-clamp-2">{o.nombre}</p>
                        <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                          {o.total} proyecto{o.total === 1 ? '' : 's'}
                        </p>
                      </div>
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full opacity-10 transition-opacity duration-300 group-hover:opacity-20"
                        style={{ backgroundColor: o.color }}
                      />
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* ======================================= */}
          {/* HOW IT WORKS SECTION                    */}
          {/* ======================================= */}
          <section className="py-24 md:py-32 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <Reveal className="text-center mb-20">
                <p className="text-sm font-bold text-primary uppercase tracking-widest mb-3">Proceso Simple</p>
                <h2 className="text-3xl md:text-5xl font-extrabold mb-6">
                  ¿Cómo funciona?
                </h2>
              </Reveal>

              <div className="grid md:grid-cols-3 gap-12 md:gap-8 relative">
                <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

                {[
                  {
                    step: '01',
                    title: 'Regístrate y crea tu perfil',
                    description: 'Completa los datos de tu empresa y espera la verificación rápida de nuestro equipo.'
                  },
                  {
                    step: '02',
                    title: 'Explora o publica',
                    description: 'Sube tus propios proyectos o busca oportunidades que encajen con tu experiencia.'
                  },
                  {
                    step: '03',
                    title: 'Colabora y crece',
                    description: 'Conecta, comunícate y gestiona tus alianzas directamente en la plataforma.'
                  }
                ].map((step, index) => (
                  <Reveal key={index} delay={index * 0.12} className="relative text-center">
                    <div className="group relative z-10 mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full border border-primary/25 bg-surface-raised shadow-lg shadow-primary/10 transition-transform duration-300 hover:scale-105">
                      <div aria-hidden="true" className="pointer-events-none absolute -inset-3 rounded-full bg-primary/15 blur-2xl transition-all duration-300 group-hover:bg-primary/25" />
                      <span className="relative text-2xl font-black text-primary">{step.step}</span>
                    </div>
                    <h3 className="text-xl font-bold tracking-tight mb-4">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed px-4">{step.description}</p>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* ======================================= */}
          {/* CTA SECTION                             */}
          {/* ======================================= */}
          <section className="py-24">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <Reveal>
                <div className="relative overflow-hidden rounded-[3rem] border border-primary/25 bg-surface-raised p-12 md:p-20 text-center shadow-xl">
                  {/* Textura de puntos + resplandor indigo (sin fill saturado) */}
                  <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_1px_1px,var(--color-border)_1.2px,transparent_0)] [background-size:18px_18px]" />
                  <div aria-hidden="true" className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[38rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[90px]" />
                  <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.08] to-transparent" />

                  <div className="relative z-10">
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-5 text-foreground text-balance">
                      ¿Listo para llevar tu empresa al siguiente nivel?
                    </h2>
                    <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                      Únete a cientos de empresas que ya están colaborando y escalando juntas en ProjectHub.
                    </p>
                    <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-10 py-5 text-lg font-bold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary-hover hover:-translate-y-1 transition-all">
                      Registra tu Empresa Hoy
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </Reveal>
            </div>
          </section>

          {/* ======================================= */}
          {/* FOOTER                                  */}
          {/* ======================================= */}
          <footer className="bg-card border-t border-border py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <div className="flex justify-center items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold">ProjectHub</span>
              </div>
              <p className="text-muted-foreground font-medium">&copy; 2026 ProjectHub. Todos los derechos reservados.</p>
            </div>
          </footer>

    </AppLayout>
  );
}