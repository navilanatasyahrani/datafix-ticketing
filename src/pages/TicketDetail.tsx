import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getTicketById, updateTicket, redirectTicket, deleteTicket } from '../services/ticketService';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, getStatusLabel, getPriorityLabel } from '../utils/formatters';
import { Ticket, UserRole } from '../types';

const TEAM_LABELS: Record<string, string> = {
    FIN_REGION: 'Finance Region',
    ACC_HO: 'Accounting HO',
    IT_SABANG: 'IT Sabang',
};

const ISSUE_TYPE_LABELS: Record<string, string> = {
    data_entry_error: 'Kesalahan Entri Data',
    system_bug: 'Bug Sistem / Error',
    missing_data: 'Data Hilang',
    incorrect_calculation: 'Kesalahan Perhitungan',
    other: 'Lainnya',
};

// Map target_team enum → current_queue enum
const TARGET_TO_QUEUE: Record<string, string> = {
    FIN_REGION: 'FIN_ADMIN',
    ACC_HO: 'ACCOUNTING_HO',
    IT_SABANG: 'IT_SABANG',
};

const TicketDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAdmin, canManageTickets, userRole } = useAuth();

    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    const [editData, setEditData] = useState({
        status: '',
        fix_description: '',
        target_team: ''
    });

    useEffect(() => {
        if (id) {
            loadTicket();
        }
    }, [id]);

    const loadTicket = async () => {
        if (!id) return;

        setLoading(true);
        const { data } = await getTicketById(id);
        if (data) {
            setTicket(data);
            setEditData({
                status: data.status,
                fix_description: data.fix_description || '',
                target_team: data.target_team || ''
            });
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!id) return;

        setSaving(true);
        let hasError = false;

        // If target_team changed, use RPC (SECURITY DEFINER) to bypass RLS
        if (editData.target_team && editData.target_team !== ticket?.target_team) {
            const newQueue = TARGET_TO_QUEUE[editData.target_team] || editData.target_team;
            const { error: redirectError } = await redirectTicket(id, editData.target_team, newQueue);
            if (redirectError) {
                console.error('❌ REDIRECT ERROR:', redirectError);
                hasError = true;
            }
        }

        // Update status & fix_description via normal update
        if (!hasError) {
            const payload: Record<string, any> = {
                status: editData.status as any,
                fix_description: editData.fix_description
            };
            const { error } = await updateTicket(id, payload);
            if (error) {
                console.error('❌ UPDATE ERROR:', error);
                hasError = true;
            }
        }

        if (!hasError) {
            setEditing(false);
            // Try to reload the ticket; if user lost access (e.g. redirected out of queue), go to list
            const { data: refreshed } = await getTicketById(id);
            if (refreshed) {
                setTicket(refreshed);
                setEditData({
                    status: refreshed.status,
                    fix_description: refreshed.fix_description || '',
                    target_team: refreshed.target_team || ''
                });
            } else {
                navigate('/tickets');
            }
        }
        setSaving(false);
    };

    const handleDelete = async () => {
        if (!id) return;
        if (confirm('Apakah Anda yakin ingin menghapus tiket ini? Tindakan ini tidak dapat dibatalkan.')) {
            const { error } = await deleteTicket(id);
            if (error) {
                alert('Gagal menghapus tiket');
            } else {
                navigate('/tickets');
            }
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-64">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            </Layout>
        );
    }

    if (!ticket) {
        return (
            <Layout>
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
                    Ticket not found
                </div>
            </Layout>
        );
    }

    const canEdit = isAdmin || canManageTickets;

    // Get wrong and correct descriptions from detail_lines
    const wrongDescription = ticket.detail_lines?.find(line => line.side === 'wrong')?.value || '';
    const correctDescription = ticket.detail_lines?.find(line => line.side === 'expected')?.value || '';

    return (
        <Layout>
            <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">Ticket Details</h1>
                        <p className="text-gray-500 text-sm">ID: {ticket.id.substring(0, 8)}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/tickets')}
                            className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-primary transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">west</span>
                            Back to List
                        </button>
                        {canEdit && !editing && (
                            <button
                                onClick={() => setEditing(true)}
                                className="bg-primary text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 hover:opacity-90 shadow-sm transition-all"
                            >
                                <span className="material-symbols-outlined text-lg">edit</span>
                                Edit
                            </button>
                        )}
                        {isAdmin && !editing && (
                            <button
                                onClick={handleDelete}
                                className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg font-semibold flex items-center gap-2 shadow-sm transition-all"
                            >
                                <span className="material-symbols-outlined text-lg">delete</span>
                                Hapus
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Ticket Information */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold mb-6">Ticket Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Tipe Masalah</label>
                                    <div className="font-medium">{ISSUE_TYPE_LABELS[ticket.issue_type] || ticket.issue_type}</div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Tanggal Kesalahan</label>
                                    <div className="font-medium">{formatDate(ticket.wrong_input_date)}</div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Cabang</label>
                                    <div className="font-medium">{ticket.branch?.name || '-'}</div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Fitur</label>
                                    <div className="font-medium">
                                        {(ticket.feature?.name === 'Lainnya' ? ticket.feature_other : ticket.feature?.name) || ticket.feature_other || '-'}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">PIC</label>
                                    <div className="font-medium">{ticket.inputter_name || '-'}</div>
                                </div>
                            </div>

                            <div className="mt-8">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Deskripsi</label>
                                <div className="bg-gray-50 border border-gray-100 p-4 rounded-lg min-h-[60px] whitespace-pre-wrap">
                                    {ticket.description}
                                </div>
                            </div>

                            {editing && canEdit ? (
                                <div className="mt-6">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Note Perbaikan</label>
                                    <textarea
                                        className="w-full min-h-[100px] rounded-lg border border-gray-200 p-4 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                        value={editData.fix_description}
                                        onChange={(e) => setEditData({ ...editData, fix_description: e.target.value })}
                                        placeholder="Deskripsikan Perubahan..."
                                    />
                                </div>
                            ) : ticket.fix_description && (
                                <div className="mt-6">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Fix Description</label>
                                    <div className="bg-gray-50 border border-gray-100 p-4 rounded-lg min-h-[60px] whitespace-pre-wrap">
                                        {ticket.fix_description}
                                    </div>
                                </div>
                            )}
                        </div>


                        {/* Region & Routing Info - only visible for admin */}
                        {isAdmin && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h2 className="text-lg font-bold mb-6">Region &amp; Routing</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Region Asal</label>
                                        <div className="font-medium">{ticket.origin_region?.region_name || '-'}</div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Tim Tujuan</label>
                                        <div className="font-medium">
                                            {ticket.target_team ? (TEAM_LABELS[ticket.target_team] || ticket.target_team) : '-'}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Current Queue</label>
                                        <div className="font-medium">
                                            {ticket.current_queue || '-'}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Stage</label>
                                        <div className="font-medium capitalize">
                                            {ticket.stage || '-'}
                                        </div>
                                    </div>
                                </div>

                                {/* Triage Info */}
                                {ticket.triaged_at && (
                                    <div className="mt-6 pt-4 border-t border-gray-100">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="material-symbols-outlined text-amber-500 text-lg">assignment_turned_in</span>
                                            <span className="text-sm font-bold text-gray-700">Triage Info</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Triaged At</label>
                                                <div className="text-sm">{formatDate(ticket.triaged_at)}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Redirect Info */}
                                {ticket.redirected_at && (
                                    <div className="mt-6 pt-4 border-t border-gray-100">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="material-symbols-outlined text-blue-500 text-lg">redo</span>
                                            <span className="text-sm font-bold text-gray-700">Redirect Info</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Redirected At</label>
                                                <div className="text-sm">{formatDate(ticket.redirected_at)}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Detail Baris */}
                        {(wrongDescription || correctDescription) && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h2 className="text-lg font-bold mb-6">Detail Baris</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Data Salah */}
                                    <div>
                                        <h3 className="text-sm font-bold text-red-500 mb-3 flex items-center gap-2 uppercase tracking-wide">
                                            <span className="material-symbols-outlined text-lg">error</span> DATA SALAH
                                        </h3>
                                        <textarea
                                            className="w-full h-32 p-4 bg-red-50/30 border border-red-200 rounded-lg text-sm font-mono text-slate-700 focus:ring-0 focus:border-red-200 resize-none"
                                            value={wrongDescription}
                                            readOnly
                                        />
                                    </div>

                                    {/* Data Benar */}
                                    <div>
                                        <h3 className="text-sm font-bold text-emerald-500 mb-3 flex items-center gap-2 uppercase tracking-wide">
                                            <span className="material-symbols-outlined text-lg">check_circle</span> DATA BENAR
                                        </h3>
                                        <textarea
                                            className="w-full h-32 p-4 bg-emerald-50/30 border border-emerald-200 rounded-lg text-sm font-mono text-slate-700 focus:ring-0 focus:border-emerald-200 resize-none"
                                            value={correctDescription}
                                            readOnly
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Lampiran Foto */}
                        {ticket.attachments && ticket.attachments.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h2 className="text-lg font-bold mb-6">Lampiran Foto</h2>
                                <div className="flex flex-wrap gap-4">
                                    {ticket.attachments.map((att) => (
                                        <a
                                            key={att.id}
                                            href={att.file_path}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200 cursor-pointer"
                                        >
                                            <img
                                                src={att.file_path}
                                                alt={att.file_name || 'Attachment'}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                            />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="material-symbols-outlined text-white">zoom_in</span>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Status & Priority */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold mb-6">Status &amp; Prioritas</h2>

                            {editing && canEdit ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Status</label>
                                        <select
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                                            value={editData.status}
                                            onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                                        >
                                            <option value="open">Dalam Antrean</option>
                                            <option value="in_progress">Sedang Diproses</option>
                                            <option value="done">Selesai</option>
                                            <option value="rejected">Ditolak</option>
                                        </select>
                                    </div>

                                    {/* Tim Tujuan - for fin_admin, accounting_ho, and admin */}
                                    {(isAdmin || userRole === UserRole.FIN_ADMIN || userRole === UserRole.ACCOUNTING_HO) && (
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Tim Tujuan</label>
                                            <select
                                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                                                value={editData.target_team}
                                                onChange={(e) => setEditData({ ...editData, target_team: e.target.value })}
                                            >
                                                <option value="">Belum Ditentukan</option>
                                                {/* Admin & Finance Admin: bisa ke semua tim */}
                                                {(isAdmin || userRole === UserRole.FIN_ADMIN) && (
                                                    <>
                                                        <option value="FIN_REGION">Finance Region</option>
                                                        <option value="ACC_HO">Accounting HO</option>
                                                        <option value="IT_SABANG">IT Sabang</option>
                                                    </>
                                                )}
                                                {/* Accounting HO: bisa ke Accounting HO & IT Sabang */}
                                                {userRole === UserRole.ACCOUNTING_HO && (
                                                    <>
                                                        <option value="ACC_HO">Accounting HO</option>
                                                        <option value="IT_SABANG">IT Sabang</option>
                                                    </>
                                                )}
                                            </select>
                                        </div>
                                    )}

                                    <div className="flex gap-2 pt-2">
                                        <button
                                            onClick={handleSave}
                                            className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
                                            disabled={saving}
                                        >
                                            {saving ? 'Saving...' : 'Save'}
                                        </button>
                                        <button
                                            onClick={() => setEditing(false)}
                                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-all"
                                            disabled={saving}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Status</label>
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${ticket.status === 'open' ? 'bg-orange-100 text-orange-700' :
                                            ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                                ticket.status === 'done' ? 'bg-emerald-100 text-emerald-700' :
                                                    'bg-red-100 text-red-700'
                                            }`}>
                                            {getStatusLabel(ticket.status)}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Prioritas</label>
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${ticket.priority === 1 ? 'bg-red-100 text-red-700' :
                                            ticket.priority === 2 ? 'bg-orange-100 text-orange-700' :
                                                'bg-green-100 text-green-700'
                                            }`}>
                                            {getPriorityLabel(ticket.priority)}
                                        </span>
                                    </div>

                                </div>
                            )}
                        </div>

                        {/* People */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold mb-6">Orang</h2>
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Reporter</label>
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-sm text-slate-500">alternate_email</span>
                                        </div>
                                        <span className="font-medium text-sm">
                                            {ticket.reporter?.full_name || ticket.reporter_name || '-'}
                                        </span>
                                    </div>
                                </div>
                                {userRole !== UserRole.OUTLET && (
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Assigned To</label>
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-sm text-primary">person</span>
                                            </div>
                                            <span className="font-medium text-sm">
                                                {ticket.assigned_to || 'Unassigned'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                {/* Tim Tujuan - visible to all */}
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Tim Tujuan</label>
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-sm text-indigo-600">groups</span>
                                        </div>
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${ticket.target_team ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            {ticket.target_team ? (TEAM_LABELS[ticket.target_team] || ticket.target_team) : 'Belum Ditentukan'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold mb-6">Timeline</h2>
                            <div className="space-y-8 relative">
                                <div className="relative flex gap-4">
                                    <div className="z-10 h-4 w-4 rounded-full border-2 border-primary bg-white mt-1 flex-shrink-0"></div>
                                    <div className="absolute left-[7px] top-6 bottom-0 w-0.5 bg-gray-200"></div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Created</label>
                                        <p className="text-sm font-medium">{formatDate(ticket.created_at)}</p>
                                    </div>
                                </div>
                                {ticket.triaged_at && (
                                    <div className="relative flex gap-4">
                                        <div className="z-10 h-4 w-4 rounded-full border-2 border-amber-500 bg-white mt-1 flex-shrink-0"></div>
                                        <div className="absolute left-[7px] top-6 bottom-0 w-0.5 bg-gray-200"></div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Triaged</label>
                                            <p className="text-sm font-medium">{formatDate(ticket.triaged_at)}</p>
                                        </div>
                                    </div>
                                )}
                                {ticket.redirected_at && (
                                    <div className="relative flex gap-4">
                                        <div className="z-10 h-4 w-4 rounded-full border-2 border-blue-500 bg-white mt-1 flex-shrink-0"></div>
                                        <div className="absolute left-[7px] top-6 bottom-0 w-0.5 bg-gray-200"></div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Redirected</label>
                                            <p className="text-sm font-medium">{formatDate(ticket.redirected_at)}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="relative flex gap-4">
                                    <div className="z-10 h-4 w-4 rounded-full border-2 border-primary bg-primary mt-1 flex-shrink-0"></div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Last Updated</label>
                                        <p className="text-sm font-medium">{formatDate(ticket.updated_at)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </Layout>
    );
};

export default TicketDetail;
