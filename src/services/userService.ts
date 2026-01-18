import { supabase } from './supabase';
import { Profile } from '../types';

export const getAllUsers = async () => {
    const { data, error } = await supabase
        .from('profiles')
        .select(`
            id,
            full_name,
            role,
            created_at,
            branch_id,
            branch:m_branches(*)
        `)
        .order('created_at', { ascending: false });

    return { data, error };
};

export const updateUserProfile = async (userId: string, updates: Partial<Profile>) => {
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

    return { data, error };
};
