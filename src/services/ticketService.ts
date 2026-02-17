import { supabase } from './supabase';
import { Ticket, TicketStatus } from '../types';

interface TicketFilters {
    status?: TicketStatus;
    branch_id?: string;
    assigned_to?: string;
    origin_region_id?: string;

    target_team?: string;
    stage?: string;
    current_queue?: string;
}

export const getTickets = async (filters?: TicketFilters) => {
    try {
        let query = supabase
            .from('datafix_tickets')
            .select(`
        id,
        reporter_user_id,
        reporter_name,
        wrong_input_date,
        issue_type,
        branch_id,
        feature_id,
        feature_other,
        inputter_name,
        wrong_input_username,
        description,
        fix_description,
        status,
        priority,
        assigned_to,
        created_at,
        updated_at,
        origin_region_id,
        target_team,

        stage,
        triaged_by,
        triaged_at,
        current_queue,
        redirected_by,
        redirected_at,
        branch:m_branches(id, name),
        feature:m_features(id, name),
        reporter:profiles!reporter_user_id(id, full_name),
        origin_region:m_regions!origin_region_id(id, region_name)
      `)
            .order('created_at', { ascending: false });

        if (filters?.status) {
            query = query.eq('status', filters.status);
        }
        if (filters?.branch_id) {
            query = query.eq('branch_id', filters.branch_id);
        }
        if (filters?.assigned_to) {
            query = query.eq('assigned_to', filters.assigned_to);
        }
        if (filters?.origin_region_id) {
            query = query.eq('origin_region_id', filters.origin_region_id);
        }

        if (filters?.target_team) {
            query = query.eq('target_team', filters.target_team);
        }
        if (filters?.stage) {
            query = query.eq('stage', filters.stage);
        }
        if (filters?.current_queue) {
            query = query.eq('current_queue', filters.current_queue);
        }

        const { data, error } = await query;
        return { data: data as Ticket[] | null, error };
    } catch (error) {
        return { data: null, error };
    }
};

export const getTicketById = async (id: string) => {
    try {
        const { data, error } = await supabase
            .from('datafix_tickets')
            .select(`
        id,
        reporter_user_id,
        reporter_name,
        wrong_input_date,
        issue_type,
        branch_id,
        feature_id,
        feature_other,
        inputter_name,
        wrong_input_username,
        description,
        fix_description,
        status,
        priority,
        assigned_to,
        created_at,
        updated_at,
        origin_region_id,
        target_team,

        stage,
        triaged_by,
        triaged_at,
        current_queue,
        redirected_by,
        redirected_at,
        branch:m_branches(id, name),
        feature:m_features(id, name),
        reporter:profiles!reporter_user_id(id, full_name, role),
        origin_region:m_regions!origin_region_id(id, region_name),
        attachments:ticket_attachments(id, ticket_id, file_path, file_name, mime_type, created_at),
        detail_lines:ticket_detail_lines(id, ticket_id, side, item_name, value, note, created_at),
        status_history:ticket_status_history(id, ticket_id, changed_by, created_at)
      `)
            .eq('id', id)
            .single();

        return { data: data as Ticket | null, error };
    } catch (error) {
        return { data: null, error };
    }
};

export const createTicket = async (ticketData: Partial<Ticket>) => {
    try {
        const { data, error } = await supabase
            .from('datafix_tickets')
            .insert([ticketData])
            .select('id')
            .single();

        if (error) return { data: null, error };

        // Try to fetch the full ticket (may fail if SELECT RLS blocks)
        if (data?.id) {
            const { data: fullTicket } = await supabase
                .from('datafix_tickets')
                .select('*, reporter:profiles!datafix_tickets_reporter_user_id_fkey(full_name, email), branch:m_branches!datafix_tickets_branch_id_fkey(name), feature:m_features!datafix_tickets_feature_id_fkey(name)')
                .eq('id', data.id)
                .single();
            return { data: fullTicket as Ticket | null, error: null };
        }

        return { data: null, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

export const updateTicket = async (id: string, updates: Partial<Ticket>) => {
    try {
        const { error } = await supabase
            .from('datafix_tickets')
            .update(updates)
            .eq('id', id);

        if (error) return { data: null, error };

        // Fetch the ticket separately (may return null if RLS blocks after redirect)
        const { data } = await supabase
            .from('datafix_tickets')
            .select('*, reporter:profiles!datafix_tickets_reporter_user_id_fkey(full_name, email), branch:m_branches!datafix_tickets_branch_id_fkey(name), feature:m_features!datafix_tickets_feature_id_fkey(name)')
            .eq('id', id)
            .single();

        return { data: data as Ticket | null, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

export const redirectTicket = async (ticketId: string, targetTeam: string, currentQueue: string) => {
    try {
        const { error } = await supabase.rpc('redirect_ticket', {
            p_ticket_id: ticketId,
            p_target_team: targetTeam,
            p_current_queue: currentQueue,
        });
        return { error };
    } catch (error) {
        return { error };
    }
};

export const deleteTicket = async (id: string) => {
    try {
        // Delete related records first (manual cascade)
        await supabase.from('ticket_detail_lines').delete().eq('ticket_id', id);
        await supabase.from('ticket_status_history').delete().eq('ticket_id', id);
        await supabase.from('ticket_attachments').delete().eq('ticket_id', id);

        // Finally delete the ticket
        const { error } = await supabase
            .from('datafix_tickets')
            .delete()
            .eq('id', id);

        return { error };
    } catch (error) {
        return { error: error as any };
    }
};

export const getTicketStats = async () => {
    try {
        const { data, error } = await supabase.rpc('get_ticket_stats');

        // RPC returns an array because of RETURNS TABLE, but we expect a single object
        if (data && Array.isArray(data) && data.length > 0) {
            return { data: data[0], error };
        }

        return { data: data as any, error };
    } catch (error) {
        return { data: null, error };
    }
};

export const addDetailLines = async (ticketId: string, detailLines: any[]) => {
    try {
        const lines = detailLines.map(line => ({
            ...line,
            ticket_id: ticketId,
        }));

        const { data, error } = await supabase
            .from('ticket_detail_lines')
            .insert(lines)
            .select();

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
};

export const uploadAttachment = async (ticketId: string, file: File) => {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${ticketId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('ticket-attachments')
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('ticket-attachments')
            .getPublicUrl(fileName);

        const { data, error } = await supabase
            .from('ticket_attachments')
            .insert([{
                ticket_id: ticketId,
                file_path: publicUrl,
                file_name: file.name,
                mime_type: file.type,
            }])
            .select()
            .single();

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
};
