-- ============ FASE 2: FUNCAO DE PESQUISA NACIONAL CROSS-TENANT ============

CREATE OR REPLACE FUNCTION public.pesquisa_nacional(
  _termo text,
  _tipo text DEFAULT 'chassi'
)
RETURNS TABLE (
  id uuid,
  chassi text,
  matricula text,
  numero_motor text,
  marca text,
  modelo text,
  cor text,
  estado text,
  municipio_id uuid,
  municipio_nome text,
  created_at timestamptz,
  proprietario_nome text,
  proprietario_bi text,
  proprietario_contacto text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _meu_mun uuid;
  _super boolean;
  _papel public.app_papel;
BEGIN
  -- Identificar contexto do utilizador
  _super := public.e_super_admin(_user_id);
  _meu_mun := public.meu_municipio(_user_id);

  SELECT papel INTO _papel FROM public.utilizador_papeis WHERE user_id = _user_id LIMIT 1;

  RETURN QUERY
  SELECT
    m.id,
    m.chassi,
    m.matricula,
    m.numero_motor,
    m.marca,
    m.modelo,
    m.cor,
    m.estado::text,
    m.municipio_id,
    mun.nome AS municipio_nome,
    m.created_at,
    -- Dados pessoais só se for super admin, polícia, admin municipal ou mota do próprio município
    CASE
      WHEN _super OR _papel = 'policia' OR _papel = 'admin_municipal' OR m.municipio_id = _meu_mun
      THEN m.proprietario_nome
      ELSE NULL
    END AS proprietario_nome,
    CASE
      WHEN _super OR _papel = 'policia' OR _papel = 'admin_municipal' OR m.municipio_id = _meu_mun
      THEN m.proprietario_bi
      ELSE NULL
    END AS proprietario_bi,
    CASE
      WHEN _super OR _papel = 'policia' OR _papel = 'admin_municipal' OR m.municipio_id = _meu_mun
      THEN m.proprietario_contacto
      ELSE NULL
    END AS proprietario_contacto
  FROM public.motos m
  JOIN public.municipios mun ON mun.id = m.municipio_id
  WHERE
    CASE _tipo
      WHEN 'chassi' THEN m.chassi ILIKE '%' || UPPER(_termo) || '%'
      WHEN 'matricula' THEN m.matricula ILIKE '%' || UPPER(_termo) || '%'
      WHEN 'motor' THEN m.numero_motor ILIKE '%' || UPPER(_termo) || '%'
      ELSE m.chassi ILIKE '%' || UPPER(_termo) || '%'
    END
  ORDER BY m.created_at DESC
  LIMIT 25;
END;
$$;

GRANT EXECUTE ON FUNCTION public.pesquisa_nacional(text, text) TO authenticated;
