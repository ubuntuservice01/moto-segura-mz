
ALTER TABLE public.motos
  ADD COLUMN IF NOT EXISTS proprietario_distrito text,
  ADD COLUMN IF NOT EXISTS proprietario_posto_admin text;
