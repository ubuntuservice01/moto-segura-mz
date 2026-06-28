
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TYPE moto_estado AS ENUM ('activa', 'a_venda', 'roubada', 'transferida');
CREATE TYPE historico_tipo AS ENUM ('registo', 'transferencia', 'actualizacao', 'mudanca_estado');

CREATE TABLE public.motos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chassi TEXT NOT NULL UNIQUE,
  matricula TEXT,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  ano INTEGER,
  cilindrada INTEGER,
  cor TEXT,
  km INTEGER DEFAULT 0,
  proprietario_nome TEXT NOT NULL,
  proprietario_bi TEXT,
  proprietario_contacto TEXT,
  proprietario_localidade TEXT,
  proprietario_provincia TEXT,
  estado moto_estado NOT NULL DEFAULT 'activa',
  preco_venda NUMERIC(12,2),
  notas_internas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_motos_chassi_trgm ON public.motos USING gin (chassi gin_trgm_ops);
CREATE INDEX idx_motos_estado ON public.motos(estado);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.motos TO anon, authenticated;
GRANT ALL ON public.motos TO service_role;
ALTER TABLE public.motos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read motos" ON public.motos FOR SELECT USING (true);
CREATE POLICY "Public insert motos" ON public.motos FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update motos" ON public.motos FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete motos" ON public.motos FOR DELETE USING (true);

CREATE TABLE public.historico_motos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moto_id UUID NOT NULL REFERENCES public.motos(id) ON DELETE CASCADE,
  tipo_evento historico_tipo NOT NULL,
  descricao TEXT NOT NULL,
  diff JSONB,
  operador TEXT NOT NULL DEFAULT 'Ubuntu Link',
  motivo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_historico_moto ON public.historico_motos(moto_id, created_at DESC);
CREATE INDEX idx_historico_tipo ON public.historico_motos(tipo_evento, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.historico_motos TO anon, authenticated;
GRANT ALL ON public.historico_motos TO service_role;
ALTER TABLE public.historico_motos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read historico" ON public.historico_motos FOR SELECT USING (true);
CREATE POLICY "Public insert historico" ON public.historico_motos FOR INSERT WITH CHECK (true);

CREATE TABLE public.transferencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moto_id UUID NOT NULL REFERENCES public.motos(id) ON DELETE CASCADE,
  proprietario_anterior JSONB NOT NULL,
  proprietario_novo JSONB NOT NULL,
  valor_transaccao NUMERIC(12,2),
  motivo TEXT,
  operador TEXT NOT NULL DEFAULT 'Ubuntu Link',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_transferencias_moto ON public.transferencias(moto_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.transferencias TO anon, authenticated;
GRANT ALL ON public.transferencias TO service_role;
ALTER TABLE public.transferencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read transferencias" ON public.transferencias FOR SELECT USING (true);
CREATE POLICY "Public insert transferencias" ON public.transferencias FOR INSERT WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_motos_updated_at BEFORE UPDATE ON public.motos
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.log_moto_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.historico_motos (moto_id, tipo_evento, descricao, diff)
  VALUES (NEW.id, 'registo',
    'Mota registada: ' || NEW.marca || ' ' || NEW.modelo || ' (' || NEW.chassi || ')',
    jsonb_build_object('chassi', NEW.chassi, 'marca', NEW.marca, 'modelo', NEW.modelo,
      'proprietario', NEW.proprietario_nome, 'estado', NEW.estado));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_motos_log_insert AFTER INSERT ON public.motos
FOR EACH ROW EXECUTE FUNCTION public.log_moto_insert();

CREATE OR REPLACE FUNCTION public.log_moto_update()
RETURNS TRIGGER AS $$
DECLARE
  diff_json JSONB := '{}'::jsonb;
  campos TEXT[] := ARRAY[]::TEXT[];
  evento historico_tipo := 'actualizacao';
  desc_text TEXT;
BEGIN
  IF NEW.chassi IS DISTINCT FROM OLD.chassi THEN diff_json := diff_json || jsonb_build_object('chassi', jsonb_build_object('antes', OLD.chassi, 'depois', NEW.chassi)); campos := array_append(campos, 'chassi'); END IF;
  IF NEW.matricula IS DISTINCT FROM OLD.matricula THEN diff_json := diff_json || jsonb_build_object('matricula', jsonb_build_object('antes', OLD.matricula, 'depois', NEW.matricula)); campos := array_append(campos, 'matricula'); END IF;
  IF NEW.marca IS DISTINCT FROM OLD.marca THEN diff_json := diff_json || jsonb_build_object('marca', jsonb_build_object('antes', OLD.marca, 'depois', NEW.marca)); campos := array_append(campos, 'marca'); END IF;
  IF NEW.modelo IS DISTINCT FROM OLD.modelo THEN diff_json := diff_json || jsonb_build_object('modelo', jsonb_build_object('antes', OLD.modelo, 'depois', NEW.modelo)); campos := array_append(campos, 'modelo'); END IF;
  IF NEW.ano IS DISTINCT FROM OLD.ano THEN diff_json := diff_json || jsonb_build_object('ano', jsonb_build_object('antes', OLD.ano, 'depois', NEW.ano)); campos := array_append(campos, 'ano'); END IF;
  IF NEW.cilindrada IS DISTINCT FROM OLD.cilindrada THEN diff_json := diff_json || jsonb_build_object('cilindrada', jsonb_build_object('antes', OLD.cilindrada, 'depois', NEW.cilindrada)); campos := array_append(campos, 'cilindrada'); END IF;
  IF NEW.cor IS DISTINCT FROM OLD.cor THEN diff_json := diff_json || jsonb_build_object('cor', jsonb_build_object('antes', OLD.cor, 'depois', NEW.cor)); campos := array_append(campos, 'cor'); END IF;
  IF NEW.km IS DISTINCT FROM OLD.km THEN diff_json := diff_json || jsonb_build_object('km', jsonb_build_object('antes', OLD.km, 'depois', NEW.km)); campos := array_append(campos, 'km'); END IF;
  IF NEW.proprietario_nome IS DISTINCT FROM OLD.proprietario_nome THEN diff_json := diff_json || jsonb_build_object('proprietario_nome', jsonb_build_object('antes', OLD.proprietario_nome, 'depois', NEW.proprietario_nome)); campos := array_append(campos, 'proprietario_nome'); END IF;
  IF NEW.proprietario_contacto IS DISTINCT FROM OLD.proprietario_contacto THEN diff_json := diff_json || jsonb_build_object('proprietario_contacto', jsonb_build_object('antes', OLD.proprietario_contacto, 'depois', NEW.proprietario_contacto)); campos := array_append(campos, 'proprietario_contacto'); END IF;
  IF NEW.proprietario_localidade IS DISTINCT FROM OLD.proprietario_localidade THEN diff_json := diff_json || jsonb_build_object('proprietario_localidade', jsonb_build_object('antes', OLD.proprietario_localidade, 'depois', NEW.proprietario_localidade)); campos := array_append(campos, 'proprietario_localidade'); END IF;
  IF NEW.proprietario_provincia IS DISTINCT FROM OLD.proprietario_provincia THEN diff_json := diff_json || jsonb_build_object('proprietario_provincia', jsonb_build_object('antes', OLD.proprietario_provincia, 'depois', NEW.proprietario_provincia)); campos := array_append(campos, 'proprietario_provincia'); END IF;
  IF NEW.preco_venda IS DISTINCT FROM OLD.preco_venda THEN diff_json := diff_json || jsonb_build_object('preco_venda', jsonb_build_object('antes', OLD.preco_venda, 'depois', NEW.preco_venda)); campos := array_append(campos, 'preco_venda'); END IF;
  IF NEW.estado IS DISTINCT FROM OLD.estado THEN
    diff_json := diff_json || jsonb_build_object('estado', jsonb_build_object('antes', OLD.estado, 'depois', NEW.estado));
    campos := array_append(campos, 'estado'); evento := 'mudanca_estado';
  END IF;

  IF array_length(campos, 1) IS NULL THEN RETURN NEW; END IF;

  IF evento = 'mudanca_estado' THEN
    desc_text := 'Estado alterado: ' || OLD.estado || ' → ' || NEW.estado;
  ELSE
    desc_text := 'Actualização: ' || array_to_string(campos, ', ');
  END IF;

  INSERT INTO public.historico_motos (moto_id, tipo_evento, descricao, diff)
  VALUES (NEW.id, evento, desc_text, diff_json);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_motos_log_update AFTER UPDATE ON public.motos
FOR EACH ROW EXECUTE FUNCTION public.log_moto_update();
