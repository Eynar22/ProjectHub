import { Link } from 'react-router';
import { motion, useScroll, useTransform } from 'motion/react';
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
  Globe,
  Search,
  MapPin,
  Network,
  HeartHandshake,
  Wheat,
  HeartPulse,
  BookOpen,
  Scale,
  Droplet,
  Sun,
  Factory,
  Equal,
  Building,
  Recycle,
  Leaf,
  Fish,
  TreePine,
  ShieldCheck,
  Handshake,
  UserPlus,
  FolderUp,
  Rocket
} from 'lucide-react';

const textContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.2 } }
};

const textItem = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
};

const getOdsIcon = (id: number | string) => {
  const num = Number(id);
  switch(num) {
    case 1: return <HeartHandshake className="w-8 h-8" />;
    case 2: return <Wheat className="w-8 h-8" />;
    case 3: return <HeartPulse className="w-8 h-8" />;
    case 4: return <BookOpen className="w-8 h-8" />;
    case 5: return <Scale className="w-8 h-8" />;
    case 6: return <Droplet className="w-8 h-8" />;
    case 7: return <Sun className="w-8 h-8" />;
    case 8: return <Briefcase className="w-8 h-8" />;
    case 9: return <Factory className="w-8 h-8" />;
    case 10: return <Equal className="w-8 h-8" />;
    case 11: return <Building className="w-8 h-8" />;
    case 12: return <Recycle className="w-8 h-8" />;
    case 13: return <Leaf className="w-8 h-8" />;
    case 14: return <Fish className="w-8 h-8" />;
    case 15: return <TreePine className="w-8 h-8" />;
    case 16: return <ShieldCheck className="w-8 h-8" />;
    case 17: return <Handshake className="w-8 h-8" />;
    default: return <Globe className="w-8 h-8" />;
  }
};

export default function Home() {
  const { currentUser } = useApp();
  const { data: projects = [] } = useProyectos();

  // Hooks para el efecto de "Zoom Out"
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 500], [1, 0.85]); // Se encoge ligeramente
  const heroY = useTransform(scrollY, [0, 500], [0, 60]); // Se hunde un poco hacia abajo

  // Cálculos ODS
  const odsConteo = ODS_LIST.map(o => ({
    ...o,
    total: projects.filter(p => Array.isArray(p.ods) && p.ods.includes(o.id)).length,
  })).sort((a, b) => b.total - a.total);
  const totalAportes = odsConteo.reduce((s, o) => s + o.total, 0);
  const proyectosConOds = projects.filter(p => Array.isArray(p.ods) && p.ods.length > 0).length;

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
            
            {/* 1. FONDO ESTÁTICO (Queda fuera de la animación) */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-fixed"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')" }} 
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#05050A] via-[#05050A]/90 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#05050A] via-transparent to-transparent opacity-90" />

            {/* 2. CONTENIDO ANIMADO (Solo el texto y cohete hacen Zoom Out) */}
            <motion.div 
              style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
              className="absolute inset-0 w-full h-full flex flex-col justify-center overflow-hidden"
            >
              <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 md:pb-24">
                <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 items-center">
                  
                  <motion.div variants={textContainer} initial="hidden" animate="show" className="max-w-xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-primary/20 border border-primary/30 text-blue-400 text-xs font-bold tracking-wide backdrop-blur-sm uppercase">
                      <Network className="w-4 h-4" /> Red B2B Oficial
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 leading-[1.1] tracking-tight drop-shadow-lg text-white">
                      Más conexión. <br/>
                      <span className="text-primary italic font-serif">Mejores negocios</span><br/>
                      en Bolivia.
                    </h1>
                    
                    <motion.p variants={textItem} className="text-base text-slate-300 mb-8 leading-relaxed max-w-md font-medium">
                      Gestiona proyectos corporativos, conecta con aliados estratégicos y escala tu empresa en un entorno seguro y verificado.
                    </motion.p>
                    
                    <motion.div variants={textItem}>
                      <Link to="/register" className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white bg-primary hover:bg-indigo-600 shadow-[0_0_40px_rgba(37,99,235,0.4)] transition-all">
                        Comenzar ahora
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                    </motion.div>
                  </motion.div>

                  <div className="hidden lg:flex justify-center items-center relative h-full">
                    <motion.img 
                      animate={{ y: [-10, 10, -10], rotate: [-1, 1, -1] }}
                      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                      src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Rocket.png" 
                      alt="3D Rocket Growth" 
                      className="w-full max-w-[22rem] object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10"
                    />
                  </div>

                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ======================================= */}
        {/* SECCIÓN 2: ¿QUÉ ES PROJECTHUB?          */}
        {/* ======================================= */}
        {/* Se añadió un degradado sutil (from-primary/5 via-muted/30) para generar contraste con las tarjetas blancas en el día */}
        <section className="relative z-20 bg-gradient-to-b from-primary/5 via-muted/30 to-background border-t border-border pt-24 pb-24 shadow-[0_-20px_60px_rgba(0,0,0,0.5)]">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.15] [background-image:radial-gradient(circle_at_1px_1px,var(--color-border)_1px,transparent_0)] [background-size:24px_24px]" />

          {/* Burbujas de fondo */}
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

          {/* Barra de búsqueda (Estilo Píldora Redonda) */}
          <Reveal className="absolute -top-10 md:-top-14 left-1/2 -translate-x-1/2 w-full max-w-5xl px-4 sm:px-6 lg:px-8 z-30">
            <div className="bg-card/95 backdrop-blur-2xl p-2 rounded-[2rem] md:rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-border/50 flex flex-col md:flex-row items-center gap-2 md:gap-0">
              
              <div className="flex-1 w-full flex items-center gap-3 px-4 md:px-6 py-2 md:py-0 md:border-r border-border/50">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-5 h-5 text-primary" />
                </div>
                <div className="flex flex-col w-full">
                  <span className="text-[10px] md:text-xs text-muted-foreground font-bold uppercase tracking-wider">Sector</span>
                  <select className="bg-transparent text-xs md:text-sm font-semibold text-foreground outline-none cursor-pointer w-full appearance-none">
                    <option>Todos los sectores</option>
                    <option>Tecnología</option>
                    <option>Construcción</option>
                    <option>Agricultura</option>
                  </select>
                </div>
              </div>

              <div className="flex-1 w-full flex items-center gap-3 px-4 md:px-6 py-2 md:py-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div className="flex flex-col w-full">
                  <span className="text-[10px] md:text-xs text-muted-foreground font-bold uppercase tracking-wider">Ubicación</span>
                  <select className="bg-transparent text-xs md:text-sm font-semibold text-foreground outline-none cursor-pointer w-full appearance-none">
                    <option>Toda Bolivia</option>
                    <option>Cochabamba</option>
                    <option>Santa Cruz</option>
                    <option>La Paz</option>
                  </select>
                </div>
              </div>

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
                ¿Qué es <span className="text-primary font-sans">Project</span>Hub?
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground">
                Una plataforma integral de colaboración diseñada específicamente para centralizar la oferta y demanda de servicios corporativos.
              </p>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
              {[
                { 
                  icon: Users, 
                  title: "Alianzas Estratégicas", 
                  desc: "Encuentra socios comerciales verificados y expande tu red de contactos a nivel nacional en un solo dashboard.",
                  color: "var(--blue-base)" 
                },
                { 
                  icon: Shield, 
                  title: "Entorno Seguro B2B", 
                  desc: "Validación rigurosa de empresas e instituciones para garantizar que trabajes solo con profesionales.",
                  color: "var(--indigo-500)" 
                },
                { 
                  icon: TrendingUp, 
                  title: "Gestión Centralizada", 
                  desc: "Monitorea proyectos, hitos y presupuestos con herramientas integradas de comunicación directa.",
                  color: "var(--amber-base)" 
                }
              ].map((item, i) => (
                <Reveal key={i} delay={i * 0.1} className="h-full">
                  {/* bg-card asegura que la tarjeta sea blanca en el día y contraste contra el nuevo fondo */}
                  <div 
                    className="group relative h-full flex flex-col items-center text-center p-8 md:p-10 bg-card shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border-l-[6px] border-b-[6px] border-t border-r border-t-border/50 border-r-border/50 rounded-tl-[4rem] rounded-br-[4rem] rounded-tr-xl rounded-bl-xl"
                    style={{ borderLeftColor: item.color, borderBottomColor: item.color }}
                  >
                    
                    {/* Icono encapsulado con el color del tema */}
                    <div className="relative z-10 w-20 h-20 bg-background border border-border/60 rounded-full flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform duration-500">
                      <item.icon className="w-10 h-10 transition-colors" style={{ color: item.color }} />
                    </div>
                    
                    <h3 className="text-xl font-bold mb-4 font-serif text-foreground">{item.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed flex-1">{item.desc}</p>
                    
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

       {/* ======================================= */}
        {/* SECCIÓN 3: INNOVACIÓN (EFECTO KEN BURNS) */}
        {/* ======================================= */}
        <section className="relative py-32 md:py-48 overflow-hidden border-t border-b border-border bg-[#05050A]">
          
          {/* Fondo Animado: Efecto "Ken Burns" simulando video */}
          <motion.div 
            animate={{ 
              scale: [1.1, 1.25, 1.1],
              x: ["-3%", "3%", "-3%"],
              y: ["0%", "-2%", "0%"]
            }}
            transition={{ 
              duration: 30,
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute inset-0 w-full h-full bg-cover bg-center"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')" }} 
          />
          
          {/* Overlay oscuro */}
          <div className="absolute inset-0 bg-[#05050A]/80" />

          {/* Arco de Luz Planetario animado */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              animate={{
                boxShadow: [
                  "0px 0px 80px 0px rgba(79, 70, 229, 0.2)",
                  "0px 0px 150px 20px rgba(79, 70, 229, 0.4)",
                  "0px 0px 80px 0px rgba(79, 70, 229, 0.2)",
                ]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[30%] md:top-[40%] left-1/2 -translate-x-1/2 w-[200%] md:w-[120%] h-[600px] md:h-[800px] rounded-[100%] border-t-[2px] border-primary/60 bg-gradient-to-b from-primary/10 to-transparent"
            />
            
            {/* Partículas de estrellas */}
            {Array.from({ length: 25 }).map((_, i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -250], opacity: [0, 0.8, 0] }}
                transition={{ duration: Math.random() * 5 + 5, repeat: Infinity, ease: "linear", delay: Math.random() * 5 }}
                className="absolute bg-primary rounded-full blur-[1px]"
                style={{
                  width: Math.random() * 3 + 1 + "px",
                  height: Math.random() * 3 + 1 + "px",
                  left: Math.random() * 100 + "%",
                  top: Math.random() * 100 + "%",
                }}
              />
            ))}
          </div>
          
          {/* Contenido de Texto (CORREGIDO) */}
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <Reveal>
              
              <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-primary/30 bg-[#05050A]/50 backdrop-blur-md shadow-sm">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                  El Ecosistema
                </p>
              </div>
              
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-8 text-white tracking-tight leading-[1.1] drop-shadow-xl">
                Innovación <span className="text-primary italic font-normal">empresarial</span>
              </h2>
              
              {/* Texto nuevo enfocado 100% en la misión de ProjectHub */}
              <p className="text-lg md:text-xl text-slate-300 leading-relaxed font-medium drop-shadow-md max-w-3xl mx-auto">
                Creemos en el poder de la colaboración para impulsar la economía. ProjectHub centraliza la oferta y demanda del sector corporativo, brindando un entorno seguro donde las empresas bolivianas pueden encontrar aliados estratégicos, gestionar proyectos y escalar a nivel nacional.
              </p>
              
            </Reveal>
          </div>
        </section>

        {/* ======================================= */}
        {/* SECCIÓN 4: OBJETIVOS / LÍNEA DE TIEMPO  */}
        {/* ======================================= */}
        <section className="relative z-20 py-24 bg-muted/30 overflow-hidden border-b border-border/50">
          
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div
              animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-20 left-1/4 w-[30rem] h-[30rem] bg-primary/10 rounded-full blur-[100px]"
            />
            <motion.div
              animate={{ x: [0, -50, 0], y: [0, -60, 0] }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-0 right-1/4 w-[35rem] h-[35rem] bg-indigo-500/10 rounded-full blur-[120px]"
            />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <Reveal className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-extrabold mb-4 font-serif">El camino al éxito</h2>
              <p className="text-muted-foreground">Tres simples pasos para integrar y escalar tu empresa.</p>
            </Reveal>

            <div className="relative mt-10">
              <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-[2px] bg-border z-0" />
              <div className="hidden md:block absolute top-12 left-[15%] w-[45%] h-[2px] bg-gradient-to-r from-primary via-primary to-transparent z-0" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
                {[
                  { icon: UserPlus, title: 'Crea tu perfil', desc: 'Registra los datos de tu empresa para la validación oficial en la red nacional.' },
                  { icon: FolderUp, title: 'Sube Proyectos', desc: 'Publica requerimientos o postula a oportunidades de otras empresas bolivianas.' },
                  { icon: Rocket, title: 'Forma Alianzas', desc: 'Colabora, ejecuta y documenta el impacto real en la economía del país.' }
                ].map((item, index) => (
                  <Reveal key={index} delay={index * 0.2} className="relative flex flex-col items-center text-center group">
                    
                    <div className="relative z-10 w-24 h-24 bg-card border-2 border-primary/30 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(var(--indigo-500),0.15)] group-hover:border-primary group-hover:shadow-[0_0_40px_rgba(var(--indigo-500),0.4)] transition-all duration-500">
                      <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <item.icon className="w-7 h-7 text-primary" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-8 h-8 bg-primary text-white rounded-full text-sm font-bold flex items-center justify-center border-[3px] border-card shadow-sm">
                        {index + 1}
                      </div>
                    </div>

                    <div className="bg-card/70 backdrop-blur-md border border-border/60 rounded-3xl p-6 w-full group-hover:bg-card/90 group-hover:border-primary/40 transition-all duration-500 shadow-sm relative">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-card/70 border-t border-l border-border/60 rotate-45 group-hover:bg-card/90 group-hover:border-primary/40 transition-colors" />
                      <h4 className="text-xl font-bold mb-3 font-serif relative z-10">{item.title}</h4>
                      <p className="text-muted-foreground text-sm leading-relaxed relative z-10">{item.desc}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* ======================================= */}
        {/* SECCIÓN 5: ALINEACIÓN CON LOS ODS       */}
        {/* ======================================= */}
        <section className="relative z-20 py-24 bg-background border-t border-border/50 overflow-hidden">
          
          {/* Fondo oscuro con resplandor sutil (como en tu referencia) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <Reveal className="text-center mb-16">
              <p className="inline-flex items-center justify-center gap-2 text-sm font-bold text-primary uppercase tracking-widest mb-3">
                <Globe className="w-4 h-4" /> Impacto Sostenible
              </p>
              <h2 className="text-3xl md:text-5xl font-extrabold mb-4 font-serif">
                Aportando a los <span className="text-primary">ODS de la ONU</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {proyectosConOds > 0
                  ? <>Ya son <strong className="text-foreground">{proyectosConOds}</strong> proyectos impactando positivamente con <strong className="text-foreground">{totalAportes}</strong> aportes declarados.</>
                  : <>Cada proyecto publicado en ProjectHub declara su impacto positivo en la sociedad y el medio ambiente.</>}
              </p>
            </Reveal>

            {/* Grid compacto de 4 columnas para mostrar los 17 ODS */}
            {/* Nota: Se eliminó el .slice() para que mapee los 17 completos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {odsConteo.map((o, index) => (
                <Reveal key={o.id} delay={index * 0.02} className="h-full">
                  <div className="group relative flex h-full items-center gap-4 overflow-hidden rounded-2xl border border-border/60 bg-card p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md">
                    
                    {/* Resplandor decorativo suave dentro de la tarjeta usando el color del ODS */}
                    <div 
                      className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-5 transition-opacity duration-300 group-hover:opacity-15 blur-xl"
                      style={{ backgroundColor: o.color }}
                    />

                    {/* Cuadro de Color con el Número (Idéntico a la referencia) */}
                    <div 
                      className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-xl font-black text-white shadow-inner relative z-10 transition-transform group-hover:scale-105"
                      style={{ backgroundColor: o.color }}
                    >
                      {o.id}
                      {/* NOTA: Si prefieres los iconos en vez del número, cambia '{o.id}' por '{getOdsIcon(o.id)}' */}
                    </div>
                    
                    {/* Textos alineados a la izquierda */}
                    <div className="flex flex-col text-left relative z-10 pr-2 flex-1">
                      <h3 className="text-xs md:text-sm font-bold leading-snug text-foreground line-clamp-2">
                        {o.nombre}
                      </h3>
                      <p className="mt-1 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {o.total} Proyecto{o.total !== 1 && 's'}
                      </p>
                    </div>

                  </div>
                </Reveal>
              ))}
            </div>
            
          </div>
        </section>

{/* ======================================= */}
        {/* CTA FINAL - IMAGEN CORPORATIVA Y DEGRADADO LATERAL */}
        {/* ======================================= */}
        <section className="relative z-20 bg-[#05050A] border-t border-border overflow-hidden">
          
          {/* 1. Imagen de fondo relacionada a la plataforma (Tecnología, B2B, Ecosistema) */}
          <div 
            className="absolute inset-0 w-full md:w-[70%] h-full bg-cover bg-center"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2070&auto=format&fit=crop')" }}
          />
          
          {/* 2. Degradado para fundir la imagen con el fondo oscuro */}
          {/* En móviles cambia la dirección de Arriba -> Abajo para que el texto se lea bien */}
          <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-[#05050A]/40 via-[#05050A]/90 to-[#05050A] md:from-transparent md:via-[#05050A]/95 md:to-[#05050A]" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-24 md:py-32 flex flex-col md:flex-row md:justify-end">
            
            {/* 3. Contenedor de texto alineado a la derecha sobre la parte oscura */}
            <Reveal className="w-full md:w-[60%] lg:w-[50%] text-left mt-40 md:mt-0">
              
              <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-primary/20 border border-primary/30 text-blue-400 text-xs font-bold tracking-widest uppercase backdrop-blur-sm shadow-sm">
                <Zap className="w-4 h-4" />
                El futuro es colaborativo
              </div>

              {/* Tipografía estrictamente apegada a Hanken Grotesk (Jerarquía por peso) sin serif */}
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 text-white tracking-tight leading-[1.1]">
                ¿Listo para escalar en <br />
                <span className="text-primary italic">Bolivia?</span>
              </h2>

              <p className="text-lg md:text-xl text-slate-300 mb-10 leading-relaxed font-medium">
                Únete a ProjectHub hoy mismo y pon tu empresa en el mapa del ecosistema empresarial más grande del país. Centraliza tus alianzas y potencia tu impacto.
              </p>

              <Link 
                to="/register" 
                className="group/btn inline-flex items-center justify-center gap-3 rounded-full bg-primary px-10 py-5 text-lg font-bold text-primary-foreground transition-all hover:scale-105 hover:bg-primary-hover shadow-[0_0_40px_rgba(var(--indigo-500),0.4)] hover:shadow-[0_0_60px_rgba(var(--indigo-500),0.6)]"
              >
                Registrar mi Empresa
                <ArrowRight className="w-6 h-6 group-hover/btn:translate-x-1 transition-transform duration-300" />
              </Link>

            </Reveal>
          </div>
        </section>
        {/* ======================================= */}
        {/* CTA FINAL - DISEÑO "NÚCLEO DE ENERGÍA"  */}
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
                  Conecta, colabora y escala. La plataforma oficial para centralizar proyectos B2B en Bolivia.
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-4">Plataforma</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link to="/explore" className="hover:text-primary transition-colors">Explorar Proyectos</Link></li>
                  <li><Link to="/empresas" className="hover:text-primary transition-colors">Directorio de Empresas</Link></li>
                  <li><Link to="/ods" className="hover:text-primary transition-colors">Impacto ODS</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4">Soporte</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-primary transition-colors">Centro de Ayuda</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Términos de Servicio</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Privacidad</a></li>
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