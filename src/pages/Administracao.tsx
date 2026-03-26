import { useState } from 'react';
import { PinGuard } from '@/components/PinGuard';
import { useStore } from '@/store/useStore';
import { PizzaBorder, PizzaSize, PIZZA_SIZES, BorderCategory, FreeBorderRule, FreeSodaRule } from '@/types/pizzaria';
import { formatCurrency } from '@/lib/format';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Gift, ShieldCheck, Settings2 } from 'lucide-react';

const BORDER_CATEGORIES: { value: BorderCategory; label: string }[] = [
  { value: 'tradicional', label: 'Tradicional' },
  { value: 'premium', label: 'Premium' },
];

export default function Administracao() {
  const {
    borders, addBorder, updateBorder, deleteBorder,
    freeBorderRules, setFreeBorderRules,
    freeSodaRules, setFreeSodaRules,
  } = useStore();

  const [tab, setTab] = useState<'bordas' | 'regras'>('bordas');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PizzaBorder | null>(null);
  const [form, setForm] = useState<Omit<PizzaBorder, 'id'>>({
    name: '', price: 0, cost: 0, category: 'tradicional', active: true, freeSizes: [],
  });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const openNew = () => {
    setForm({ name: '', price: 0, category: 'tradicional', active: true, freeSizes: [] });
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (b: PizzaBorder) => {
    setForm({ ...b });
    setEditing(b);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Nome obrigatório'); return; }
    if (editing) {
      await updateBorder({ ...form, id: editing.id } as PizzaBorder);
      toast.success('Borda atualizada');
    } else {
      await addBorder({ ...form, id: crypto.randomUUID() } as PizzaBorder);
      toast.success('Borda adicionada');
    }
    setDialogOpen(false);
  };

  const confirmDelete = async () => {
    if (deleteConfirm) {
      await deleteBorder(deleteConfirm);
      toast.success('Borda removida');
      setDeleteConfirm(null);
    }
  };

  const toggleFreeSize = (sz: PizzaSize) => {
    setForm({
      ...form,
      freeSizes: form.freeSizes.includes(sz)
        ? form.freeSizes.filter(s => s !== sz)
        : [...form.freeSizes, sz],
    });
  };

  const toggleFreeBorderRule = async (sz: PizzaSize) => {
    const newRules: FreeBorderRule[] = PIZZA_SIZES.map(s => {
      const existing = freeBorderRules.find(r => r.size === s.value);
      if (s.value === sz) return { size: sz, enabled: !(existing?.enabled ?? false) };
      return existing || { size: s.value, enabled: false };
    });
    await setFreeBorderRules(newRules);
    toast.success('Regra atualizada');
  };

  const toggleFreeSodaRule = async (sz: PizzaSize) => {
    const newRules: FreeSodaRule[] = PIZZA_SIZES.map(s => {
      const existing = freeSodaRules.find(r => r.size === s.value);
      if (s.value === sz) return { size: sz, enabled: !(existing?.enabled ?? false) };
      return existing || { size: s.value, enabled: false };
    });
    await setFreeSodaRules(newRules);
    toast.success('Regra atualizada');
  };

  return (
    <PinGuard title="Administração">
      <div className="p-4 md:p-6 space-y-5 animate-fade-in max-w-[1200px] mx-auto">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Administração</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Gerencie bordas, promoções e regras do sistema</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setTab('bordas')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${
              tab === 'bordas' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            🧀 Cadastro de Bordas
          </button>
          <button
            onClick={() => setTab('regras')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${
              tab === 'regras' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-1.5"><Settings2 className="w-3.5 h-3.5" /> Regras de Grátis</span>
          </button>
        </div>

        {tab === 'bordas' && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{borders.length} bordas cadastradas</p>
              <Button onClick={openNew} className="bg-primary hover:bg-primary/90 gap-1.5 font-semibold text-xs">
                <Plus className="w-4 h-4" /> Nova Borda
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {borders.map(b => (
                <div key={b.id} className={`bg-card border rounded-lg p-4 transition-all ${b.active ? 'border-border' : 'border-border opacity-50'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm text-foreground">{b.name}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{b.category} · {b.active ? 'Ativo' : 'Inativo'}</p>
                    </div>
                    <span className="text-sm font-bold text-primary">{formatCurrency(b.price)}</span>
                  </div>
                  {b.freeSizes.length > 0 && (
                    <div className="flex gap-1 mb-2">
                      {b.freeSizes.map(sz => (
                        <span key={sz} className="text-[10px] bg-success/10 text-success px-1.5 py-0.5 rounded font-medium">
                          Grátis {sz}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-1 mt-2">
                    <button onClick={() => openEdit(b)} className="p-1.5 rounded bg-secondary hover:bg-accent transition-colors">
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button onClick={() => setDeleteConfirm(b.id)} className="p-1.5 rounded bg-secondary hover:bg-destructive/10 text-destructive transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'regras' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Free Border Rules */}
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
                <Gift className="w-4 h-4 text-success" /> Borda Grátis por Tamanho
              </h3>
              <p className="text-xs text-muted-foreground mb-4">Defina quais tamanhos de pizza dão borda grátis</p>
              <div className="space-y-2">
                {PIZZA_SIZES.map(s => {
                  const rule = freeBorderRules.find(r => r.size === s.value);
                  const enabled = rule?.enabled ?? false;
                  return (
                    <button
                      key={s.value}
                      onClick={() => toggleFreeBorderRule(s.value)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
                        enabled
                          ? 'bg-success/10 border-success/30 text-success'
                          : 'bg-card border-border text-muted-foreground hover:bg-accent'
                      }`}
                    >
                      <span className="font-semibold text-sm">{s.value} — {s.label}</span>
                      <span className={`text-xs font-bold ${enabled ? 'text-success' : 'text-muted-foreground'}`}>
                        {enabled ? '✓ Borda Grátis' : 'Desativado'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Free Soda Rules */}
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
                🥤 Refrigerante Grátis por Tamanho
              </h3>
              <p className="text-xs text-muted-foreground mb-4">Defina quais tamanhos dão refrigerante 1L grátis</p>
              <div className="space-y-2">
                {PIZZA_SIZES.map(s => {
                  const rule = freeSodaRules.find(r => r.size === s.value);
                  const enabled = rule?.enabled ?? false;
                  return (
                    <button
                      key={s.value}
                      onClick={() => toggleFreeSodaRule(s.value)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
                        enabled
                          ? 'bg-info/10 border-info/30 text-info'
                          : 'bg-card border-border text-muted-foreground hover:bg-accent'
                      }`}
                    >
                      <span className="font-semibold text-sm">{s.value} — {s.label}</span>
                      <span className={`text-xs font-bold ${enabled ? 'text-info' : 'text-muted-foreground'}`}>
                        {enabled ? '✓ Refri 1L Grátis' : 'Desativado'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Border Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-card border-border max-w-md">
            <DialogHeader><DialogTitle>{editing ? 'Editar' : 'Nova'} Borda</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Nome *</label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-secondary border-border" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Preço (R$) *</label>
                <Input type="number" step="0.01" value={form.price || ''} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} className="bg-secondary border-border" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Categoria</label>
                <div className="flex gap-2 mt-1">
                  {BORDER_CATEGORIES.map(c => (
                    <button key={c.value} onClick={() => setForm({ ...form, category: c.value })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${form.category === c.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground'}`}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Grátis para tamanhos</label>
                <div className="flex gap-2 mt-1">
                  {PIZZA_SIZES.map(s => (
                    <button key={s.value} onClick={() => toggleFreeSize(s.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                        form.freeSizes.includes(s.value)
                          ? 'bg-success/10 text-success border-success/30'
                          : 'bg-card border-border text-muted-foreground'
                      }`}>
                      {s.value}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">Ativo</label>
                <button
                  onClick={() => setForm({ ...form, active: !form.active })}
                  className={`w-10 h-5 rounded-full transition-all relative ${form.active ? 'bg-success' : 'bg-muted'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${form.active ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
              <Button onClick={handleSave} className="w-full bg-primary hover:bg-primary/90 font-bold">
                {editing ? 'Salvar' : 'Adicionar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
          <AlertDialogContent className="bg-card border-border max-w-sm">
            <AlertDialogHeader>
              <AlertDialogTitle>Remover borda?</AlertDialogTitle>
              <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>Remover</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PinGuard>
  );
}
