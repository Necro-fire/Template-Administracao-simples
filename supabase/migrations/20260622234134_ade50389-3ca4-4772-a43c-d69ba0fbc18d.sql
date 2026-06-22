CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON public.sale_items (sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_register_id ON public.sales (register_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at_desc ON public.sales (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cash_movements_register_id ON public.cash_movements (register_id);
CREATE INDEX IF NOT EXISTS idx_cash_movements_register_type ON public.cash_movements (register_id, type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_desc ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cash_registers_closed_at ON public.cash_registers (closed_at);