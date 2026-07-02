import { createClient } from '@supabase/supabase-js';

// Read from Vite environment variables, falling back to the user's provided project details
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://euwdobdygscznryhtfuu.supabase.co';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_fiplXDmJtlwFbkVw88UK7w_dWk9K_JC';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface RegistrationData {
  username: string;
  contact: string;
  role: string;
  email: string;
  phone: string;
}

/**
 * Saves a citizen/agency registration record to Supabase.
 * It first tries inserting into the 'registrations' table, and if that fails,
 * it tries the 'users' table as a standard fallback.
 */
export async function saveRegistration(data: RegistrationData) {
  const record = {
    username: data.username,
    contact: data.contact,
    role: data.role,
    email: data.email,
    phone: data.phone,
    created_at: new Date().toISOString()
  };

  // 1. Try 'registrations' table
  const { data: regResult, error: regError } = await supabase
    .from('registrations')
    .insert([record])
    .select();

  if (!regError) {
    return { success: true, table: 'registrations', data: regResult };
  }

  console.warn("Could not insert into 'registrations' table, trying 'users' fallback...", regError.message);

  // 2. Try 'users' table fallback
  const { data: userResult, error: userError } = await supabase
    .from('users')
    .insert([record])
    .select();

  if (!userError) {
    return { success: true, table: 'users', data: userResult };
  }

  // If both failed, throw a descriptive combined error
  console.error("Supabase write failed on both 'registrations' and 'users' tables.");
  throw new Error(
    `Supabase insert failed. Make sure you have created either a 'registrations' or 'users' table in your Supabase dashboard with columns: username (text), contact (text), role (text), email (text), phone (text), created_at (timestamp). Error details: ${regError.message}`
  );
}

/**
 * Fetches all registration/booking records from Supabase tables.
 */
export async function fetchRegistrations() {
  // Try 'registrations' table first
  const { data: regData, error: regError } = await supabase
    .from('registrations')
    .select('*')
    .order('created_at', { ascending: false });

  if (!regError && regData) {
    return { success: true, table: 'registrations', data: regData };
  }

  console.warn("Could not query 'registrations' table, trying 'users' fallback...", regError?.message);

  // Fallback to 'users' table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (!userError && userData) {
    return { success: true, table: 'users', data: userData };
  }

  throw new Error(
    `Failed to fetch registrations from Supabase. Error details: ${regError?.message || userError?.message || 'Unknown'}`
  );
}

/**
 * Seeds or syncs multiple registrations/bookings to Supabase.
 * Useful for syncing local demo data to live Supabase backend.
 */
export async function seedRegistrations(records: RegistrationData[]) {
  const formattedRecords = records.map(r => ({
    username: r.username,
    contact: r.contact,
    role: r.role,
    email: r.email,
    phone: r.phone,
    created_at: new Date().toISOString()
  }));

  // 1. Try 'registrations' table
  const { data: regResult, error: regError } = await supabase
    .from('registrations')
    .insert(formattedRecords)
    .select();

  if (!regError) {
    return { success: true, table: 'registrations', data: regResult };
  }

  console.warn("Seed into 'registrations' table failed, trying 'users'...", regError.message);

  // 2. Try 'users' table
  const { data: userResult, error: userError } = await supabase
    .from('users')
    .insert(formattedRecords)
    .select();

  if (!userError) {
    return { success: true, table: 'users', data: userResult };
  }

  throw new Error(
    `Failed to seed registrations to Supabase. Error details: ${regError.message} / ${userError.message}`
  );
}

/**
 * Sends a real 6-digit OTP code to the specified email using Supabase Auth.
 */
export async function sendEmailOTP(email: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: {
      shouldCreateUser: true
    }
  });

  if (error) {
    throw error;
  }
  return data;
}

/**
 * Verifies a real OTP code sent to the specified email using Supabase Auth.
 * Tries 'signup' type first, and falls back to 'email' if the user already exists.
 */
export async function verifyEmailOTP(email: string, otp: string) {
  // Try 'signup' verification first
  const { data: signupData, error: signupError } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token: otp.trim(),
    type: 'signup'
  });

  if (!signupError && signupData?.session) {
    return { success: true, user: signupData.user, session: signupData.session };
  }

  // Fallback to 'email' (signin) type
  const { data: signinData, error: signinError } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token: otp.trim(),
    type: 'email'
  });

  if (!signinError && signinData?.session) {
    return { success: true, user: signinData.user, session: signinData.session };
  }

  // Fallback to 'magiclink' type
  const { data: magicData, error: magicError } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token: otp.trim(),
    type: 'magiclink'
  });

  if (!magicError && magicData?.session) {
    return { success: true, user: magicData.user, session: magicData.session };
  }

  throw new Error(
    signupError?.message || signinError?.message || magicError?.message || 'Invalid or expired OTP code'
  );
}


