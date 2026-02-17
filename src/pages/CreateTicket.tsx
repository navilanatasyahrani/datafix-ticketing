import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import SearchableSelect from '../components/SearchableSelect';
import { createTicket, addDetailLines, uploadAttachment } from '../services/ticketService';
import { getBranches, getAllFeatures, getRegions } from '../services/masterDataService';
import { useAuth } from '../contexts/AuthContext';
import { Branch, Feature, Region, UserRole } from '../types';

const CreateTicket: React.FC = () => {
    const { user, profile, userRole } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [branches, setBranches] = useState<Branch[]>([]);
    const [features, setFeatures] = useState<Feature[]>([]);
    const [regions, setRegions] = useState<Region[]>([]);
    const [screenshots, setScreenshots] = useState<File[]>([]);
    const [screenshotPreviews, setScreenshotPreviews] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        wrong_input_date: '',
        issue_type: '',
        branch_id: '',
        feature_id: '',
        feature_other: '',
        inputter_name: '',
        wrong_input_username: '',
        description: '',
        priority: 2,
        origin_region_id: '',
        target_team: '',
    });

    const [wrongDescription, setWrongDescription] = useState('');
    const [correctDescription, setCorrectDescription] = useState('');

    // Feature-specific fields
    const [refundNominal, setRefundNominal] = useState('');
    const [refundNamaPenerima, setRefundNamaPenerima] = useState('');
    const [refundNamaBank, setRefundNamaBank] = useState('');
    const [refundNoRek, setRefundNoRek] = useState('');
    const [makanbangEmail, setMakanbangEmail] = useState('');
    const [makanbangPosisi, setMakanbangPosisi] = useState('');

    // Get selected feature name
    const selectedFeatureName = features.find(f => f.id === formData.feature_id)?.name || '';

    useEffect(() => {
        loadMasterData();
    }, []);

    // Auto-fill branch and region from user profile
    useEffect(() => {
        if (profile) {
            setFormData(prev => ({
                ...prev,
                branch_id: prev.branch_id || profile.branch_id || '',
                origin_region_id: prev.origin_region_id || profile.region_id || '',
            }));
        }
    }, [profile]);

    const loadMasterData = async () => {
        const { data: branchesData } = await getBranches();
        const { data: featuresData } = await getAllFeatures();
        const { data: regionsData } = await getRegions();

        if (branchesData) setBranches(branchesData);
        if (featuresData) setFeatures(featuresData);
        if (regionsData) setRegions(regionsData);
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleScreenshotChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newFiles = Array.from(files);
        const validFiles = newFiles.filter(file => {
            const isImage = file.type.startsWith('image/');
            const isUnder5MB = file.size <= 5 * 1024 * 1024;
            return isImage && isUnder5MB;
        });

        if (validFiles.length !== newFiles.length) {
            setError('Beberapa file tidak valid. Hanya gambar dengan ukuran max 5MB yang diperbolehkan.');
            setTimeout(() => setError(''), 3000);
        }

        setScreenshots(prev => [...prev, ...validFiles]);

        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setScreenshotPreviews(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeScreenshot = (index: number) => {
        setScreenshots(prev => prev.filter((_, i) => i !== index));
        setScreenshotPreviews(prev => prev.filter((_, i) => i !== index));
    };

    // Build description with feature-specific data
    const buildDescription = () => {
        let desc = formData.description;

        if (selectedFeatureName === 'Refund Dana Customer') {
            if (refundNominal) {
                const formatted = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(refundNominal));
                desc += `\n\n[Nominal Refund Dana: ${formatted}]`;
            }
            if (refundNamaPenerima) desc += `\n[Nama Penerima: ${refundNamaPenerima}]`;
            if (refundNamaBank) desc += `\n[Bank: ${refundNamaBank}]`;
            if (refundNoRek) desc += `\n[No. Rekening: ${refundNoRek}]`;
        }

        if (selectedFeatureName === 'Akun Makanbang Staff') {
            if (makanbangEmail) desc += `\n\n[Email Makanbang: ${makanbangEmail}]`;
            if (makanbangPosisi) desc += `\n[Posisi: ${makanbangPosisi}]`;
        }

        return desc;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Screenshot upload is optional

            // Create detail lines from descriptions
            const detailLines = [];

            if (wrongDescription.trim()) {
                detailLines.push({
                    side: 'wrong' as const,
                    item_name: 'Deskripsi Salah',
                    value: wrongDescription.trim(),
                });
            }

            if (correctDescription.trim()) {
                detailLines.push({
                    side: 'expected' as const,
                    item_name: 'Deskripsi Benar',
                    value: correctDescription.trim(),
                });
            }

            if (detailLines.length === 0) {
                throw new Error('Minimal harus mengisi Deskripsi Salah atau Deskripsi Benar');
            }

            // Determine queue routing based on role
            let targetTeam = 'FIN_REGION';
            let currentQueue = 'FIN_ADMIN';
            if (userRole === UserRole.ACCOUNTING_HO) {
                targetTeam = formData.target_team || 'ACC_HO';
                // Map target_team to current_queue
                const queueMap: Record<string, string> = { ACC_HO: 'ACCOUNTING_HO', IT_SABANG: 'IT_SABANG' };
                currentQueue = queueMap[targetTeam] || 'ACCOUNTING_HO';
            }

            const ticketPayload: Record<string, any> = {
                wrong_input_date: formData.wrong_input_date,
                issue_type: formData.issue_type,
                branch_id: formData.branch_id,
                feature_id: formData.feature_id || null,
                feature_other: formData.feature_other || null,
                inputter_name: formData.inputter_name || null,
                wrong_input_username: formData.wrong_input_username || null,
                description: buildDescription(),
                priority: parseInt(formData.priority.toString()),
                reporter_user_id: user?.id,
                origin_region_id: formData.origin_region_id || null,
                target_team: targetTeam,
                current_queue: currentQueue,
            };

            const { data: ticket, error: ticketError } = await createTicket(ticketPayload);

            if (ticketError) throw ticketError;

            if (detailLines.length > 0 && ticket) {
                const { error: linesError } = await addDetailLines(ticket.id, detailLines);
                if (linesError) console.error("Error adding detail lines:", linesError);
                if (linesError) throw new Error(`Gagal menyimpan detail lines: ${(linesError as any).message || JSON.stringify(linesError)}`);
            }

            if (screenshots.length > 0 && ticket) {
                for (const file of screenshots) {
                    await uploadAttachment(ticket.id, file);
                }
            }

            setSuccess(true);
            setTimeout(() => {
                navigate('/tickets');
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'gagal membuat tiket');
            setLoading(false);
        }
    };

    if (success) {
        return (
            <Layout>
                <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-2xl max-w-2xl mx-auto flex items-center gap-3">
                    <span className="text-2xl">✅</span>
                    <span className="font-bold">Tiket berhasil dibuat! </span>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <main className="flex-1 max-w-[1100px] mx-auto w-full py-10 px-6">
                <div className="flex flex-col gap-8">
                    {/* Header */}
                    <div className="flex flex-col gap-1">
                        <h2 className="text-slate-900 text-2xl font-extrabold tracking-tight">
                            Buat Tiket Perbaikan Terperinci
                        </h2>
                        <p className="text-slate-500 text-sm">
                            Formulir pengajuan koreksi data sistem operasional terpadu.
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-center gap-3">
                            <span className="text-xl">⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Form Card */}
                    <div className="bg-white rounded-2xl shadow-soft border border-slate-200 p-8">
                        <form onSubmit={handleSubmit} className="flex flex-col gap-10">
                            {/* Basic Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                                {/* 1. Region */}
                                <div>
                                    <label className="form-label">Region</label>
                                    {profile?.region_id ? (
                                        <div className="w-full rounded-lg border border-slate-200 bg-slate-50 h-11 px-4 flex items-center text-sm text-slate-600">
                                            <span className="material-symbols-outlined text-[16px] text-slate-400 mr-2">lock</span>
                                            {regions.find(r => r.id === formData.origin_region_id)?.region_name || 'Memuat...'}
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <select
                                                name="origin_region_id"
                                                className="w-full rounded-lg border border-slate-200 bg-white h-11 px-4 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm appearance-none"
                                                value={formData.origin_region_id}
                                                onChange={(e) => setFormData(prev => ({ ...prev, origin_region_id: e.target.value, branch_id: '' }))}
                                            >
                                                <option value="">Pilih Region Asal</option>
                                                {regions.map(r => (
                                                    <option key={r.id} value={r.id}>{r.region_name}</option>
                                                ))}
                                            </select>
                                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                                expand_more
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* 2. Cabang */}
                                <div>
                                    <label className="form-label">Cabang</label>
                                    {profile?.branch_id ? (
                                        <div className="w-full rounded-lg border border-slate-200 bg-slate-50 h-11 px-4 flex items-center text-sm text-slate-600">
                                            <span className="material-symbols-outlined text-[16px] text-slate-400 mr-2">lock</span>
                                            {branches.find(b => b.id === formData.branch_id)?.name || 'Memuat...'}
                                        </div>
                                    ) : (
                                        <SearchableSelect
                                            options={formData.origin_region_id
                                                ? branches.filter(b => b.region_id === formData.origin_region_id)
                                                : branches
                                            }
                                            value={formData.branch_id}
                                            onChange={(value) => setFormData(prev => ({ ...prev, branch_id: value }))}
                                            placeholder="Pilih Cabang"
                                            required
                                            name="branch_id"
                                        />
                                    )}
                                </div>

                                {/* 3. Nama Penginput Perbaikan */}
                                <div>
                                    <label className="form-label">Nama Penginput Perbaikan</label>
                                    <input
                                        type="text"
                                        name="inputter_name"
                                        className="w-full rounded-lg border border-slate-200 h-11 px-4 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm"
                                        placeholder="Orang yang bertanggung jawab"
                                        value={formData.inputter_name}
                                        onChange={handleChange}
                                    />
                                </div>

                                {/* 4. Username yang Login (ketika input salah) */}
                                <div>
                                    <label className="form-label">Username yang Login (Ketika Input Salah)</label>
                                    <input
                                        type="text"
                                        name="wrong_input_username"
                                        className="w-full rounded-lg border border-slate-200 h-11 px-4 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm"
                                        placeholder="Contoh: spv_serdam"
                                        value={formData.wrong_input_username}
                                        onChange={handleChange}
                                    />
                                </div>

                                {/* 5. Tanggal Kesalahan */}
                                <div>
                                    <label className="form-label">Tanggal Input Salah</label>
                                    <input
                                        type="date"
                                        name="wrong_input_date"
                                        className="w-full rounded-lg border border-slate-200 h-11 px-4 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm"
                                        value={formData.wrong_input_date}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                {/* 5. Tipe Issue */}
                                <div>
                                    <label className="form-label">Tipe Isu</label>
                                    <div className="relative">
                                        <select
                                            name="issue_type"
                                            className="w-full rounded-lg border border-slate-200 bg-white h-11 px-4 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm appearance-none"
                                            value={formData.issue_type}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="">Pilih Tipe Isu</option>
                                            <option value="data_entry_error">Kesalahan Entri Data</option>
                                            <option value="system_bug">Bug Sistem / Error</option>
                                            <option value="missing_data">Data Hilang</option>
                                            <option value="incorrect_calculation">Kesalahan Perhitungan</option>
                                            <option value="other">Lainnya</option>
                                        </select>
                                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                            expand_more
                                        </span>
                                    </div>
                                </div>

                                {/* 6. Fitur Utama */}
                                <div>
                                    <label className="form-label">Fitur Utama</label>
                                    <SearchableSelect
                                        options={features}
                                        value={formData.feature_id}
                                        onChange={(value) => setFormData(prev => ({ ...prev, feature_id: value }))}
                                        placeholder="Pilih Fitur"
                                        required
                                        name="feature_id"
                                    />
                                </div>

                                {/* Custom Feature Input - shown when "Lainnya" is selected */}
                                {features.find(f => f.id === formData.feature_id)?.name === 'Lainnya' && (
                                    <div>
                                        <label className="form-label">Sebutkan Fitur Lainnya</label>
                                        <input
                                            type="text"
                                            name="feature_other"
                                            className="w-full rounded-lg border border-slate-200 h-11 px-4 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm"
                                            placeholder="Ketik nama fitur yang dimaksud"
                                            value={formData.feature_other}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                )}

                                {/* Refund Dana Customer */}
                                {selectedFeatureName === 'Refund Dana Customer' && (
                                    <>
                                        <div>
                                            <label className="form-label">Nominal Refund Dana</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">Rp</span>
                                                <input
                                                    type="text"
                                                    className="w-full rounded-lg border border-slate-200 h-11 pl-10 pr-4 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm"
                                                    placeholder="Contoh: 150000"
                                                    value={refundNominal}
                                                    onChange={(e) => setRefundNominal(e.target.value.replace(/[^0-9]/g, ''))}
                                                    required
                                                />
                                            </div>
                                            {refundNominal && (
                                                <p className="text-xs text-slate-400 mt-1">
                                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(refundNominal))}
                                                </p>
                                            )}
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="form-label">Informasi Rekening untuk Refund</label>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <input
                                                        type="text"
                                                        className="w-full rounded-lg border border-slate-200 h-11 px-4 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm"
                                                        placeholder="Nama Penerima"
                                                        value={refundNamaPenerima}
                                                        onChange={(e) => setRefundNamaPenerima(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <input
                                                        type="text"
                                                        className="w-full rounded-lg border border-slate-200 h-11 px-4 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm"
                                                        placeholder="Nama Bank (contoh: BCA, BNI)"
                                                        value={refundNamaBank}
                                                        onChange={(e) => setRefundNamaBank(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <input
                                                        type="text"
                                                        className="w-full rounded-lg border border-slate-200 h-11 px-4 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm"
                                                        placeholder="No. Rekening"
                                                        value={refundNoRek}
                                                        onChange={(e) => setRefundNoRek(e.target.value.replace(/[^0-9]/g, ''))}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-400 mt-2">Tulis data rekening secara lengkap dan benar untuk proses refund</p>
                                        </div>
                                    </>
                                )}

                                {/* Akun Makanbang Staff - Email & Posisi */}
                                {selectedFeatureName === 'Akun Makanbang Staff' && (
                                    <>
                                        <div>
                                            <label className="form-label">Email Akun Makanbang</label>
                                            <input
                                                type="email"
                                                className="w-full rounded-lg border border-slate-200 h-11 px-4 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm"
                                                placeholder="email@contoh.com"
                                                value={makanbangEmail}
                                                onChange={(e) => setMakanbangEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label">Posisi</label>
                                            <input
                                                type="text"
                                                className="w-full rounded-lg border border-slate-200 h-11 px-4 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm"
                                                placeholder="Contoh: Waiter, Kasir, Superuser"
                                                value={makanbangPosisi}
                                                onChange={(e) => setMakanbangPosisi(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </>
                                )}

                                {/* 7. Tingkat Prioritas */}
                                <div>
                                    <label className="form-label">Tingkat Prioritas</label>
                                    <div className="relative">
                                        <select
                                            name="priority"
                                            className="w-full rounded-lg border border-slate-200 bg-white h-11 px-4 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm appearance-none"
                                            value={formData.priority}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="3">Rendah</option>
                                            <option value="2">Sedang</option>
                                            <option value="1">Tinggi</option>
                                        </select>
                                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                            expand_more
                                        </span>
                                    </div>
                                </div>
                                {/* 8. Tim Tujuan - only for ACCOUNTING_HO */}
                                {userRole === UserRole.ACCOUNTING_HO && (
                                    <div>
                                        <label className="form-label">Tim Tujuan</label>
                                        <div className="relative">
                                            <select
                                                name="target_team"
                                                className="w-full rounded-lg border border-slate-200 bg-white h-11 px-4 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm appearance-none"
                                                value={formData.target_team}
                                                onChange={handleChange}
                                            >
                                                <option value="ACC_HO">Accounting HO</option>
                                                <option value="IT_SABANG">IT Sabang</option>
                                            </select>
                                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                                expand_more
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* 9. Deskripsi Permasalahan */}
                                <div className="md:col-span-2">
                                    <label className="form-label">Deskripsi Permasalahan</label>
                                    <textarea
                                        name="description"
                                        className="w-full min-h-[120px] rounded-lg border border-slate-200 p-4 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm"
                                        placeholder="Jelaskan secara detail kronologi dan alasan perbaikan data..."
                                        value={formData.description}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Detail Descriptions Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                                    <span className="material-symbols-outlined text-primary">description</span>
                                    <h3 className="text-slate-900 text-base font-bold uppercase tracking-wide">
                                        Detail Perbaikan Data
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Wrong Description */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="size-2 rounded-full bg-red-500"></span>
                                            <label className="text-red-600 text-xs font-bold uppercase tracking-widest">
                                                Data Salah (Sebelum)
                                            </label>
                                        </div>
                                        <textarea
                                            className="w-full min-h-[140px] rounded-xl border border-slate-200 p-4 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all text-sm resize-none"
                                            placeholder="Data salah yang perlu diubah, contoh : bayam 4 ikat"
                                            value={wrongDescription}
                                            onChange={(e) => setWrongDescription(e.target.value)}
                                        />
                                    </div>

                                    {/* Correct Description */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="size-2 rounded-full bg-green-500"></span>
                                            <label className="text-green-600 text-xs font-bold uppercase tracking-widest">
                                                Data Benar (Sesudah)
                                            </label>
                                        </div>
                                        <textarea
                                            className="w-full min-h-[140px] rounded-xl border border-slate-200 p-4 focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all text-sm resize-none"
                                            placeholder="Data benar yang seharusnya, contoh : bayam 7 ikat"
                                            value={correctDescription}
                                            onChange={(e) => setCorrectDescription(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Screenshot Upload Section */}
                            <div className="space-y-5">
                                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                                    <span className="material-symbols-outlined text-primary">photo_camera</span>
                                    <h3 className="text-slate-900 text-base font-bold uppercase tracking-wide">
                                        Unggah Foto Bukti
                                    </h3>
                                </div>

                                <div className="flex flex-col gap-4">
                                    {/* Upload Area */}
                                    <div className="relative group flex flex-col items-center justify-center w-full min-h-[180px] border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 hover:bg-slate-50 hover:border-primary/50 transition-all cursor-pointer">
                                        <input
                                            type="file"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            accept="image/*"
                                            multiple
                                            onChange={handleScreenshotChange}
                                        />
                                        <div className="flex flex-col items-center gap-3 p-6 text-center">
                                            <div className="size-14 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <span className="material-symbols-outlined text-[32px]">cloud_upload</span>
                                            </div>
                                            <div>
                                                <p className="text-[15px] font-bold text-slate-700">
                                                    Tarik dan lepas file di sini
                                                </p>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    Hanya format JPG, PNG (Maks. 5MB per file)
                                                </p>
                                            </div>
                                            <div className="mt-2 px-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 shadow-sm">
                                                Pilih Berkas
                                            </div>
                                        </div>
                                    </div>

                                    {/* Screenshot Previews */}
                                    {screenshotPreviews.length > 0 && (
                                        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-4">
                                            {screenshotPreviews.map((preview, index) => (
                                                <div
                                                    key={index}
                                                    className="aspect-square rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-400 relative overflow-hidden group shadow-sm"
                                                >
                                                    <img
                                                        src={preview}
                                                        alt={`Screenshot ${index + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeScreenshot(index)}
                                                            className="text-white hover:text-red-400"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer Section */}
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-slate-100">
                                {/* Disclaimer */}
                                <div className="flex items-start gap-4 max-w-lg">
                                    <div className="size-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-amber-500">warning</span>
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-bold text-slate-800">Pernyataan Validitas Data</p>
                                        <p className="text-[12px] text-slate-500 leading-relaxed">
                                            Dengan mengirim tiket ini, saya menyatakan bahwa data perbaikan yang diajukan
                                            telah diverifikasi sesuai dengan dokumen fisik pendukung.
                                        </p>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 w-full md:w-auto">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/tickets')}
                                        className="px-8 h-12 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all flex-1 md:flex-none"
                                        disabled={loading}
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white px-10 h-12 text-sm font-bold transition-all shadow-lg shadow-primary/20 active:scale-95 flex-1 md:flex-none disabled:opacity-50"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                <span>Mengirim...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-[18px]">send</span>
                                                Kirim Tiket
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Footer Copyright */}
                    <div className="text-center py-4">
                        <p className="text-[12px] text-slate-400">
                            © {new Date().getFullYear()} PT Sabang Digital Indonesia. All Rights Reserved.
                        </p>
                    </div>
                </div>
            </main>
        </Layout>
    );
};

export default CreateTicket;
