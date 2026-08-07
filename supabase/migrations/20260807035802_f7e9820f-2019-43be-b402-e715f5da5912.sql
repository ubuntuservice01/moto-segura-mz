REVOKE ALL ON FUNCTION public.tem_papel(uuid, public.app_papel) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.e_super_admin(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.meu_municipio(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tem_papel(uuid, public.app_papel) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.e_super_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.meu_municipio(uuid) TO authenticated, service_role;