-- Run ONCE in Supabase SQL Editor if you already had users before profiles table existed.
-- Copies first_name, last_name, phone from auth signup metadata into profiles.

insert into public.profiles (id, first_name, last_name, phone)
select
  id,
  coalesce(raw_user_meta_data ->> 'first_name', ''),
  coalesce(raw_user_meta_data ->> 'last_name', ''),
  coalesce(raw_user_meta_data ->> 'phone', '')
from auth.users
on conflict (id) do update set
  first_name = case
    when profiles.first_name = '' then excluded.first_name
    else profiles.first_name
  end,
  last_name = case
    when profiles.last_name = '' then excluded.last_name
    else profiles.last_name
  end,
  phone = case
    when profiles.phone = '' then excluded.phone
    else profiles.phone
  end,
  updated_at = now();
