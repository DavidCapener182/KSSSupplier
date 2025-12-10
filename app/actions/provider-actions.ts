'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

interface CreateProviderData {
  companyName: string;
  contactEmail: string;
  password?: string; // Optional, if we want to auto-generate or let admin set it
  firstName?: string; // For director/contact name
  lastName?: string;
}

export async function createProviderUser(data: CreateProviderData) {
  try {
    const supabase = createAdminClient();
    
    const { companyName, contactEmail, password, firstName, lastName } = data;
    
    if (!companyName || !contactEmail || !password) {
      return { success: false, error: 'Missing required fields' };
    }

    // 1. Create the user in Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
              email: contactEmail,
              password: password,
              email_confirm: true,
              user_metadata: {
                full_name: `${firstName || ''} ${lastName || ''}`.trim(),
                company_name: companyName,
              }
            });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return { success: false, error: authError.message };
    }

    const userId = authData.user.id;

    // 2. Insert into public.users (for role management)
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: contactEmail,
        role: 'provider'
      });

    if (userError) {
      console.error('Error creating public user:', userError);
      // Clean up auth user if public user creation fails
      await supabase.auth.admin.deleteUser(userId);
      return { success: false, error: 'Failed to create user record' };
    }

    // 3. Create the provider record
    const { error: providerError } = await supabase
      .from('providers')
      .insert({
        user_id: userId,
        company_name: companyName,
        contact_email: contactEmail,
        director_contact_name: `${firstName || ''} ${lastName || ''}`.trim(),
        status: 'pending', // Pending until documents are signed/approved, though admin created it so maybe 'approved'? 
                          // Plan says: "admin creates... then we email them details to start onboarding". 
                          // So 'pending' or a new status is appropriate. 'pending' is fine as they need to sign docs.
        submitted_at: new Date().toISOString(),
      });

    if (providerError) {
      console.error('Error creating provider record:', providerError);
      // Clean up - though complex if public.users succeeded. 
      // ideally we'd use a transaction but Supabase client doesn't support them easily across auth/public.
      return { success: false, error: 'Failed to create provider profile' };
    }

    revalidatePath('/admin/providers');
    return { success: true, userId, email: contactEmail, password };
  } catch (error: any) {
    console.error('Unexpected error in createProviderUser:', error);
    if (error.message?.includes('Missing Supabase environment variables')) {
      return { success: false, error: 'Configuration Error: Missing Supabase Service Key' };
    }
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

export async function toggleProviderAccess(providerId: string, userId: string, shouldDisable: boolean) {
  try {
    const supabase = createAdminClient();

    // 1. Update Supabase Auth (Ban/Unban)
    if (shouldDisable) {
      // Ban the user for a very long time
      const { error: banError } = await supabase.auth.admin.updateUserById(userId, {
        ban_duration: '876600h' // ~100 years
      });
      if (banError) throw banError;
    } else {
      // Unban the user
      const { error: unbanError } = await supabase.auth.admin.updateUserById(userId, {
        ban_duration: 'none'
      });
      if (unbanError) throw unbanError;
    }

    // 2. Update Provider Status
    const newStatus = shouldDisable ? 'suspended' : 'approved'; 
    // Note: When reinstating, we might want to go back to 'approved' assuming they were approved before.
    // Or check if they have completed documents. 
    // For now, 'approved' allows them to log in and continue.

    const { error: updateError } = await supabase
      .from('providers')
      .update({ status: newStatus })
      .eq('id', providerId);

    if (updateError) throw updateError;

    revalidatePath('/admin/providers');
    return { success: true };
  } catch (error: any) {
    console.error('Error toggling provider access:', error);
    if (error.message?.includes('Missing Supabase environment variables')) {
      return { success: false, error: 'Configuration Error: Missing Supabase Service Key' };
    }
    return { success: false, error: error.message };
  }
}

export async function deleteProviderUser(providerId: string, userId: string) {
  try {
    const supabase = createAdminClient();

    // 1. Delete from Supabase Auth
    // This is the primary account. Deleting this should ideally cascade to public.users.
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId);
    
    if (deleteAuthError) {
      // If the user is not found, we should still proceed to delete the provider record
      // This handles cases where the auth user was already deleted or never created properly
      if (deleteAuthError.message.includes('User not found') || (deleteAuthError as any).status === 404) {
        console.warn(`Auth user ${userId} not found, proceeding to delete provider record`);
      } else {
        throw deleteAuthError;
      }
    }

    // 2. Explicitly delete from providers table to ensure clean up
    // (In case cascade isn't set up or fails)
    const { error: deleteProviderError } = await supabase
      .from('providers')
      .delete()
      .eq('id', providerId);

    if (deleteProviderError) {
      console.error('Error deleting provider record (might have already cascaded):', deleteProviderError);
      // We don't throw here because the primary goal (auth deletion) succeeded
    }

    revalidatePath('/admin/providers');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting provider:', error);
    if (error.message?.includes('Missing Supabase environment variables')) {
      return { success: false, error: 'Configuration Error: Missing Supabase Service Key' };
    }
    return { success: false, error: error.message };
  }
}

