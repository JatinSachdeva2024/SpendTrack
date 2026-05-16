-- Paste in Supabase SQL Editor → Run
-- Shows every login user and whether they have a profiles row

select
  u.id,
  u.email,
  u.created_at as signed_up,
  u.raw_user_meta_data ->> 'first_name' as meta_first_name,
  u.raw_user_meta_data ->> 'last_name' as meta_last_name,
  u.raw_user_meta_data ->> 'phone' as meta_phone,
  p.first_name as profile_first_name,
  p.last_name as profile_last_name,
  p.phone as profile_phone,
  case when p.id is null then 'MISSING PROFILE' else 'ok' end as status
from auth.users u
left join public.profiles p on p.id = u.id
order by u.created_at desc;
