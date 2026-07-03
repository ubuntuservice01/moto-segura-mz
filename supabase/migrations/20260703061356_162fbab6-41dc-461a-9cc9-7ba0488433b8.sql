
CREATE TYPE public.pre_registo_estado AS ENUM ('pendente','aprovado','rejeitado');

CREATE TABLE public.pre_registos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chassi TEXT NOT NULL,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  ano INTEGER,
  cor TEXT,
  proprietario_nome TEXT NOT NULL,
  proprietario_contacto TEXT,
  proprietario_provincia TEXT,
  notas TEXT,
  origem_busca TEXT,
  estado public.pre_registo_estado NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.pre_registos TO service_role;

ALTER TABLE public.pre_registos ENABLE ROW LEVEL SECURITY;

-- No public/anon/authenticated policies: só o service_role (backend) acede.

CREATE TRIGGER pre_registos_set_updated_at
BEFORE UPDATE ON public.pre_registos
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX pre_registos_estado_idx ON public.pre_registos(estado, created_at DESC);
CREATE INDEX pre_registos_chassi_idx ON public.pre_registos(chassi);
