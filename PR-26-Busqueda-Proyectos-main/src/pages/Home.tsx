import { useState, useRef, useEffect } from 'react';
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

// Estrellas de la sección 3: se calculan una sola vez al cargar el módulo, no en
// cada render (así el campo de estrellas no se re-baraja si el componente
// vuelve a renderizar).
const SECTION3_STARS = Array.from({ length: 25 }, () => ({
  size: Math.random() * 3 + 1,
  left: Math.random() * 100,
  top: Math.random() * 100,
  duration: Math.random() * 5 + 5,
  delay: Math.random() * 5,
}));

// Imagen de fondo de la sección "Impacto Sostenible". TEMPORAL: es de prueba,
// reemplazar luego por la definitiva (idealmente subida a public/images/).
const IMPACTO_BG_URL =
  'https://www.cidob.org/sites/default/files/2024-12/El%20m%C3%B3n%20el%202025_web.jpg';

// ==========================================
// COMPONENTE: COHETE HOLOGRÁFICO PREMIUM (DISPERSIÓN A PANTALLA COMPLETA)
// ==========================================
interface Particle {
  x3d: number; y3d: number; z3d: number;
  sx: number; sy: number; sz: number;
  nx: number; ny: number; nz: number;
  color: string; type: string; ty: number;
  x: number; y: number;
  vx: number; vy: number;
  baseZ: number;
  edgeFactor: number;
}

const ParticleRocket = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    // Aumentamos masivamente el lienzo a 1400px para que las partículas vuelen por todos lados
    const width = 1400;
    const height = 1400;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const particles: Particle[] = [];
    const mouse = { x: -1000, y: -1000, radius: 100 };

    const addP = (x: number, y: number, z: number, nx: number, ny: number, nz: number, color: string, type: string, ty = 0) => {
      // Vector explosivo mucho más grande para abarcar toda la pantalla
      const sTheta = Math.random() * Math.PI * 2;
      const sPhi = Math.acos(2 * Math.random() - 1);
      const sDist = 400 + Math.random() * 1800;

      particles.push({
        x3d: x, y3d: y, z3d: z,
        sx: sDist * Math.sin(sPhi) * Math.cos(sTheta),
        sy: sDist * Math.sin(sPhi) * Math.sin(sTheta),
        sz: sDist * Math.cos(sPhi),
        nx, ny, nz,
        color, type, ty,
        x: width/2, y: height/2,
        vx: 0, vy: 0, baseZ: 0,
        edgeFactor: 0
      });
    };

    const getRadius = (y: number) => {
      if (y < -130) return 0;
      if (y < -90) {
        const t = (y + 130) / 40;
        return 35 * Math.pow(t, 0.6);
      }
      if (y <= 80) {
        const t = (y + 90) / 170;
        return 35 + Math.sin(t * Math.PI) * 12 - (t * 5);
      }
      if (y <= 100) {
        const t = (y - 80) / 20;
        return 30 + Math.sin(t * Math.PI) * 4;
      }
      return 0;
    };

    const generateModel = () => {
      const winCenterY = -55;
      const winAngle = (Math.PI / 2) - 0.55;

      for(let i=0; i<4200; i++) {
        const y = -130 + Math.random() * 230;
        const rBase = getRadius(y);
        const theta = Math.random() * 2 * Math.PI;

        const x = rBase * Math.cos(theta);
        const z = rBase * Math.sin(theta);
        const nx = Math.cos(theta);
        const nz = Math.sin(theta);

        let angleDiff = Math.abs(theta - winAngle);
        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
        const arcLength = angleDiff * rBase;
        const distToWin = Math.sqrt(arcLength * arcLength + Math.pow(y - winCenterY, 2));
        if (distToWin < 25) continue;

        let type = 'body';
        let color;

        if (y < -110 || (y < -90 && nx > -0.3) || nx > 0.15) {
          color = ['#fef08a', '#fde047', '#fbbf24'][Math.floor(Math.random()*3)];
        } else {
          color = ['#38bdf8', '#60a5fa', '#3b82f6'][Math.floor(Math.random()*3)];
        }

        if (y > 80) {
          type = 'nozzle';
          color = ['#e2e8f0', '#cbd5e1', '#94a3b8'][Math.floor(Math.random()*3)];
        }

        const isFinArea = y > 10 && y < 85 && Math.abs(nz) < 0.35;
        if (isFinArea) continue;

        addP(x, y, z, nx, 0, nz, color, type);
      }

      for(let i=0; i<450; i++) {
        const r = Math.random() > 0.3 ? 18 + Math.random() * 6 : Math.random() * 24;
        const localTheta = Math.random() * Math.PI * 2;
        const localX = r * Math.cos(localTheta);
        const localY = r * Math.sin(localTheta);

        const y = winCenterY + localY;
        const rBody = getRadius(y);
        const angle = winAngle + (localX / rBody);

        const x = rBody * Math.cos(angle);
        const z = rBody * Math.sin(angle);

        let color = Math.random() > 0.4 ? '#ffffff' : '#bae6fd';

        if (localY < 0 && localX < 0) {
          color = ['#fef08a', '#fde047', '#fbbf24'][Math.floor(Math.random()*3)];
        }

        addP(x, y, z, Math.cos(angle), 0, Math.sin(angle), color, 'window');
      }

      for(let i=0; i<150; i++) {
        const y = -70 + Math.random() * 140;
        const maxR = getRadius(y) * 0.7;
        const r = Math.random() * maxR;
        const theta = Math.random() * 2 * Math.PI;
        addP(r * Math.cos(theta), y, r * Math.sin(theta), 0, 1, 0, '#38bdf8', 'inner');
      }

      for (let leg = 0; leg < 2; leg++) {
        const angle = leg === 0 ? 0 : Math.PI;

        for(let i=0; i<1500; i++) {
          const u = Math.random();
          const v = Math.random();

          let yTop = 15 + Math.pow(u, 1.8) * 110;
          let yBottom = 75 + Math.pow(u, 3) * 55;

          if (u > 0.85) {
            const blunt = (u - 0.85) / 0.15;
            yTop += Math.pow(blunt, 2) * 15;
            yBottom -= Math.pow(blunt, 2) * 10;
          }

          if (yTop >= yBottom) continue;

          const y = yTop + v * (yBottom - yTop);
          const rBase = getRadius(Math.min(y, 85)) - 3;

          const rFin = rBase + (u * 65);
          const thickness = (Math.random() - 0.5) * 8 * (1 - u * 0.2);

          const x = rFin * Math.cos(angle) - Math.sin(angle) * thickness;
          const z = rFin * Math.sin(angle) + Math.cos(angle) * thickness;

          const color = ['#f43f5e', '#e11d48', '#be123c'][Math.floor(Math.random()*3)];

          addP(x, y, z, 0, 0, 1, color, 'fin');
        }
      }

      for(let i=0; i<900; i++) {
        const ty = Math.random();
        const y = 100 + ty * 20;
        const maxR = 24 * (1 - Math.pow(ty, 1.5));
        const r = Math.random() * maxR;

        const theta = Math.random() * Math.PI * 2;
        const x = r * Math.cos(theta);
        const z = r * Math.sin(theta);

        const color = ty < 0.3 ? '#fef08a' : (ty < 0.6 ? '#f97316' : '#ef4444');
        addP(x, y, z, 0, 1, 0, color, 'fire', ty);
      }
    };

    generateModel();

    let animationFrameId: number;
    let time = 0;
    let currentScatter = 0;
    const cx = width / 2;
    const cy = height / 2;

    const baseRotX = -0.3;
    const baseRotY = -0.55;
    const rotZ = 0.65;

    let currentRotX = baseRotX;
    let currentRotY = baseRotY;

    const animate = () => {
      time += 0.03;
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'screen';

      // MAGIA DEL SCROLL DE DESTRUCCIÓN
      const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
      const targetScatter = Math.max(0, Math.min(1, (scrollY - 50) / 450));
      currentScatter += (targetScatter - currentScatter) * 0.08;

      const targetRotX = baseRotX + (mouse.y > 0 ? (mouse.y - cy) * 0.00015 : 0);
      const targetRotY = baseRotY + (mouse.x > 0 ? (mouse.x - cx) * 0.00015 : 0);
      currentRotX += (targetRotX - currentRotX) * 0.1;
      currentRotY += (targetRotY - currentRotY) * 0.1;

      const floatY = Math.sin(time * 0.8) * 6;

      particles.forEach(p => {
        let px = p.x3d + (p.sx * currentScatter);
        let py = p.y3d + (p.sy * currentScatter);
        let pz = p.z3d + (p.sz * currentScatter);
        const nz = p.nz;

        if (p.type === 'fire') {
          const drop = ((time * 0.8 + p.ty) % 1) * 45;
          py += drop;
          const shrink = Math.max(0.1, 1 - drop / 45);
          px = (px * shrink) + Math.sin(time * 10 + p.ty * 20) * 2;
          pz = (pz * shrink) + Math.cos(time * 10 + p.ty * 20) * 2;
        }

        const y1 = py * Math.cos(currentRotX) - pz * Math.sin(currentRotX);
        const z1 = py * Math.sin(currentRotX) + pz * Math.cos(currentRotX);
        const x2 = px * Math.cos(currentRotY) + z1 * Math.sin(currentRotY);
        const z2 = -px * Math.sin(currentRotY) + z1 * Math.cos(currentRotY);
        const x3 = x2 * Math.cos(rotZ) - y1 * Math.sin(rotZ);
        const y3 = x2 * Math.sin(rotZ) + y1 * Math.cos(rotZ);

        const nz1 = 0 * Math.sin(currentRotX) + nz * Math.cos(currentRotX);
        const nz2 = -p.nx * Math.sin(currentRotY) + nz1 * Math.cos(currentRotY);

        // Escalamos a 2.6 para compensar el lienzo gigante y que el cohete se vea grande
        const targetX = cx + x3 * 2.6;
        const targetY = cy + y3 * 2.6 + floatY;
        p.baseZ = z2;

        p.edgeFactor = 1 - Math.abs(nz2);

        const dx = mouse.x - targetX;
        const dy = mouse.y - targetY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < mouse.radius && mouse.x > 0) {
          const force = (mouse.radius - dist) / mouse.radius;
          p.vx -= (dx / dist) * force * 3.5;
          p.vy -= (dy / dist) * force * 3.5;
        }

        p.vx += (targetX - p.x) * 0.15;
        p.vy += (targetY - p.y) * 0.15;
        p.vx *= 0.8;
        p.vy *= 0.8;
        p.x += p.vx;
        p.y += p.vy;
      });

      particles.sort((a, b) => a.baseZ - b.baseZ);

      particles.forEach(p => {
        let size = 2.5;
        let alpha: number;

        if (p.type === 'fire') {
          alpha = 0.9 * (1 - p.ty);
          size = 3 + Math.random() * 2;
        } else if (p.type === 'window') {
          alpha = 0.4 + Math.random() * 0.5;
          size = 1.5 + Math.random() * 1.5;
        } else if (p.type === 'fin' || p.type === 'nozzle') {
          alpha = 0.85 + 0.15 * p.edgeFactor;
        } else if (p.type === 'inner') {
          alpha = 0.2 + (Math.sin(time * 5 + p.x3d) * 0.15);
          size = 2;
        } else {
          alpha = 0.1 + Math.pow(p.edgeFactor, 3) * 0.9;
        }

        ctx.globalAlpha = Math.min(1, alpha + currentScatter * 0.6);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, size, size);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - rect.left) * (width / rect.width);
      mouse.y = (e.clientY - rect.top) * (height / rect.height);
    };
    const handleMouseLeave = () => {
      mouse.x = -1000; mouse.y = -1000;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    // Se elimina el encierro de aspecto cuadrado y se hace gigante y absoluto.
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1400px] h-[1400px] flex items-center justify-center pointer-events-auto z-0">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 blur-[140px] rounded-full pointer-events-none" />
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%' }}
        className="object-contain z-10 cursor-crosshair"
      />
    </div>
  );
};


export default function Home() {
  const { currentUser } = useApp();
  const { data: projects = [] } = useProyectos();

  // Hooks para el efecto de "Zoom Out"
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 500], [1, 0.85]);
  const heroY = useTransform(scrollY, [0, 500], [0, 60]);

  // Referencia y Hooks para la Sección 3
  const section3Ref = useRef<HTMLElement>(null);
  const { scrollYProgress: scrollYProgress3 } = useScroll({
    target: section3Ref,
    offset: ["start start", "end start"]
  });
  const sec3Opacity = useTransform(scrollYProgress3, [0, 1], [1, 0]);
  const sec3Scale = useTransform(scrollYProgress3, [0, 1], [1, 0.85]);
  const sec3Y = useTransform(scrollYProgress3, [0, 1], [0, 100]);

  // Cálculos ODS
  const odsConteo = ODS_LIST.map(o => ({
    ...o,
    total: projects.filter(p => Array.isArray(p.ods) && p.ods.includes(o.id)).length,
  })).sort((a, b) => b.total - a.total);
  const totalAportes = odsConteo.reduce((s, o) => s + o.total, 0);
  const proyectosConOds = projects.filter(p => Array.isArray(p.ods) && p.ods.length > 0).length;

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

            {/* 1. FONDO ESTÁTICO (Queda fuera de la animación) */}
            <div
              className="absolute inset-0 bg-cover bg-center bg-fixed"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#05050A] via-[#05050A]/90 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#05050A] via-transparent to-transparent opacity-90" />

            {/* 2. CONTENIDO ANIMADO */}
            <motion.div
              style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
              className="absolute inset-0 w-full h-full flex flex-col justify-center overflow-hidden"
            >
              <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 md:pb-24">

                {/* 🚀 EL COHETE EN EL FONDO (z-0) PARA QUE SE ESPARZA LIBREMENTE */}
                <div className="absolute inset-0 hidden lg:block z-0 pointer-events-none">
                  {/* Lo alineamos a la cuadrícula de la derecha donde estaba antes */}
                  <div className="w-full h-full grid grid-cols-2">
                    <div></div>
                    <div className="relative w-full h-full flex justify-center items-center">
                       <ParticleRocket />
                    </div>
                  </div>
                </div>

                {/* 📝 EL TEXTO AL FRENTE (z-20) PROTEGIDO */}
                <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 items-center relative z-20 pointer-events-none">

                  <motion.div variants={textContainer} initial="hidden" animate="show" className="max-w-xl pointer-events-auto">
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

                  <div className="hidden lg:block"></div>

                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ======================================= */}
        {/* SECCIÓN 2: ¿QUÉ ES PROJECTHUB?          */}
        {/* ======================================= */}
        <section className="relative z-20 bg-gradient-to-b from-primary/5 via-muted/30 to-background border-t border-border pt-24 pb-24 shadow-[0_-20px_60px_rgba(0,0,0,0.5)]">
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
                  <div
                    className="group relative h-full flex flex-col items-center text-center p-8 md:p-10 bg-card shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border-l-[6px] border-b-[6px] border-t border-r border-t-border/50 border-r-border/50 rounded-tl-[4rem] rounded-br-[4rem] rounded-tr-xl rounded-bl-xl"
                    style={{ borderLeftColor: item.color, borderBottomColor: item.color }}
                  >

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
        {/* SECCIÓN 3: INNOVACIÓN Y ECOSISTEMA     */}
        {/* ======================================= */}
        <section className="relative w-full z-20 bg-[#05050A]">
          <div className="relative w-full py-24 flex flex-col justify-center overflow-hidden">

            {/* El fondo espacial ahora es totalmente ESTÁTICO */}
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')" }} 
            />

            {/* Overlay Oscuro para Contraste (85% de opacidad) */}
            <div className="absolute inset-0 bg-[#05050A]/35" />

            {/* Contenido Principal */}
            {/* Se quitaron 'opacity', 'scale' y 'y' para que no responda al scroll elásticamente */}
            <div className="max-w-5xl mx-auto px-6 lg:px-10 relative z-10 text-center">
              <Reveal>

                {/* Badge "El Ecosistema" */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-primary/30 bg-[#05050A]/60 backdrop-blur-md shadow-inner">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                    El Ecosistema
                  </p>
                </div>

                {/* Título de la Sección */}
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-10 text-white tracking-tighter leading-[1.05] drop-shadow-2xl">
                  Innovación <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent font-serif italic font-normal">empresarial</span>
                </h2>

                {/* Descripción de la Sección */}
                <p className="text-xl md:text-2xl text-slate-200 leading-relaxed font-normal drop-shadow-md max-w-3xl mx-auto">
                  Creemos en el poder de la colaboración para impulsar la economía. ProjectHub centraliza la oferta y demanda del sector corporativo, brindando un entorno seguro donde las empresas bolivianas pueden encontrar aliados estratégicos, gestionar proyectos y escalar a nivel nacional.
                </p>

              </Reveal>
            </div>

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
        {/* SECCIÓN 5: ALINEACIÓN CON LOS ODS (RUEDA INTERACTIVA) */}
        {/* ======================================= */}
        <section className="relative z-20 py-24 border-t border-border/50 overflow-hidden">

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
                {proyectosConOds > 0
                  ? <>Ya son <strong className="text-foreground">{proyectosConOds}</strong> proyectos con <strong className="text-foreground">{totalAportes}</strong> aportes declarados. Haz clic en cada objetivo para ver el detalle.</>
                  : <>Haz clic en cada objetivo para ver nuestro impacto directo y la cantidad de proyectos activos.</>}
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
                    <span className="text-[10px] md:text-sm font-bold tracking-widest text-white whitespace-nowrap">
                      {activeOds?.total || 0} PROYECTOS
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

          </div>
        </section>

        {/* ======================================= */}
        {/* CTA FINAL - IMAGEN CORPORATIVA Y DEGRADADO LATERAL */}
        {/* ======================================= */}
        <section className="relative z-20 bg-[#05050A] border-t border-border overflow-hidden">

          <div
            className="absolute inset-0 w-full md:w-[70%] h-full bg-cover bg-center"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2070&auto=format&fit=crop')" }}
          />

          <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-[#05050A]/40 via-[#05050A]/90 to-[#05050A] md:from-transparent md:via-[#05050A]/95 md:to-[#05050A]" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-24 md:py-32 flex flex-col md:flex-row md:justify-end">

            <Reveal className="w-full md:w-[60%] lg:w-[50%] text-left mt-40 md:mt-0">

              <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-primary/20 border border-primary/30 text-blue-400 text-xs font-bold tracking-widest uppercase backdrop-blur-sm shadow-sm">
                <Zap className="w-4 h-4" />
                El futuro es colaborativo
              </div>

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
