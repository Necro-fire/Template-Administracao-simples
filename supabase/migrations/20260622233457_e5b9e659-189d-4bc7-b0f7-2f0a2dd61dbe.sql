-- Drop global unique on code, add composite unique per register so codes can restart per cash register
ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_code_key;
ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_code_unique;
CREATE UNIQUE INDEX IF NOT EXISTS sales_register_code_unique ON public.sales (register_id, code) WHERE register_id IS NOT NULL;

-- Function to reset the sale code counter (called when opening a register)
CREATE OR REPLACE FUNCTION public.reset_sale_code_counter()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO app_settings (key, value)
  VALUES ('next_sale_code', '0'::jsonb)
  ON CONFLICT (key) DO UPDATE SET value = '0'::jsonb;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reset_sale_code_counter() TO authenticated, anon, service_role;