import { supabase } from './supabase';
import { Branch, Feature, Region } from '../types';

export const getBranches = async () => {
    try {
        const { data, error } = await supabase
            .from('m_branches')
            .select('id, name, is_active, region_id, created_at')
            .eq('is_active', true)
            .order('name');

        if (error) console.error('getBranches error:', error);
        return { data: data as Branch[] | null, error };
    } catch (error) {
        console.error('getBranches exception:', error);
        return { data: null, error };
    }
};

export const getAllFeatures = async () => {
    try {
        const { data, error } = await supabase
            .from('m_features')
            .select('*')
            .eq('is_active', true)
            .order('name');

        // "Lainnya" selalu di paling bawah
        if (data) {
            data.sort((a, b) => {
                if (a.name === 'Lainnya') return 1;
                if (b.name === 'Lainnya') return -1;
                return a.name.localeCompare(b.name);
            });
        }

        return { data: data as Feature[] | null, error };
    } catch (error) {
        return { data: null, error };
    }
};

export const getRegions = async () => {
    try {
        const { data, error } = await supabase
            .from('m_regions')
            .select('*')
            .order('region_name');

        return { data: data as Region[] | null, error };
    } catch (error) {
        return { data: null, error };
    }
};
