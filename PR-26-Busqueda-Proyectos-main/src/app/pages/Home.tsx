import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { useApp } from '../context/AppContext';
import {
  Briefcase,
  Users,
  TrendingUp,
  Shield,
  Zap,
  Building2,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

export default function Home() {
  const { currentUser } = useApp();
  const features = [
    {
      icon: Briefcase,
      title: 'Oportunidades de Negocio',
      description: 'Encuentra proyectos y colaboraciones que se ajustan a tu experiencia'
    },
    {
      icon: Users,
      title: 'Colaboración Efectiva',
      description: 'Herramientas integradas de comunicación y gestión de tareas'
    },
    {
      icon: TrendingUp,
      title: 'Crecimiento Mutuo',
      description: 'Expande tu red y accede a nuevas oportunidades de negocio'
    },
    {
      icon: Shield,
      title: 'Seguro y Confiable',
      description: 'Proceso de verificación de empresas para garantizar calidad'
    },
    {
      icon: Zap,
      title: 'Rápido y Eficiente',
      description: 'Solicita participación y empieza a colaborar en minutos'
    },
    {
      icon: Building2,
      title: 'Visibilidad Nacional',
      description: 'Conecta con empresas y socios estratégicos en todo el país'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted text-foreground">
      <Navbar />
      
      <div className="flex">
        {currentUser && <Sidebar isAdmin={currentUser.rol === 'superadmin'} />}
        
        <main className="flex-1">

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Conecta y Colabora en un Ecosistema Empresarial
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Somos una plataforma que une a las empresas bolivianas para crear el futuro juntas.
              Publica proyectos, encuentra aliados estratégicos y trabaja en un espacio integrado.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link to="/register">
                <Button variant="primary" size="lg" className="flex items-center gap-2">
                  Empezar Ahora
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/explore">
                <Button variant="outline" size="lg">
                  Ver Proyectos
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">
              Crea, Colabora y Escala tu Empresa            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card hover className="p-6 h-full">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">
              Cómo funciona
            </h2>
            <p className="text-xl text-muted-foreground">
              Comienza a colaborar en 3 simples pasos
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Regístrate y crea tu perfil',
                description: 'Crea una cuenta, completa el perfil de tu empresa y espera la aprobación del administrador'
              },
              {
                step: '02',
                title: 'Explora o crea proyectos',
                description: 'Publica tus propios proyectos o encuentra oportunidades que coincidan con tu experiencia'
              },
              {
                step: '03',
                title: 'Colabora y crece',
                description: 'Trabaja con otras empresas usando chat, gestión de tareas y recursos compartidos'
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="text-6xl font-bold text-primary/10 mb-4">{step.step}</div>
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  {step.title}
                </h3>
                <p className="text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Card className="p-12 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border-2">
              <h2 className="text-4xl font-bold mb-4">
                ¿Listo para comenzar?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Únete a cientos de empresas que ya están colaborando en proyectos innovadores
              </p>
              <Link to="/register">
                <Button variant="primary" size="lg" className="flex items-center gap-2 mx-auto">
                  Registra tu Empresa
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
          <p>&copy; 2026 ProjectHub. Todos los derechos reservados.</p>
        </div>
      </footer>
        </main>
      </div>
    </div>
  );
}
