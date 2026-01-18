import React, { useEffect, useState, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getTicketById, updateTicket } from '../services/ticketService';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, getStatusLabel, getPriorityLabel } from '../utils/formatters';
import { Ticket } from '../types';

const TicketDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAdmin } = useAuth();

    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    const [editData, setEditData] = useState({
        status: '',
        fix_description: ''
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
                fix_description: data.fix_description || ''
            });
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!id) return;

        setSaving(true);

        // Explicitly construct payload to avoid sending potential stale state properties
        const payload = {
            status: editData.status as any,
            fix_description: editData.fix_description
        };

        const { error } = await updateTicket(id, payload);

        if (!error) {
            setEditing(false);
            loadTicket();
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-64">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </Layout>
        );
    }

    if (!ticket) {
        return (
            <Layout>
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl">
                    Ticket not found
                </div>
            </Layout>
        );
    }

    const canEdit = isAdmin;

    return (
        <Layout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-black text-slate-800">Ticket Details</h2>
                    <p className="text-slate-500 mt-1">ID: {ticket.id.substring(0, 8)}</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/tickets')}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
                    >
                        ← Back to List
                    </button>
                    {canEdit && !editing && (
                        <button
                            onClick={() => setEditing(true)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all"
                        >
                            ✏️ Edit
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-200 p-8">
                        <h3 className="text-lg font-black text-slate-800 mb-6">Ticket Information</h3>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Issue Type</div>
                                <div className="font-semibold text-slate-800">{ticket.issue_type}</div>
                            </div>
                            <div>
                                <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Wrong Input Date</div>
                                <div className="font-semibold text-slate-800">{formatDate(ticket.wrong_input_date)}</div>
                            </div>
                            <div>
                                <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Branch</div>
                                <div className="font-semibold text-slate-800">{ticket.branch?.name || '-'}</div>
                            </div>

                            <div>
                                <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Feature</div>
                                <div className="font-semibold text-slate-800">{ticket.feature?.name || ticket.feature_other || '-'}</div>
                            </div>
                            <div>
                                <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Inputter Name</div>
                                <div className="font-semibold text-slate-800">{ticket.inputter_name || '-'}</div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Description</div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 whitespace-pre-wrap">
                                {ticket.description}
                            </div>
                        </div>

                        {editing && canEdit ? (
                            <div className="mt-6">
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                                    Fix Description
                                </label>
                                <textarea
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                                    value={editData.fix_description}
                                    onChange={(e) => setEditData({ ...editData, fix_description: e.target.value })}
                                    placeholder="Describe the fix..."
                                />
                            </div>
                        ) : ticket.fix_description && (
                            <div className="mt-6">
                                <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Fix Description</div>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 whitespace-pre-wrap">
                                    {ticket.fix_description}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Detail Lines */}
                    {ticket.detail_lines && ticket.detail_lines.length > 0 && (
                        <div className="bg-white rounded-3xl border border-slate-200 p-8">
                            <h3 className="text-lg font-black text-slate-800 mb-6">Detail Lines (Before/After)</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Side</th>
                                            <th className="px-4 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Item Name</th>
                                            <th className="px-4 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Value</th>
                                            <th className="px-4 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Note</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {ticket.detail_lines.map((line) => (
                                            <tr key={line.id}>
                                                <td className="px-4 py-3">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${line.side === 'wrong' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                                        }`}>
                                                        {line.side === 'wrong' ? 'Data Salah' : 'Data Benar'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-semibold text-slate-800">{line.item_name}</td>
                                                <td className="px-4 py-3 text-slate-600">{line.value || '-'}</td>
                                                <td className="px-4 py-3 text-slate-500 text-sm">{line.note || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Attachments */}
                    {ticket.attachments && ticket.attachments.length > 0 && (
                        <div className="bg-white rounded-3xl border border-slate-200 p-8">
                            <h3 className="text-lg font-black text-slate-800 mb-6">Attachments</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {ticket.attachments.map((att) => (
                                    <a
                                        key={att.id}
                                        href={att.file_path}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block group relative aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200 hover:shadow-md transition-all"
                                    >
                                        <img
                                            src={att.file_path}
                                            alt={att.file_name || 'Attachment'}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                            <span className="opacity-0 group-hover:opacity-100 bg-white text-slate-900 text-xs font-bold px-4 py-2 rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all">
                                                View Original
                                            </span>
                                        </div>
                                        {att.file_name && (
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <p className="text-white text-xs truncate">{att.file_name}</p>
                                            </div>
                                        )}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6">
                        <h3 className="text-lg font-black text-slate-800 mb-4">Status & Priority</h3>

                        {editing && canEdit ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                                        Status
                                    </label>
                                    <select
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={editData.status}
                                        onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                                    >
                                        <option value="open">Open</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={handleSave}
                                        className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                                        disabled={saving}
                                    >
                                        {saving ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                        onClick={() => setEditing(false)}
                                        className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
                                        disabled={saving}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Status</div>
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${ticket.status === 'open' ? 'bg-orange-100 text-orange-700' :
                                        ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                            ticket.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                                'bg-red-100 text-red-700'
                                        }`}>
                                        {getStatusLabel(ticket.status)}
                                    </span>
                                </div>
                                <div>
                                    <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Priority</div>
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${ticket.priority === 1 ? 'bg-red-100 text-red-700' :
                                        ticket.priority === 2 ? 'bg-orange-100 text-orange-700' :
                                            'bg-green-100 text-green-700'
                                        }`}>
                                        {getPriorityLabel(ticket.priority)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 p-6">
                        <h3 className="text-lg font-black text-slate-800 mb-4">People</h3>
                        <div className="space-y-4">
                            <div>
                                <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Reporter</div>
                                <div className="font-semibold text-slate-800">
                                    {ticket.reporter?.full_name || ticket.reporter_name || '-'}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Assigned To</div>
                                <div className="font-semibold text-slate-800">
                                    {ticket.assignee?.full_name || 'Unassigned'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 p-6">
                        <h3 className="text-lg font-black text-slate-800 mb-4">Timeline</h3>
                        <div className="space-y-4">
                            <div>
                                <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Created</div>
                                <div className="text-sm text-slate-600">{formatDate(ticket.created_at)}</div>
                            </div>
                            <div>
                                <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Last Updated</div>
                                <div className="text-sm text-slate-600">{formatDate(ticket.updated_at)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout >
    );
};

export default TicketDetail;
