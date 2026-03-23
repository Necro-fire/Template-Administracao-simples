import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';

interface PinGuardProps {
  children: React.ReactNode;
  title?: string;
}

export function PinGuard({ children, title = 'Área Protegida' }: PinGuardProps) {
  const { pinUnlocked, unlockPin } = useAuthStore();
  const [pin, setPin] = useState('');

  if (pinUnlocked) return <>{children}</>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlockPin(pin)) {
      toast.success('PIN desbloqueado');
    } else {
      toast.error('PIN incorreto');
      setPin('');
    }
  };

  return (
    <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
      <div className="glass-card p-8 w-full max-w-xs text-center animate-scale-in">
        <Lock className="w-10 h-10 text-primary mx-auto mb-4" />
        <h2 className="font-bold text-lg mb-1">{title}</h2>
        <p className="text-sm text-muted-foreground mb-6">Digite o PIN para acessar</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="••••"
            className="bg-secondary border-border text-center text-lg tracking-widest"
            autoFocus
          />
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 font-bold">
            Desbloquear
          </Button>
        </form>
      </div>
    </div>
  );
}
