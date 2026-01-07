-- Insert profile for existing user (if not exists)
INSERT INTO public.profiles (user_id, name, account_type)
SELECT id, COALESCE(raw_user_meta_data->>'name', email), 'user'
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.users.id
)
ON CONFLICT DO NOTHING;