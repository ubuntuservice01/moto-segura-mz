ALTER TABLE public.transferencias
  ADD COLUMN IF NOT EXISTS municipio_origem_id uuid REFERENCES public.municipios(id),
  ADD COLUMN IF NOT EXISTS municipio_destino_id uuid REFERENCES public.municipios(id),
  ADD COLUMN IF NOT EXISTS utilizador_origem_id uuid,
  ADD COLUMN IF NOT EXISTS utilizador_destino_id uuid,
  ADD COLUMN IF NOT EXISTS estado text NOT NULL DEFAULT 'concluida',
  ADD COLUMN IF NOT EXISTS tipo_fluxo text NOT NULL DEFAULT 'origem_inicia',
  ADD COLUMN IF NOT EXISTS motivo_rejeicao text,
  ADD COLUMN IF NOT EXISTS data_conclusao timestamptz;

UPDATE public.transferencias
   SET municipio_origem_id = COALESCE(municipio_origem_id, municipio_id),
       municipio_destino_id = COALESCE(municipio_destino_id, municipio_id),
       data_conclusao = COALESCE(data_conclusao, created_at);

ALTER TABLE public.transferencias
  ADD CONSTRAINT transferencias_estado_chk
  CHECK (estado IN ('pendente_aceitacao','aguardando_origem','concluida','rejeitada'));

ALTER TABLE public.transferencias
  ADD CONSTRAINT transferencias_tipo_fluxo_chk
  CHECK (tipo_fluxo IN ('origem_inicia','destino_solicita'));

CREATE INDEX IF NOT EXISTS transferencias_destino_idx ON public.transferencias (municipio_destino_id, estado);
CREATE INDEX IF NOT EXISTS transferencias_origem_idx ON public.transferencias (municipio_origem_id, estado);

DROP POLICY IF EXISTS transferencias_tenant_select ON public.transferencias;
CREATE POLICY transferencias_tenant_select ON public.transferencias
  FOR SELECT TO authenticated
  USING (
    e_super_admin(auth.uid())
    OR municipio_id = meu_municipio(auth.uid())
    OR municipio_origem_id = meu_municipio(auth.uid())
    OR municipio_destino_id = meu_municipio(auth.uid())
  );

ALTER TABLE public.reportes_roubo
  ADD COLUMN IF NOT EXISTS tipo_identificador text NOT NULL DEFAULT 'chassi',
  ADD COLUMN IF NOT EXISTS descricao text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contacto text;