CREATE OR REPLACE FUNCTION public.log_moto_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
  IF NEW.proprietario_distrito IS DISTINCT FROM OLD.proprietario_distrito THEN diff_json := diff_json || jsonb_build_object('proprietario_distrito', jsonb_build_object('antes', OLD.proprietario_distrito, 'depois', NEW.proprietario_distrito)); campos := array_append(campos, 'proprietario_distrito'); END IF;
  IF NEW.proprietario_posto_admin IS DISTINCT FROM OLD.proprietario_posto_admin THEN diff_json := diff_json || jsonb_build_object('proprietario_posto_admin', jsonb_build_object('antes', OLD.proprietario_posto_admin, 'depois', NEW.proprietario_posto_admin)); campos := array_append(campos, 'proprietario_posto_admin'); END IF;
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
$function$;