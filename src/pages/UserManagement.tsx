import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getAllUsers, updateUserProfile, createUser } from '../services/userService';
import { getRegions } from '../services/masterDataService';
import { Profile, UserRole, Region, ROLE_LABELS } from '../types';
import { format } from 'date-fns';

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<Profile[]>([]);
    const [regions, setRegions] = useState<Region[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<Profile | null>(null);
    const [updateLoading, setUpdateLoading] = useState(false);

    // Create User State
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [newUser, setNewUser] = useState({
        email: '',
        password: '',
        full_name: '',
        role: UserRole.OUTLET
    });
    const [createLoading, setCreateLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const { data } = await getAllUsers();
        const { data: regionsData } = await getRegions();
        if (data) setUsers(data as unknown as Profile[]);
        if (regionsData) setRegions(regionsData);
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
            region_id: editingUser.region_id || undefined,
        });

        if (!error) {
            await loadData();
            setEditingUser(null);
        } else {
            alert('Failed to update user: ' + error.message);
        }
        setUpdateLoading(false);
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUser.email || !newUser.password || !newUser.full_name) {
            alert('Please fill in all fields');
            return;
        }

        setCreateLoading(true);
        const { error } = await createUser(newUser);

        if (!error) {
            alert('User created successfully!');
            await loadData();
            setCreateModalOpen(false);
            setNewUser({ email: '', password: '', full_name: '', role: UserRole.OUTLET });
        } else {
            alert('Failed to create user: ' + error.message);
        }
        setCreateLoading(false);
    };

    const getRoleBadgeStyle = (role: string) => {
        switch (role) {
            case UserRole.ADMIN: return 'bg-purple-100 text-purple-700';
            case UserRole.ACCOUNTING_HO: return 'bg-blue-100 text-blue-700';
            case UserRole.FIN_ADMIN: return 'bg-emerald-100 text-emerald-700';
            case UserRole.IT_SABANG: return 'bg-amber-100 text-amber-700';
            case UserRole.OUTLET: return 'bg-sky-100 text-sky-700';
            default: return 'bg-gray-100 text-gray-700';
        }
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
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User Info</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Region</th>
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
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getRoleBadgeStyle(user.role)}`}>
                                                {ROLE_LABELS[user.role] || user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {user.region?.region_name || '-'}
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
                </div>
            </main>

            {/* Edit User Modal */}
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
                                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Region</label>
                                <select
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white"
                                    value={editingUser.region_id || ''}
                                    onChange={(e) => setEditingUser({ ...editingUser, region_id: e.target.value || undefined })}
                                >
                                    <option value="">Tidak ada region</option>
                                    {regions.map(r => (
                                        <option key={r.id} value={r.id}>{r.region_name}</option>
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

            {/* Create User Modal */}
            {createModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-6">Tambah User Baru</h2>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Nama Lengkap</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                                    value={newUser.full_name}
                                    onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Role</label>
                                <select
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white"
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                                >
                                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setCreateModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={createLoading}
                                    className="flex-1 px-4 py-2 bg-slate-900 rounded-lg font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                                >
                                    {createLoading ? 'Membuat...' : 'Buat User'}
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
