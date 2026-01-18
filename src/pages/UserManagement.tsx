import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getAllUsers, updateUserProfile } from '../services/userService';
import { getBranches } from '../services/masterDataService';
import { Profile, Branch, UserRole } from '../types';
import { format } from 'date-fns';

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<Profile[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<Profile | null>(null);
    const [updateLoading, setUpdateLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [usersRes, branchesRes] = await Promise.all([
            getAllUsers(),
            getBranches()
        ]);

        if (usersRes.data) setUsers(usersRes.data as unknown as Profile[]);
        if (branchesRes.data) setBranches(branchesRes.data);
        setLoading(false);
    };

    const handleEdit = (user: Profile) => {
        setEditingUser(user);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        setUpdateLoading(true);
        const { error } = await updateUserProfile(editingUser.id, {
            full_name: editingUser.full_name,
            role: editingUser.role,
            branch_id: editingUser.branch_id
        });

        if (!error) {
            await loadData();
            setEditingUser(null);
        } else {
            alert('Failed to update user: ' + error.message);
        }
        setUpdateLoading(false);
    };

    const openSupabaseDashboard = () => {
        window.open('https://supabase.com/dashboard/project/icsdsvzmbfrfpzygicfo/auth/users', '_blank');
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <main className="max-w-[1200px] mx-auto px-6 py-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Manajemen User</h1>
                        <p className="text-slate-500 mt-1">Kelola akses dan data profil pengguna sistem.</p>
                    </div>
                    <button
                        onClick={openSupabaseDashboard}
                        className="flex items-center gap-2 px-5 h-11 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                    >
                        <span className="material-symbols-outlined text-[20px]">person_add</span>
                        <span>Tambah User Baru</span>
                    </button>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex items-start gap-3">
                    <span className="material-symbols-outlined text-amber-600">info</span>
                    <div>
                        <p className="text-sm font-bold text-amber-800">Informasi Pembuatan User</p>
                        <p className="text-sm text-amber-700 mt-1">
                            Untuk alasan keamanan, pembuatan akun login baru hanya dapat dilakukan melalui Supabase Dashboard.
                            Silakan klik tombol "Tambah User Baru" di atas, buat user di sana, lalu kembali ke sini untuk mengatur Cabang dan Role.
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User Info</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cabang</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Terdaftar Sejak</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                                                {user.full_name?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{user.full_name || 'No Name'}</p>
                                                <p className="text-xs text-slate-400 font-mono max-w-[150px] truncate" title={user.id}>{user.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${user.role === 'admin'
                                            ? 'bg-purple-100 text-purple-700'
                                            : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {user.role === 'admin' ? 'Super Admin' : 'Requester'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-sm font-medium ${user.branch ? 'text-slate-700' : 'text-slate-400 italic'}`}>
                                            {user.branch?.name || 'Belum Set'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {user.created_at ? format(new Date(user.created_at), 'dd MMM yyyy') : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleEdit(user)}
                                            className="text-blue-600 hover:text-blue-700 font-bold text-sm"
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-6">Edit User</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Nama Lengkap</label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                                    value={editingUser.full_name}
                                    onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Role</label>
                                <select
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white"
                                    value={editingUser.role}
                                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                                >
                                    <option value={UserRole.REQUESTER}>Requester</option>
                                    <option value={UserRole.ADMIN}>Super Admin</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Cabang</label>
                                <select
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white"
                                    value={editingUser.branch_id || ''}
                                    onChange={(e) => setEditingUser({ ...editingUser, branch_id: e.target.value })}
                                >
                                    <option value="">-- Pilih Cabang --</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={updateLoading}
                                    className="flex-1 px-4 py-2 bg-blue-600 rounded-lg font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {updateLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default UserManagement;
