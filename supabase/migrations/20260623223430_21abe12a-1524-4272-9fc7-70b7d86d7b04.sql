ALTER TABLE public.cash_registers
  ADD COLUMN IF NOT EXISTS last_sale_code integer NOT NULL DEFAULT 0;

WITH max_codes AS (
  SELECT
    register_id,
    COALESCE(MAX(NULLIF(regexp_replace(code, '\D', '', 'g'), '')::integer), 0) AS max_code
  FROM public.sales
  WHERE register_id IS NOT NULL
    AND code ~ '^\d+$'
  GROUP BY register_id
)
UPDATE public.cash_registers cr
SET last_sale_code = GREATEST(cr.last_sale_code, max_codes.max_code)
FROM max_codes
WHERE cr.id = max_codes.register_id;

CREATE OR REPLACE FUNCTION public.generate_sale_code(_register_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_val integer;
BEGIN
  IF _register_id IS NULL THEN
    RAISE EXCEPTION 'register_id is required to generate sale code';
  END IF;

  UPDATE public.cash_registers
  SET last_sale_code = COALESCE(last_sale_code, 0) + 1
  WHERE id = _register_id
    AND closed_at IS NULL
  RETURNING last_sale_code INTO current_val;

  IF current_val IS NULL THEN
    RAISE EXCEPTION 'open cash register not found';
  END IF;

  RETURN lpad(current_val::text, 6, '0');
END;
$function$;

GRANT EXECUTE ON FUNCTION public.generate_sale_code(uuid) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.generate_sale_code() TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.reset_sale_code_counter() TO authenticated, anon, service_role;

CREATE INDEX IF NOT EXISTS idx_cash_registers_closed_opened ON public.cash_registers (closed_at, opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_register_code ON public.sales (register_id, code);