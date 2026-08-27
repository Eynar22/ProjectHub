import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useEmpresas } from '@/features/empresas';
import { RegisterChooseStep } from '@/features/auth/components/RegisterChooseStep';
import { JoinCompanyForm } from '@/features/auth/components/JoinCompanyForm';
import { NewCompanyForm } from '@/features/auth/components/NewCompanyForm';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Navbar } from '@/shared/components/layout/Navbar';
import { CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

type RegisterMode = 'choose' | 'join_company' | 'new_company' | 'success';

export default function Register() {
  const [mode, setMode] = useState<RegisterMode>('choose');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');

  const { data: companies = [] } = useEmpresas();
  const navigate = useNavigate();

  // ── Success ──
  if (mode === 'success') {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center py-16 px-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
            <Card className="p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-primary-foreground" />
                </div>
              </div>
              <h1 className="text-3xl font-bold mb-4">¡Solicitud Enviada!</h1>
              <p className="text-muted-foreground mb-8">
                {selectedCompanyId
                  ? 'Tu solicitud fue enviada al administrador de la empresa. Te notificarán cuando sea aprobada.'
                  : 'Tu solicitud de empresa fue enviada al Super Admin para revisión. Una vez aprobada podrás iniciar sesión.'}
              </p>
              <Button variant="primary" className="w-full" onClick={() => navigate('/login')}>
                Ir a Iniciar Sesión
              </Button>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="py-16 px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">

          {mode === 'choose' && (
            <RegisterChooseStep
              companies={companies}
              onSelectCompany={(companyId) => { setSelectedCompanyId(companyId); setMode('join_company'); }}
              onNewCompany={() => setMode('new_company')}
            />
          )}

          {mode === 'join_company' && (
            <JoinCompanyForm
              company={companies.find(c => c.id === Number(selectedCompanyId))}
              onBack={() => setMode('choose')}
              onSuccess={() => setMode('success')}
            />
          )}

          {mode === 'new_company' && (
            <NewCompanyForm
              onBack={() => setMode('choose')}
              onSuccess={() => setMode('success')}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}
