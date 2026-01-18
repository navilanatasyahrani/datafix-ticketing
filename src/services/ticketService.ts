import { supabase } from './supabase';
import { Ticket, TicketStatus } from '../types';

interface TicketFilters {
    status?: TicketStatus;
    branch_id?: string;
    assigned_to?: string;
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
        description,
        fix_description,
        status,
        priority,
        assigned_to,
        created_at,
        updated_at,
        branch:m_branches(id, name),
        feature:m_features(id, name),
        reporter:profiles!datafix_tickets_reporter_user_id_fkey(id, full_name),
        assignee:profiles!datafix_tickets_assigned_to_fkey(id, full_name)
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
        description,
        fix_description,
        status,
        priority,
        assigned_to,
        created_at,
        updated_at,
        branch:m_branches(id, name),
        feature:m_features(id, name),
        reporter:profiles!datafix_tickets_reporter_user_id_fkey(id, full_name, role),
        assignee:profiles!datafix_tickets_assigned_to_fkey(id, full_name, role),
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
            .select()
            .single();

        return { data: data as Ticket | null, error };
    } catch (error) {
        return { data: null, error };
    }
};

export const updateTicket = async (id: string, updates: Partial<Ticket>) => {
    try {
        const { data, error } = await supabase
            .from('datafix_tickets')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        return { data: data as Ticket | null, error };
    } catch (error) {
        return { data: null, error };
    }
};

export const deleteTicket = async (id: string) => {
    try {
        const { error } = await supabase
            .from('datafix_tickets')
            .delete()
            .eq('id', id);

        return { error };
    } catch (error) {
        return { error };
    }
};

export const getTicketStats = async () => {
    try {
        const { data, error } = await supabase.rpc('get_ticket_stats').single();
        return { data, error };
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
