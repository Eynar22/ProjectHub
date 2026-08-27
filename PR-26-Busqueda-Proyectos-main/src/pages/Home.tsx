import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { AppLayout } from '@/shared/components/layout/AppLayout';
import { useApp } from '@/app/context/AppContext';
import {
  Briefcase,
  Users,
  TrendingUp,
  Shield,
  Zap,
  Building2,
  ArrowRight,
  MapPin,
  Search
} from 'lucide-react';

export default function Home() {
  const { currentUser } = useApp();
  
  // Array de características actualizado con colores individuales y efectos Glow
  const features = [
    {
      icon: Briefcase,
      title: 'Oportunidades de Negocio',
      description: 'Encuentra proyectos y colaboraciones que se ajustan a tu experiencia',
      glow: 'bg-primary/10 group-hover:bg-primary/25',
      iconBg: 'bg-primary',
      iconShadow: 'shadow-lg',
      textColor: 'text-primary'
    },
    {
      icon: Users,
      title: 'Colaboración Efectiva',
      description: 'Herramientas integradas de comunicación y gestión de tareas',
      glow: 'bg-primary/10 group-hover:bg-primary/25',
      iconBg: 'bg-primary',
      iconShadow: 'shadow-lg',
      textColor: 'text-primary'
    },
    {
      icon: TrendingUp,
      title: 'Crecimiento Mutuo',
      description: 'Expande tu red y accede a nuevas oportunidades de negocio',
      glow: 'bg-primary/10 group-hover:bg-primary/25',
      iconBg: 'bg-primary',
      iconShadow: 'shadow-lg',
      textColor: 'text-primary'
    },
    {
      icon: Shield,
      title: 'Seguro y Confiable',
      description: 'Proceso de verificación de empresas para garantizar calidad',
      glow: 'bg-primary/10 group-hover:bg-primary/25',
      iconBg: 'bg-primary',
      iconShadow: 'shadow-lg',
      textColor: 'text-primary'
    },
    {
      icon: Zap,
      title: 'Rápido y Eficiente',
      description: 'Solicita participación y empieza a colaborar en minutos',
      glow: 'bg-primary/10 group-hover:bg-primary/25',
      iconBg: 'bg-primary',
      iconShadow: 'shadow-lg',
      textColor: 'text-primary'
    },
    {
      icon: Building2,
      title: 'Visibilidad Nacional',
      description: 'Conecta con empresas y socios estratégicos en todo el país',
      glow: 'bg-primary/10 group-hover:bg-primary/25',
      iconBg: 'bg-primary',
      iconShadow: 'shadow-lg',
      textColor: 'text-primary'
    }
  ];

  return (
    <AppLayout
      sinSidebar={!currentUser}
      isAdmin={currentUser?.rol === 'superadmin'}
      sinFooter
      mainClassName="flex-1 w-full overflow-hidden"
    >

          {/* ======================================= */}
          {/* HERO SECTION 3D (100% PANTALLA)         */}
          {/* ======================================= */}
          <section className="relative w-full min-h-[100dvh] -mt-14 md:-mt-16 flex items-center justify-center z-10 pb-10">
            
            <div className="absolute inset-0 rounded-b-[3rem] md:rounded-b-[5rem] bg-background border-b border-border/50 overflow-hidden -z-10">
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
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 relative z-30"
            >
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
            </motion.div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-center mb-16 md:mb-24"
              >
                <h2 className="text-3xl md:text-5xl font-extrabold mb-6">
                  Nuestros <span className="text-primary">Servicios</span>
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Soluciones diseñadas para impulsar tu negocio en cada etapa del camino.
                </p>
              </motion.div>

              {/* GRID DE LAS NUEVAS TARJETAS GLOW */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      viewport={{ once: true }}
                    >
                      <Card className="relative p-8 h-full bg-card border border-border/60 shadow-sm hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)] transition-all duration-500 rounded-[2rem] group overflow-hidden flex flex-col items-center text-center">
                        
                        {/* Círculo de Resplandor (Glow Effect) oculto al fondo */}
                        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 ${feature.glow} blur-[50px] rounded-full pointer-events-none transition-all duration-700`} />
                        
                        {/* Icono Redondo y Sólido */}
                        <div className={`relative z-10 w-16 h-16 rounded-full ${feature.iconBg} flex items-center justify-center mb-6 shadow-lg ${feature.iconShadow} transform group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-500`}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        
                        {/* Textos */}
                        <h3 className="relative z-10 text-xl font-bold mb-3 text-foreground transition-colors duration-300">
                          {feature.title}
                        </h3>
                        <p className="relative z-10 text-muted-foreground leading-relaxed flex-1 mb-8">
                          {feature.description}
                        </p>
                        
                        {/* Botón Saber Más (Aparece y se mueve en Hover) */}
                        <div className={`relative z-10 mt-auto text-sm font-bold ${feature.textColor} flex items-center gap-2 opacity-70 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300 cursor-pointer`}>
                          Saber más <ArrowRight className="w-4 h-4" />
                        </div>
                        
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ======================================= */}
          {/* HOW IT WORKS SECTION                    */}
          {/* ======================================= */}
          <section className="py-24 md:py-32 bg-background relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-center mb-20"
              >
                <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-3">Proceso Simple</h2>
                <h2 className="text-3xl md:text-5xl font-extrabold mb-6">
                  ¿Cómo funciona?
                </h2>
              </motion.div>

              <div className="grid md:grid-cols-3 gap-12 md:gap-8 relative">
                <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-px bg-border" />

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
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.2 }}
                    viewport={{ once: true }}
                    className="relative text-center"
                  >
                    <div className="w-24 h-24 mx-auto bg-card border-[6px] border-background shadow-xl rounded-full flex items-center justify-center relative z-10 mb-8 group hover:scale-105 transition-transform duration-300">
                      <div className="absolute inset-0 rounded-full bg-primary opacity-0 group-hover:opacity-10 transition-opacity" />
                      <span className="text-2xl font-extrabold text-primary">
                        {step.step}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-4">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed px-4">{step.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* ======================================= */}
          {/* CTA SECTION                             */}
          {/* ======================================= */}
          <section className="py-24">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
              >
                <div className="relative overflow-hidden rounded-[3rem] p-12 md:p-20 text-center shadow-2xl">
                  <div className="absolute inset-0 bg-primary" />
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
                  
                  <div className="relative z-10">
                    <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-white drop-shadow-md">
                      ¿Listo para llevar tu empresa al siguiente nivel?
                    </h2>
                    <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto font-medium">
                      Únete a cientos de empresas que ya están colaborando y escalando juntas en ProjectHub.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                      <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-full px-10 py-5 text-lg font-bold bg-background text-primary hover:bg-muted shadow-2xl hover:-translate-y-1 transition-all">
                        Registra tu Empresa Hoy
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
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