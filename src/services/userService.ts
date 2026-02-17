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
            region_id,
            branch:m_branches(*),
            region:m_regions!region_id(*)
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

export const createUser = async (user: { email: string; password: string; full_name: string; role: string }) => {
    const { data, error } = await supabase.rpc('create_new_user', {
        email: user.email,
        password: user.password,
        full_name: user.full_name,
        role_name: user.role
    });

    return { data, error };
};
