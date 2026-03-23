import { useState } from 'react';
import { PinGuard } from '@/components/PinGuard';
import { useStore } from '@/store/useStore';
import { useAuthStore } from '@/store/authStore';
import { Product, Category, CATEGORIES, PIZZA_TYPES, PizzaSize } from '@/types/pizzaria';
import { formatCurrency } from '@/lib/format';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Lock } from 'lucide-react';

const ICONS = ['🍕','🍔','🥤','🧃','💧','🍟','🧅','🧀','🫙','🍰','🍫','🍌','☕','🥛','🍺','🥩','🌭','🥗','➕','📦'];

const emptyProduct: Omit<Product, 'id'> = {
  name: '', category: 'pizza', icon: '🍕', price: 0, cost: 0, active: true, observations: [],
  pizzaType: 'tradicional', pizzaPrices: { P: 0, M: 0, G: 0, GG: 0 }, pizzaCosts: { P: 0, M: 0, G: 0, GG: 0 },
};

export default function Produtos() {
  const { products, addProduct, updateProduct, deleteProduct } = useStore();
  const { pinUnlocked } = useAuthStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Omit<Product, 'id'>>(emptyProduct);
  const [filterCat, setFilterCat] = useState<Category | 'all'>('all');
  const [obsInput, setObsInput] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = products.filter(p => filterCat === 'all' || p.category === filterCat);
  const isPizza = form.category === 'pizza';

  const openNew = () => { setForm(emptyProduct); setEditing(null); setDialogOpen(true); };
  const openEdit = (p: Product) => { setForm({ ...p }); setEditing(p); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Nome obrigatório'); return; }
    if (editing) { updateProduct({ ...form, id: editing.id } as Product); toast.success('Atualizado'); }
    else { addProduct({ ...form, id: crypto.randomUUID() } as Product); toast.success('Adicionado'); }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => { setDeleteConfirm(id); };
  const confirmDelete = () => { if (deleteConfirm) { deleteProduct(deleteConfirm); toast.success('Removido'); setDeleteConfirm(null); } };
  const addObs = () => { if (!obsInput.trim()) return; setForm({ ...form, observations: [...(form.observations || []), obsInput.trim()] }); setObsInput(''); };

  return (
    <PinGuard title="Produtos">
      <div className="p-4 space-y-4 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Produtos</h1>
            <p className="text-sm text-muted-foreground">Gerencie seus produtos</p>
          </div>
          <Button onClick={openNew} className="bg-primary hover:bg-primary/90 gap-1.5 font-bold">
            <Plus className="w-4 h-4" /> Novo Produto
          </Button>
        </div>

        {/* Category filters */}
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setFilterCat('all')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterCat === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>Todos</button>
          {CATEGORIES.map(c => (
            <button key={c.value} onClick={() => setFilterCat(c.value)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${filterCat === c.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        {/* Products grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(p => (
            <div key={p.id} className="glass-card p-4 flex items-center gap-3 transition-all hover:border-primary/30">
              <span className="text-3xl">{p.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{p.category}{p.pizzaType ? ` · ${p.pizzaType}` : ''}</p>
                {p.category === 'pizza' && p.pizzaPrices ? (
                  <div className="flex gap-2 mt-1">
                    {(['P', 'M', 'G', 'GG'] as PizzaSize[]).map(s => (
                      <span key={s} className="text-[10px] text-muted-foreground">
                        <span className="font-bold text-foreground">{s}</span> {formatCurrency(p.pizzaPrices![s])}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-primary font-bold mt-0.5">{formatCurrency(p.price)}</p>
                )}
                <p className="text-[10px] text-destructive flex items-center gap-1 mt-0.5">
                  <Lock className="w-2.5 h-2.5" />
                  Custo: {p.category === 'pizza' && p.pizzaCosts ? formatCurrency(p.pizzaCosts.G) : formatCurrency(p.cost)}
                </p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(p)} className="p-2 rounded-lg bg-secondary hover:bg-accent transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg bg-secondary hover:bg-destructive/20 text-destructive transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="col-span-full text-muted-foreground text-center py-12">Nenhum produto encontrado</p>}
        </div>

        {/* Product Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-card border-border max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? 'Editar' : 'Novo'} Produto</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Nome *</label>
                <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-secondary border-border" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Categoria *</label>
                <div className="grid grid-cols-3 gap-1 mt-1">
                  {CATEGORIES.map(c => (
                    <button key={c.value} onClick={() => setForm({...form, category: c.value, ...(c.value === 'pizza' ? {pizzaType:'tradicional',pizzaPrices:{P:0,M:0,G:0,GG:0},pizzaCosts:{P:0,M:0,G:0,GG:0}} : {pizzaType:undefined,pizzaPrices:undefined,pizzaCosts:undefined})})}
                      className={`px-2 py-1.5 rounded text-xs font-medium ${form.category === c.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                      {c.icon} {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Ícone</label>
                <div className="flex gap-1 flex-wrap mt-1">
                  {ICONS.map(icon => (
                    <button key={icon} onClick={() => setForm({...form,icon})} className={`w-8 h-8 rounded flex items-center justify-center text-lg ${form.icon === icon ? 'bg-primary' : 'bg-secondary hover:bg-accent'}`}>{icon}</button>
                  ))}
                </div>
              </div>
              {isPizza && (<>
                <div>
                  <label className="text-xs text-muted-foreground">Tipo</label>
                  <div className="grid grid-cols-4 gap-1 mt-1">
                    {PIZZA_TYPES.map(t => (
                      <button key={t.value} onClick={() => setForm({...form,pizzaType:t.value})} className={`px-2 py-1 rounded text-[10px] font-medium ${form.pizzaType === t.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>{t.label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Preços *</label>
                  <div className="grid grid-cols-4 gap-2 mt-1">
                    {(['P','M','G','GG'] as PizzaSize[]).map(s => (
                      <div key={s}><span className="text-[10px] text-muted-foreground">{s}</span>
                        <Input type="number" step="0.01" value={form.pizzaPrices?.[s]||''} onChange={e => setForm({...form,pizzaPrices:{...form.pizzaPrices!,[s]:parseFloat(e.target.value)||0}})} className="bg-secondary border-border h-8 text-xs" />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground flex items-center gap-1"><Lock className="w-3 h-3"/>Custos</label>
                  <div className="grid grid-cols-4 gap-2 mt-1">
                    {(['P','M','G','GG'] as PizzaSize[]).map(s => (
                      <div key={s}><span className="text-[10px] text-muted-foreground">{s}</span>
                        <Input type="number" step="0.01" value={form.pizzaCosts?.[s]||''} onChange={e => setForm({...form,pizzaCosts:{...form.pizzaCosts!,[s]:parseFloat(e.target.value)||0}})} className="bg-secondary border-border h-8 text-xs" />
                      </div>
                    ))}
                  </div>
                </div>
              </>)}
              {!isPizza && (<>
                <div><label className="text-xs text-muted-foreground">Preço *</label><Input type="number" step="0.01" value={form.price||''} onChange={e => setForm({...form,price:parseFloat(e.target.value)||0})} className="bg-secondary border-border" /></div>
                <div><label className="text-xs text-muted-foreground flex items-center gap-1"><Lock className="w-3 h-3"/>Custo</label><Input type="number" step="0.01" value={form.cost||''} onChange={e => setForm({...form,cost:parseFloat(e.target.value)||0})} className="bg-secondary border-border" /></div>
              </>)}
              <div>
                <label className="text-xs text-muted-foreground">Observações</label>
                {(form.observations||[]).map((obs,i) => (
                  <div key={i} className="flex items-center gap-1 text-xs mt-1">
                    <span className="flex-1 bg-secondary px-2 py-1 rounded">{obs}</span>
                    <button onClick={() => setForm({...form,observations:form.observations?.filter((_,j)=>j!==i)})} className="text-destructive"><Trash2 className="w-3 h-3"/></button>
                  </div>
                ))}
                <div className="flex gap-1 mt-1">
                  <Input value={obsInput} onChange={e => setObsInput(e.target.value)} placeholder="Observação..." className="bg-secondary border-border h-8 text-xs" onKeyDown={e => e.key==='Enter' && addObs()} />
                  <Button size="sm" onClick={addObs} className="h-8">+</Button>
                </div>
              </div>
              <Button onClick={handleSave} className="w-full bg-primary hover:bg-primary/90 font-bold">{editing ? 'Salvar' : 'Adicionar'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PinGuard>
  );
}
