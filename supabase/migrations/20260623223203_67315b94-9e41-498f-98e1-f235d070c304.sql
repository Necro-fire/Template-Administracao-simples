CREATE OR REPLACE FUNCTION public.generate_sale_code(_register_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_max integer;
BEGIN
  IF _register_id IS NULL THEN
    RAISE EXCEPTION 'register_id is required to generate sale code';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(_register_id::text, 0));

  SELECT COALESCE(MAX(NULLIF(regexp_replace(code, '\D', '', 'g'), '')::integer), 0)
    INTO current_max
  FROM public.sales
  WHERE register_id = _register_id
    AND code ~ '^\d+$';

  RETURN lpad((current_max + 1)::text, 6, '0');
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_sale_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RAISE EXCEPTION 'register_id is required to generate sale code';
END;
$function$;

CREATE OR REPLACE FUNCTION public.reset_sale_code_counter()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Legacy compatibility: sale codes are now generated per cash register.
  RETURN;
END;
$function$;

CREATE INDEX IF NOT EXISTS idx_products_name ON public.products (name);
CREATE INDEX IF NOT EXISTS idx_borders_name ON public.borders (name);
CREATE INDEX IF NOT EXISTS idx_soda_products_name ON public.soda_products (name);
CREATE INDEX IF NOT EXISTS idx_sales_register_created_at ON public.sales (register_id, created_at);
CREATE INDEX IF NOT EXISTS idx_cash_movements_register_created_at ON public.cash_movements (register_id, created_at);