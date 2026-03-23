import { useState } from 'react';
import { startOfDay, startOfWeek, startOfMonth, startOfYear, isWithinInterval, endOfDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type DatePreset = 'today' | '7days' | 'month' | 'year' | 'custom';

interface DateFilterProps {
  onFilter: (start: Date, end: Date) => void;
}

export function DateFilter({ onFilter }: DateFilterProps) {
  const [preset, setPreset] = useState<DatePreset>('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const apply = (p: DatePreset) => {
    setPreset(p);
    const now = new Date();
    let start: Date;
    switch (p) {
      case 'today': start = startOfDay(now); break;
      case '7days': start = startOfWeek(now); start.setDate(now.getDate() - 7); break;
      case 'month': start = startOfMonth(now); break;
      case 'year': start = startOfYear(now); break;
      case 'custom': return;
      default: start = startOfDay(now);
    }
    onFilter(start, endOfDay(now));
  };

  const applyCustom = () => {
    if (customStart && customEnd) {
      onFilter(new Date(customStart), endOfDay(new Date(customEnd)));
    }
  };

  const presets: { value: DatePreset; label: string }[] = [
    { value: 'today', label: 'Hoje' },
    { value: '7days', label: '7 Dias' },
    { value: 'month', label: 'Mês' },
    { value: 'year', label: 'Ano' },
    { value: 'custom', label: 'Personalizado' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map((p) => (
        <Button
          key={p.value}
          size="sm"
          variant={preset === p.value ? 'default' : 'outline'}
          onClick={() => apply(p.value)}
          className={`text-xs ${preset === p.value ? 'bg-primary text-primary-foreground' : ''}`}
        >
          {p.label}
        </Button>
      ))}
      {preset === 'custom' && (
        <div className="flex items-center gap-2">
          <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="bg-secondary border-border h-8 text-xs w-36" />
          <span className="text-muted-foreground text-xs">até</span>
          <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="bg-secondary border-border h-8 text-xs w-36" />
          <Button size="sm" onClick={applyCustom} className="bg-primary text-primary-foreground text-xs">Filtrar</Button>
        </div>
      )}
    </div>
  );
}

export function filterByDate<T extends { date: string }>(items: T[], start: Date, end: Date): T[] {
  return items.filter((item) => {
    const d = new Date(item.date);
    return isWithinInterval(d, { start, end });
  });
}
