import { useLocation, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, LayoutDashboard, Package, Wallet, Receipt, Unlock, LogOut, Settings } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useStore } from '@/store/useStore';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

const links = [
  { to: '/', label: 'PDV', icon: ShoppingCart },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/produtos', label: 'Produtos', icon: Package },
  { to: '/caixa', label: 'Caixa', icon: Wallet },
  { to: '/vendas', label: 'Vendas', icon: Receipt },
];

export function TopNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { pinUnlocked, lockPin, logout, companyName, password, pin, changePassword, changePin } = useAuthStore();
  const { cashRegister, cart } = useStore();
  const isRegisterOpen = cashRegister && !cashRegister.closedAt;
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'password' | 'pin'>('password');
  const [settingsPin, setSettingsPin] = useState('');
  const [settingsPassword, setSettingsPassword] = useState('');
  const [newValue, setNewValue] = useState('');

  // Navigation confirmation alert
  const [navAlert, setNavAlert] = useState<{ to: string } | null>(null);

  const handleNavClick = (to: string, e: React.MouseEvent) => {
    if (pathname === '/' && to !== '/' && cart.length > 0) {
      e.preventDefault();
      setNavAlert({ to });
    }
  };

  const confirmNav = () => {
    if (navAlert) {
      navigate(navAlert.to);
      setNavAlert(null);
    }
  };

  const handleChangePassword = () => {
    if (changePassword(settingsPin, newValue)) {
      toast.success('Senha alterada!');
      setShowSettings(false);
      setSettingsPin('');
      setNewValue('');
    } else {
      toast.error('PIN incorreto');
    }
  };

  const handleChangePin = () => {
    if (newValue.length !== 4) {
      toast.error('O PIN deve ter exatamente 4 dígitos');
      return;
    }
    if (changePin(settingsPassword, newValue)) {
      toast.success('PIN alterado!');
      setShowSettings(false);
      setSettingsPassword('');
      setNewValue('');
    } else {
      toast.error('Senha incorreta');
    }
  };

  return (
    <>
      <nav className="h-12 bg-card border-b border-border flex items-center px-4 gap-1 shrink-0">
        <span className="text-primary font-extrabold text-sm tracking-tight mr-5 flex items-center gap-1.5">
          🍕 {companyName}
        </span>

        <div className="flex gap-0.5">
          {links.map((l) => {
            const active = pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                onClick={(e) => handleNavClick(l.to, e)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <l.icon className="w-3.5 h-3.5" />
                {l.label}
                {l.to === '/caixa' && isRegisterOpen && (
                  <span className="w-1.5 h-1.5 rounded-full bg-success" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {isRegisterOpen && (
            <span className="text-[10px] text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded font-medium">
              Caixa Aberto
            </span>
          )}

          {pinUnlocked && (
            <button onClick={lockPin} className="text-success hover:text-foreground transition-colors p-1" title="Bloquear PIN">
              <Unlock className="w-3.5 h-3.5" />
            </button>
          )}

          <button onClick={() => setShowSettings(true)} className="text-muted-foreground hover:text-foreground transition-colors p-1" title="Configurações">
            <Settings className="w-3.5 h-3.5" />
          </button>

          <button onClick={logout} className="text-muted-foreground hover:text-destructive transition-colors p-1" title="Sair">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      {/* Navigation confirmation alert */}
      <AlertDialog open={!!navAlert} onOpenChange={(open) => !open && setNavAlert(null)}>
        <AlertDialogContent className="bg-card border-border max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Mudar de página?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a sair desta página. Dados não salvos podem ser perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmNav} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Settings dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle>Configurações</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 mb-4">
            <Button size="sm" variant={settingsTab === 'password' ? 'default' : 'outline'} onClick={() => { setSettingsTab('password'); setNewValue(''); }} className="text-xs">
              Alterar Senha
            </Button>
            <Button size="sm" variant={settingsTab === 'pin' ? 'default' : 'outline'} onClick={() => { setSettingsTab('pin'); setNewValue(''); }} className="text-xs">
              Alterar PIN
            </Button>
          </div>
          {settingsTab === 'password' && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Senha atual: <span className="font-mono text-foreground">{password}</span></p>
              <p className="text-xs text-muted-foreground">Informe o PIN para alterar a senha</p>
              <PasswordInput placeholder="PIN atual" value={settingsPin} onChange={(e) => setSettingsPin(e.target.value.replace(/\D/g, '').slice(0, 4))} className="bg-secondary border-border" />
              <PasswordInput placeholder="Nova senha" value={newValue} onChange={(e) => setNewValue(e.target.value)} className="bg-secondary border-border" />
              <Button onClick={handleChangePassword} className="w-full bg-primary hover:bg-primary/90">Alterar Senha</Button>
            </div>
          )}
          {settingsTab === 'pin' && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">PIN atual: <span className="font-mono text-foreground">{pin}</span></p>
              <p className="text-xs text-muted-foreground">Informe a senha para alterar o PIN</p>
              <PasswordInput placeholder="Senha atual" value={settingsPassword} onChange={(e) => setSettingsPassword(e.target.value)} className="bg-secondary border-border" />
              <Input placeholder="Novo PIN (4 dígitos)" value={newValue} onChange={(e) => setNewValue(e.target.value.replace(/\D/g, '').slice(0, 4))} className="bg-secondary border-border" />
              <Button onClick={handleChangePin} className="w-full bg-primary hover:bg-primary/90">Alterar PIN</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
