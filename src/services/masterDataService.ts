import { supabase } from './supabase';
import { Branch, Feature } from '../types';

export const getBranches = async () => {
    try {
        const { data, error } = await supabase
            .from('m_branches')
            .select('*')
            .eq('is_active', true)
            .order('name');

        return { data: data as Branch[] | null, error };
    } catch (error) {
        return { data: null, error };
    }
};

export const getAllFeatures = async () => {
    try {
        const { data, error } = await supabase
            .from('m_features')
            .select('*')
            .eq('is_active', true)
            .order('created_at'); // Urutan sesuai waktu insert

        return { data: data as Feature[] | null, error };
    } catch (error) {
        return { data: null, error };
    }
};
