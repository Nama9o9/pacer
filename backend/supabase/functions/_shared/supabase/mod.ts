// Einstiegspunkt für Edge Functions: import { ... } from '../_shared/supabase/mod.ts'
export { readSupabaseEnv } from './env.ts';
export type { SupabaseEnv } from './env.ts';
export { authenticate, createUserClient, readBearerToken } from './auth.ts';
export type { AuthenticatedUser } from './auth.ts';
export { AI_WRITABLE_TABLES, createAdminClient, createAiWriter } from './aiWriter.ts';
export type { AiWritableTable, AiWriter } from './aiWriter.ts';
