-- 1. Add last_sale_code to cash_registers to maintain per-register sequence
ALTER TABLE public.cash_registers ADD COLUMN IF NOT EXISTS last_sale_code INTEGER DEFAULT 0;

-- 2. Update generate_sale_code to be register-aware and use the new column
CREATE OR REPLACE FUNCTION public.generate_sale_code(p_register_id UUID)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_val integer;
  new_code text;
BEGIN
  -- If no register_id is provided, fall back to global (for safety/backward compat)
  IF p_register_id IS NULL THEN
    UPDATE app_settings
    SET value = (COALESCE((value)::integer, 0) + 1)::text::jsonb
    WHERE key = 'next_sale_code'
    RETURNING (value)::integer INTO current_val;
  ELSE
    -- Increment and get the next code for this specific register
    UPDATE cash_registers
    SET last_sale_code = COALESCE(last_sale_code, 0) + 1
    WHERE id = p_register_id
    RETURNING last_sale_code INTO current_val;
  END IF;

  IF current_val IS NULL THEN
    -- Fallback for global if not exists
    IF p_register_id IS NULL THEN
        INSERT INTO app_settings (key, value) VALUES ('next_sale_code', '1'::jsonb)
        ON CONFLICT (key) DO UPDATE SET value = (COALESCE((app_settings.value)::integer, 0) + 1)::text::jsonb
        RETURNING (value)::integer INTO current_val;
    ELSE
        -- Should not happen if p_register_id is valid
        RAISE EXCEPTION 'Register not found';
    END IF;
  END IF;

  new_code := lpad(current_val::text, 6, '0');
  RETURN new_code;
END;
$$;

-- 3. We no longer need reset_sale_code_counter as it's handled per-register now
DROP FUNCTION IF EXISTS public.reset_sale_code_counter();

-- 4. Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_sales_register_created_at ON public.sales (register_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON public.sale_items ((product_data->>'id'));
