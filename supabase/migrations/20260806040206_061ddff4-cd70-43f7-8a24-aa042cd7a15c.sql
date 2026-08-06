ALTER TYPE public.moto_estado ADD VALUE IF NOT EXISTS 'recuperada';
ALTER TYPE public.moto_estado ADD VALUE IF NOT EXISTS 'vendida';
ALTER TYPE public.moto_estado ADD VALUE IF NOT EXISTS 'abatida';
ALTER TYPE public.historico_tipo ADD VALUE IF NOT EXISTS 'reporte_roubo';
ALTER TYPE public.historico_tipo ADD VALUE IF NOT EXISTS 'avistamento';

ALTER TABLE public.motos
  ADD COLUMN IF NOT EXISTS numero_motor text,
  ADD COLUMN IF NOT EXISTS proprietario_data_nascimento date,
  ADD COLUMN IF NOT EXISTS proprietario_contacto_alt text,
  ADD COLUMN IF NOT EXISTS proprietario_familiar_nome text,
  ADD COLUMN IF NOT EXISTS proprietario_familiar_contacto text,
  ADD COLUMN IF NOT EXISTS proprietario_endereco text,
  ADD COLUMN IF NOT EXISTS data_compra date,
  ADD COLUMN IF NOT EXISTS local_compra text,
  ADD COLUMN IF NOT EXISTS foto_path text,
  ADD COLUMN IF NOT EXISTS codigo_recuperacao_hash text,
  ADD COLUMN IF NOT EXISTS codigo_recuperacao_prefixo text,
  ADD COLUMN IF NOT EXISTS data_reporte_roubo timestamptz;

CREATE TABLE IF NOT EXISTS public.reportes_roubo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  moto_id uuid REFERENCES public.motos(id) ON DELETE SET NULL,
  identificador text NOT NULL,
  sucesso boolean NOT NULL DEFAULT false,
  motivo_falha text,
  ip text,
  user_agent text,
  gps_lat double precision,
  gps_lng double precision,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.reportes_roubo TO service_role;
ALTER TABLE public.reportes_roubo ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.avistamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  moto_id uuid NOT NULL REFERENCES public.motos(id) ON DELETE CASCADE,
  foto_path text,
  gps_lat double precision,
  gps_lng double precision,
  observacoes text,
  contacto_informante text,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.avistamentos TO service_role;
ALTER TABLE public.avistamentos ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.notificacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL,
  canal text NOT NULL DEFAULT 'painel',
  titulo text NOT NULL,
  mensagem text NOT NULL,
  moto_id uuid REFERENCES public.motos(id) ON DELETE CASCADE,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  lida boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.notificacoes TO service_role;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_reportes_roubo_moto ON public.reportes_roubo(moto_id);
CREATE INDEX IF NOT EXISTS idx_avistamentos_moto ON public.avistamentos(moto_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON public.notificacoes(lida, created_at DESC);