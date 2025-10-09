DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
UPDATE auth.users SET email = raw_user_meta_data->>'email' WHERE email IS NULL AND raw_user_meta_data->>'email' IS NOT NULL;
UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;

