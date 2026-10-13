/* ============================================================================
 * src/pages/Register.tsx
 * Registro con el estilo de la portada (AccesoLayout). Cuatro pasos posibles:
 * elegir camino, unirse a una empresa, registrar una empresa o cuenta
 * independiente; y la pantalla de éxito. La lógica de cada formulario vive en
 * features/auth/components y no cambió.
 * El mazo de la derecha cambia de tarjetas según el camino y reacciona a los
 * campos: se abre con el correo y se da vuelta con las contraseñas.
 * ========================================================================= */

import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { CheckCircle2 } from 'lucide-react';
import { useEmpresas } from '@/features/empresas';
import { RegisterChooseStep } from '@/features/auth/components/RegisterChooseStep';
import { JoinCompanyForm } from '@/features/auth/components/JoinCompanyForm';
import { NewCompanyForm } from '@/features/auth/components/NewCompanyForm';
import { IndependentRegisterForm } from '@/features/auth/components/IndependentRegisterForm';
import { AccesoLayout, TituloAnimado } from '@/pages/acceso/AccesoLayout';
import { Credencial, FichaEmpresa, PerfilPrevio, RolesPrevio, type Rol } from '@/pages/acceso/VistasAcceso';
import s from '@/pages/acceso/Acceso.module.css';

type RegisterMode = 'choose' | 'join_company' | 'new_company' | 'independent' | 'success';


export default function Register() {
  const [mode, setMode] = useState<RegisterMode>('choose');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [independiente, setIndependiente] = useState(false);
  // Lo que se va escribiendo (por nombre de campo) y el rol que se mira:
  // alimentan la ilustración viva del panel derecho.
  const [valores, setValores] = useState<Record<string, string>>({});
  const [rolMirado, setRolMirado] = useState<Rol>(null);
  /** Cambia de paso y limpia lo escrito en el anterior. */
  const ir = (m: RegisterMode) => { setValores({}); setMode(m); };

  const { data: companies = [] } = useEmpresas();

  // Lee lo que se escribe en los campos (sin tocar los formularios) para la
  // ilustración viva. Ojo: se escucha el evento NATIVO y se actualiza en el
  // siguiente tick. Hacerlo en el mismo evento de React (onInputCapture)
  // re-renderizaba antes de que el formulario guardara la letra y la borraba.
  const contenedor = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = contenedor.current;
    if (!el) return;
    const alEscribir = (e: Event) => {
      const t = e.target as HTMLInputElement;
      if (!t.name || t.type === 'password' || t.type === 'file') return;
      setTimeout(() => setValores(prev => ({ ...prev, [t.name]: t.value })), 0);
    };
    el.addEventListener('input', alEscribir);
    return () => el.removeEventListener('input', alEscribir);
  }, [mode]);
  const navigate = useNavigate();

  const navDerecha = <><span>¿Ya tienes cuenta?</span><Link to="/login">Ingresar</Link></>;

  // ── Éxito ──
  if (mode === 'success') {
    return (
      <AccesoLayout navDerecha={navDerecha}>
        <div className={s.estado}>
          <div className={`${s.estadoIcono} ${s.aparece}`} style={{ background: 'var(--verde)' }}><CheckCircle2 size={38} /></div>
          <TituloAnimado texto={independiente ? '¡Cuenta creada!' : '¡Solicitud enviada!'} retraso={0.1} />
          <p className={s.sub}>
            {independiente
              ? 'Tu cuenta ya está activa. Inicia sesión para explorar proyectos y postular.'
              : selectedCompanyId
                ? 'Tu solicitud fue enviada al administrador de la empresa. Te notificarán cuando sea aprobada.'
                : 'Tu solicitud de empresa fue enviada al equipo de ProjectHub para revisión. Una vez aprobada podrás iniciar sesión.'}
          </p>
          <button type="button" className={`${s.btn} ${s.aparece}`} style={{ animationDelay: '.5s', maxWidth: 360 }} onClick={() => navigate('/login')}>
            Ir a iniciar sesión
          </button>
        </div>
      </AccesoLayout>
    );
  }

  // En "elegir camino": qué opción se está mirando.
  const alMirar = (e: MouseEvent<HTMLDivElement>) => {
    const boton = (e.target as HTMLElement).closest('button');
    if (!boton) return; // entre opciones: se mantiene la que estaba
    const texto = boton.textContent ?? '';
    setRolMirado(texto.includes('ya está registrada') ? 'unirse' : texto.includes('registrar mi empresa') ? 'empresa' : texto.includes('independiente') ? 'independiente' : null);
  };

  const empresaElegida = companies.find(c => c.id === Number(selectedCompanyId));
  const panel = (
    <div className={s.panel} aria-hidden="true">
      {mode === 'choose' && <RolesPrevio resaltado={rolMirado} />}
      {mode === 'new_company' && <FichaEmpresa v={valores} />}
      {mode === 'independent' && <PerfilPrevio v={valores} />}
      {mode === 'join_company' && <Credencial empresa={empresaElegida?.nombre} logo={empresaElegida?.logo_url} v={valores} />}
    </div>
  );

  return (
    <AccesoLayout navDerecha={navDerecha} panel={panel} ancho={mode !== 'choose'}>
      {/* key = modo: cada paso entra con su animación */}
      <div key={mode} ref={contenedor} onMouseOverCapture={mode === 'choose' ? alMirar : undefined} onMouseLeave={() => setRolMirado(null)}>
        {mode === 'choose' && (
          <RegisterChooseStep
            companies={companies}
            onSelectCompany={(companyId) => { setSelectedCompanyId(companyId); ir('join_company'); }}
            onNewCompany={() => ir('new_company')}
            onIndependent={() => { setIndependiente(true); ir('independent'); }}
          />
        )}
        {mode === 'independent' && (
          <IndependentRegisterForm
            onBack={() => { setIndependiente(false); ir('choose'); }}
            onSuccess={() => setMode('success')}
          />
        )}
        {mode === 'join_company' && (
          <JoinCompanyForm
            company={companies.find(c => c.id === Number(selectedCompanyId))}
            onBack={() => ir('choose')}
            onSuccess={() => setMode('success')}
          />
        )}
        {mode === 'new_company' && (
          <NewCompanyForm
            onBack={() => ir('choose')}
            onSuccess={() => setMode('success')}
          />
        )}
      </div>
    </AccesoLayout>
  );
}
