-- ============ ENUMS ============
CREATE TYPE public.app_papel AS ENUM ('super_admin','admin_municipal','tecnico_municipal','policia');
CREATE TYPE public.municipio_estado AS ENUM ('activo','suspenso');

-- ============ MUNICIPIOS ============
CREATE TABLE public.municipios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  slug text NOT NULL UNIQUE,
  provincia text NOT NULL,
  distrito text,
  endereco text,
  contacto text,
  contacto_alt text,
  email text,
  website text,
  logo_url text,
  brasao_url text,
  favicon_url text,
  cor_principal text NOT NULL DEFAULT '#006633',
  cor_secundaria text NOT NULL DEFAULT '#FAF92A',
  nome_plataforma text,
  estado public.municipio_estado NOT NULL DEFAULT 'activo',
  licenca_plano text NOT NULL DEFAULT 'base',
  licenca_validade date,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.municipios TO authenticated;
GRANT ALL ON public.municipios TO service_role;
ALTER TABLE public.municipios ENABLE ROW LEVEL SECURITY;

-- ============ PERFIS ============
CREATE TABLE public.perfis (
  id uuid PRIMARY KEY,
  municipio_id uuid REFERENCES public.municipios(id) ON DELETE SET NULL,
  esquadra_id uuid,
  nome text NOT NULL DEFAULT '',
  email text,
  telefone text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.perfis TO authenticated;
GRANT ALL ON public.perfis TO service_role;
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

-- ============ PAPEIS ============
CREATE TABLE public.utilizador_papeis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  papel public.app_papel NOT NULL,
  municipio_id uuid REFERENCES public.municipios(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, papel)
);
GRANT SELECT ON public.utilizador_papeis TO authenticated;
GRANT ALL ON public.utilizador_papeis TO service_role;
ALTER TABLE public.utilizador_papeis ENABLE ROW LEVEL SECURITY;

-- ============ ESQUADRAS ============
CREATE TABLE public.esquadras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  municipio_id uuid NOT NULL REFERENCES public.municipios(id) ON DELETE CASCADE,
  nome text NOT NULL,
  endereco text,
  contacto text,
  responsavel text,
  activa boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.esquadras TO authenticated;
GRANT ALL ON public.esquadras TO service_role;
ALTER TABLE public.esquadras ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.perfis
  ADD CONSTRAINT perfis_esquadra_id_fkey FOREIGN KEY (esquadra_id)
  REFERENCES public.esquadras(id) ON DELETE SET NULL;

-- ============ MODULOS ============
CREATE TABLE public.modulos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chave text NOT NULL UNIQUE,
  nome text NOT NULL,
  descricao text,
  icone text,
  rota text,
  disponivel boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.modulos TO authenticated;
GRANT ALL ON public.modulos TO service_role;
ALTER TABLE public.modulos ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.municipio_modulos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  municipio_id uuid NOT NULL REFERENCES public.municipios(id) ON DELETE CASCADE,
  modulo_id uuid NOT NULL REFERENCES public.modulos(id) ON DELETE CASCADE,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (municipio_id, modulo_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.municipio_modulos TO authenticated;
GRANT ALL ON public.municipio_modulos TO service_role;
ALTER TABLE public.municipio_modulos ENABLE ROW LEVEL SECURITY;

-- ============ FUNCOES DE SEGURANCA ============
CREATE OR REPLACE FUNCTION public.tem_papel(_user_id uuid, _papel public.app_papel)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.utilizador_papeis WHERE user_id = _user_id AND papel = _papel)
$$;

CREATE OR REPLACE FUNCTION public.e_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.utilizador_papeis WHERE user_id = _user_id AND papel = 'super_admin')
$$;

CREATE OR REPLACE FUNCTION public.meu_municipio(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT municipio_id FROM public.perfis WHERE id = _user_id
$$;

-- ============ TENANT NAS TABELAS EXISTENTES ============
ALTER TABLE public.motos ADD COLUMN municipio_id uuid REFERENCES public.municipios(id) ON DELETE RESTRICT;
ALTER TABLE public.historico_motos ADD COLUMN municipio_id uuid REFERENCES public.municipios(id) ON DELETE CASCADE;
ALTER TABLE public.transferencias ADD COLUMN municipio_id uuid REFERENCES public.municipios(id) ON DELETE CASCADE;
ALTER TABLE public.pre_registos ADD COLUMN municipio_id uuid REFERENCES public.municipios(id) ON DELETE CASCADE;
ALTER TABLE public.avistamentos ADD COLUMN municipio_id uuid REFERENCES public.municipios(id) ON DELETE CASCADE;
ALTER TABLE public.reportes_roubo ADD COLUMN municipio_id uuid REFERENCES public.municipios(id) ON DELETE CASCADE;
ALTER TABLE public.notificacoes ADD COLUMN municipio_id uuid REFERENCES public.municipios(id) ON DELETE CASCADE;

-- Municipio inicial + backfill
INSERT INTO public.municipios (nome, slug, provincia, distrito, nome_plataforma, email)
VALUES ('Município de Lichinga', 'lichinga', 'Niassa', 'Lichinga', 'MotoGest Município de Lichinga', 'geral@lichinga.gov.mz');

UPDATE public.motos SET municipio_id = (SELECT id FROM public.municipios WHERE slug='lichinga') WHERE municipio_id IS NULL;
UPDATE public.historico_motos SET municipio_id = (SELECT id FROM public.municipios WHERE slug='lichinga') WHERE municipio_id IS NULL;
UPDATE public.transferencias SET municipio_id = (SELECT id FROM public.municipios WHERE slug='lichinga') WHERE municipio_id IS NULL;
UPDATE public.pre_registos SET municipio_id = (SELECT id FROM public.municipios WHERE slug='lichinga') WHERE municipio_id IS NULL;
UPDATE public.avistamentos SET municipio_id = (SELECT id FROM public.municipios WHERE slug='lichinga') WHERE municipio_id IS NULL;
UPDATE public.reportes_roubo SET municipio_id = (SELECT id FROM public.municipios WHERE slug='lichinga') WHERE municipio_id IS NULL;
UPDATE public.notificacoes SET municipio_id = (SELECT id FROM public.municipios WHERE slug='lichinga') WHERE municipio_id IS NULL;

ALTER TABLE public.motos ALTER COLUMN municipio_id SET NOT NULL;
ALTER TABLE public.historico_motos ALTER COLUMN municipio_id SET NOT NULL;
ALTER TABLE public.transferencias ALTER COLUMN municipio_id SET NOT NULL;
ALTER TABLE public.pre_registos ALTER COLUMN municipio_id SET NOT NULL;

CREATE INDEX idx_motos_municipio ON public.motos(municipio_id);
CREATE INDEX idx_historico_municipio ON public.historico_motos(municipio_id);
CREATE INDEX idx_transferencias_municipio ON public.transferencias(municipio_id);
CREATE INDEX idx_pre_registos_municipio ON public.pre_registos(municipio_id);
CREATE INDEX idx_notificacoes_municipio ON public.notificacoes(municipio_id);
CREATE INDEX idx_avistamentos_municipio ON public.avistamentos(municipio_id);
CREATE INDEX idx_reportes_municipio ON public.reportes_roubo(municipio_id);
CREATE INDEX idx_motos_numero_motor ON public.motos(numero_motor);

-- triggers herdam municipio_id da mota
CREATE OR REPLACE FUNCTION public.log_moto_insert()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $function$
BEGIN
  INSERT INTO public.historico_motos (moto_id, municipio_id, tipo_evento, descricao, diff)
  VALUES (NEW.id, NEW.municipio_id, 'registo',
    'Mota registada: ' || NEW.marca || ' ' || NEW.modelo || ' (' || NEW.chassi || ')',
    jsonb_build_object('chassi', NEW.chassi, 'marca', NEW.marca, 'modelo', NEW.modelo,
      'proprietario', NEW.proprietario_nome, 'estado', NEW.estado));
  RETURN NEW;
END;
$function$;

-- ============ RLS ============
-- municipios
CREATE POLICY "municipios_select" ON public.municipios FOR SELECT TO authenticated
  USING (public.e_super_admin(auth.uid()) OR id = public.meu_municipio(auth.uid()));
CREATE POLICY "municipios_super_all" ON public.municipios FOR ALL TO authenticated
  USING (public.e_super_admin(auth.uid())) WITH CHECK (public.e_super_admin(auth.uid()));
CREATE POLICY "municipios_admin_update" ON public.municipios FOR UPDATE TO authenticated
  USING (public.tem_papel(auth.uid(),'admin_municipal') AND id = public.meu_municipio(auth.uid()))
  WITH CHECK (id = public.meu_municipio(auth.uid()));

-- perfis
CREATE POLICY "perfis_select" ON public.perfis FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.e_super_admin(auth.uid()) OR municipio_id = public.meu_municipio(auth.uid()));
CREATE POLICY "perfis_update_own" ON public.perfis FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "perfis_super_all" ON public.perfis FOR ALL TO authenticated
  USING (public.e_super_admin(auth.uid())) WITH CHECK (public.e_super_admin(auth.uid()));

-- papeis
CREATE POLICY "papeis_select" ON public.utilizador_papeis FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.e_super_admin(auth.uid()) OR municipio_id = public.meu_municipio(auth.uid()));

-- esquadras
CREATE POLICY "esquadras_select" ON public.esquadras FOR SELECT TO authenticated
  USING (public.e_super_admin(auth.uid()) OR municipio_id = public.meu_municipio(auth.uid()));
CREATE POLICY "esquadras_admin_write" ON public.esquadras FOR ALL TO authenticated
  USING (public.e_super_admin(auth.uid()) OR (public.tem_papel(auth.uid(),'admin_municipal') AND municipio_id = public.meu_municipio(auth.uid())))
  WITH CHECK (public.e_super_admin(auth.uid()) OR (public.tem_papel(auth.uid(),'admin_municipal') AND municipio_id = public.meu_municipio(auth.uid())));

-- modulos
CREATE POLICY "modulos_select" ON public.modulos FOR SELECT TO authenticated USING (true);
CREATE POLICY "modulos_super_all" ON public.modulos FOR ALL TO authenticated
  USING (public.e_super_admin(auth.uid())) WITH CHECK (public.e_super_admin(auth.uid()));
CREATE POLICY "municipio_modulos_select" ON public.municipio_modulos FOR SELECT TO authenticated
  USING (public.e_super_admin(auth.uid()) OR municipio_id = public.meu_municipio(auth.uid()));
CREATE POLICY "municipio_modulos_super_all" ON public.municipio_modulos FOR ALL TO authenticated
  USING (public.e_super_admin(auth.uid())) WITH CHECK (public.e_super_admin(auth.uid()));

-- dados operacionais: leitura pelo municipio do utilizador
CREATE POLICY "motos_tenant_select" ON public.motos FOR SELECT TO authenticated
  USING (public.e_super_admin(auth.uid()) OR municipio_id = public.meu_municipio(auth.uid()));
CREATE POLICY "motos_tenant_write" ON public.motos FOR ALL TO authenticated
  USING (public.e_super_admin(auth.uid()) OR (municipio_id = public.meu_municipio(auth.uid())
    AND (public.tem_papel(auth.uid(),'admin_municipal') OR public.tem_papel(auth.uid(),'tecnico_municipal'))))
  WITH CHECK (public.e_super_admin(auth.uid()) OR (municipio_id = public.meu_municipio(auth.uid())
    AND (public.tem_papel(auth.uid(),'admin_municipal') OR public.tem_papel(auth.uid(),'tecnico_municipal'))));

CREATE POLICY "historico_tenant_select" ON public.historico_motos FOR SELECT TO authenticated
  USING (public.e_super_admin(auth.uid()) OR municipio_id = public.meu_municipio(auth.uid()));
CREATE POLICY "transferencias_tenant_select" ON public.transferencias FOR SELECT TO authenticated
  USING (public.e_super_admin(auth.uid()) OR municipio_id = public.meu_municipio(auth.uid()));
CREATE POLICY "pre_registos_tenant_select" ON public.pre_registos FOR SELECT TO authenticated
  USING (public.e_super_admin(auth.uid()) OR municipio_id = public.meu_municipio(auth.uid()));
CREATE POLICY "avistamentos_tenant_select" ON public.avistamentos FOR SELECT TO authenticated
  USING (public.e_super_admin(auth.uid()) OR municipio_id = public.meu_municipio(auth.uid()));
CREATE POLICY "reportes_tenant_select" ON public.reportes_roubo FOR SELECT TO authenticated
  USING (public.e_super_admin(auth.uid()) OR municipio_id = public.meu_municipio(auth.uid()));
CREATE POLICY "notificacoes_tenant_select" ON public.notificacoes FOR SELECT TO authenticated
  USING (public.e_super_admin(auth.uid()) OR municipio_id = public.meu_municipio(auth.uid()));

GRANT SELECT ON public.motos TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.motos TO authenticated;
GRANT SELECT ON public.historico_motos TO authenticated;
GRANT SELECT ON public.transferencias TO authenticated;
GRANT SELECT ON public.pre_registos TO authenticated;
GRANT SELECT ON public.avistamentos TO authenticated;
GRANT SELECT ON public.reportes_roubo TO authenticated;
GRANT SELECT ON public.notificacoes TO authenticated;

CREATE TRIGGER municipios_set_updated_at BEFORE UPDATE ON public.municipios FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER perfis_set_updated_at BEFORE UPDATE ON public.perfis FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER esquadras_set_updated_at BEFORE UPDATE ON public.esquadras FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- modulos base
INSERT INTO public.modulos (chave, nome, descricao, icone, rota, ordem) VALUES
  ('motorizadas','Gestão de Motorizadas','Registo, transferências e segurança de motorizadas','Bike','/gestao',1),
  ('bicicletas','Gestão de Bicicletas','Registo municipal de bicicletas','Bike',NULL,2),
  ('taxis','Gestão de Táxis','Licenciamento e gestão de táxis','Car',NULL,3),
  ('transporte_escolar','Transporte Escolar','Gestão de transporte escolar','Bus',NULL,4),
  ('viaturas_municipais','Viaturas Municipais','Frota municipal','Truck',NULL,5),
  ('maquinas','Máquinas Municipais','Máquinas e equipamentos','Wrench',NULL,6),
  ('estacionamentos','Estacionamentos','Gestão de estacionamentos','SquareParking',NULL,7),
  ('reboques','Reboques','Gestão de reboques','Truck',NULL,8),
  ('policia','Integração com a Polícia','Acesso e operações policiais','Shield',NULL,9),
  ('seguradoras','Integração com Seguradoras','Partilha com seguradoras','FileCheck',NULL,10);

INSERT INTO public.municipio_modulos (municipio_id, modulo_id, activo)
SELECT m.id, mo.id, mo.chave = 'motorizadas' FROM public.municipios m CROSS JOIN public.modulos mo;
