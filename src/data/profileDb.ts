import { supabase } from '../lib/supabase'
import type { Profile, SignupProfileInput } from '../types'

type ProfileRow = {
  id: string
  first_name: string
  last_name: string
  phone: string
  created_at: string
  updated_at: string
}

function rowToProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function profileFromMetadata(
  metadata: Record<string, unknown> | undefined,
): SignupProfileInput {
  return {
    firstName:
      typeof metadata?.first_name === 'string' ? metadata.first_name.trim() : '',
    lastName:
      typeof metadata?.last_name === 'string' ? metadata.last_name.trim() : '',
    phone: typeof metadata?.phone === 'string' ? metadata.phone.trim() : '',
  }
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, phone, created_at, updated_at')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return rowToProfile(data as ProfileRow)
}

export async function upsertProfile(
  userId: string,
  input: SignupProfileInput,
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        first_name: input.firstName.trim(),
        last_name: input.lastName.trim(),
        phone: input.phone.trim(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )
    .select('id, first_name, last_name, phone, created_at, updated_at')
    .single()

  if (error) throw error
  return rowToProfile(data as ProfileRow)
}

/** Create or refresh profile row from auth metadata (runs every login). */
export async function ensureProfileFromAuth(): Promise<Profile | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!user) return null

  const fromMeta = profileFromMetadata(user.user_metadata)
  const existing = await getProfile(user.id)

  return upsertProfile(user.id, {
    firstName: existing?.firstName || fromMeta.firstName,
    lastName: existing?.lastName || fromMeta.lastName,
    phone: existing?.phone || fromMeta.phone,
  })
}
