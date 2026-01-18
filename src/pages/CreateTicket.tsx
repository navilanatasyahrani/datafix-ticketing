import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { createTicket, addDetailLines, uploadAttachment } from '../services/ticketService';
import { getBranches, getAllFeatures } from '../services/masterDataService';
import { useAuth } from '../contexts/AuthContext';
import { Branch, Feature } from '../types';

interface DetailLineItem {
    item_name: string;
    value: string;
}

const CreateTicket: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [branches, setBranches] = useState<Branch[]>([]);
    const [features, setFeatures] = useState<Feature[]>([]);
    const [screenshots, setScreenshots] = useState<File[]>([]);
    const [screenshotPreviews, setScreenshotPreviews] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        wrong_input_date: '',
        issue_type: '',
        branch_id: '',
        feature_id: '',
        feature_other: '',
        inputter_name: '',
        description: '',
        priority: 2,
    });

    const [wrongDataLines, setWrongDataLines] = useState<DetailLineItem[]>([
        { item_name: '', value: '' }
    ]);

    const [correctDataLines, setCorrectDataLines] = useState<DetailLineItem[]>([
        { item_name: '', value: '' }
    ]);

    useEffect(() => {
        loadMasterData();
    }, []);

    const loadMasterData = async () => {
        const { data: branchesData } = await getBranches();
        const { data: featuresData } = await getAllFeatures();

        if (branchesData) setBranches(branchesData);
        if (featuresData) setFeatures(featuresData);
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleWrongDataChange = (index: number, field: keyof DetailLineItem, value: string) => {
        const newLines = [...wrongDataLines];
        newLines[index][field] = value;
        setWrongDataLines(newLines);
    };

    const handleCorrectDataChange = (index: number, field: keyof DetailLineItem, value: string) => {
        const newLines = [...correctDataLines];
        newLines[index][field] = value;
        setCorrectDataLines(newLines);
    };

    const addNewRow = () => {
        setWrongDataLines([...wrongDataLines, { item_name: '', value: '' }]);
        setCorrectDataLines([...correctDataLines, { item_name: '', value: '' }]);
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

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (screenshots.length === 0) {
                throw new Error('Minimal harus upload 1 screenshot data yang salah');
            }

            // Combine wrong and correct data lines
            const detailLines = [];
            for (let i = 0; i < Math.max(wrongDataLines.length, correctDataLines.length); i++) {
                if (wrongDataLines[i]?.item_name.trim() && wrongDataLines[i]?.value.trim()) {
                    detailLines.push({
                        side: 'wrong' as const,
                        item_name: wrongDataLines[i].item_name,
                        value: wrongDataLines[i].value,
                    });
                }
                if (correctDataLines[i]?.item_name.trim() && correctDataLines[i]?.value.trim()) {
                    detailLines.push({
                        side: 'expected' as const,
                        item_name: correctDataLines[i].item_name,
                        value: correctDataLines[i].value,
                    });
                }
            }

            if (detailLines.length === 0) {
                throw new Error('Minimal harus ada 1 detail line dengan Item Name dan Value yang terisi');
            }

            const ticketPayload = {
                ...formData,
                reporter_user_id: user?.id,
                priority: parseInt(formData.priority.toString()),
            };

            const { data: ticket, error: ticketError } = await createTicket(ticketPayload);

            if (ticketError) throw ticketError;

            if (detailLines.length > 0 && ticket) {
                const { error: linesError } = await addDetailLines(ticket.id, detailLines);
                if (linesError) console.error("Error adding detail lines:", linesError);
                if (linesError) throw new Error(`Gagal menyimpan detail lines: ${linesError.message || JSON.stringify(linesError)}`);
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
            setError(err.message || 'Failed to create ticket');
            setLoading(false);
        }
    };

    if (success) {
        return (
            <Layout>
                <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-2xl max-w-2xl mx-auto flex items-center gap-3">
                    <span className="text-2xl">✅</span>
                    <span className="font-bold">Ticket created successfully! Redirecting...</span>
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
                                {/* Wrong Input Date */}
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

                                {/* Issue Type */}
                                <div>
                                    <label className="form-label">Tipe Isu</label>
                                    <div className="relative">
                                        <select
                                            name="issue_type"
                                            className="w-full rounded-lg border border-slate-200 h-11 px-4 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm appearance-none"
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

                                {/* Branch */}
                                <div>
                                    <label className="form-label">Cabang</label>
                                    <div className="relative">
                                        <select
                                            name="branch_id"
                                            className="w-full rounded-lg border border-slate-200 h-11 px-4 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm appearance-none"
                                            value={formData.branch_id}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="">Pilih Cabang</option>
                                            {branches.map(branch => (
                                                <option key={branch.id} value={branch.id}>{branch.name}</option>
                                            ))}
                                        </select>
                                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                            expand_more
                                        </span>
                                    </div>
                                </div>

                                {/* Feature */}
                                <div>
                                    <label className="form-label">Fitur Utama</label>
                                    <div className="relative">
                                        <select
                                            name="feature_id"
                                            className="w-full rounded-lg border border-slate-200 h-11 px-4 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm appearance-none"
                                            value={formData.feature_id}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="">Pilih Fitur</option>
                                            {features.map(feat => (
                                                <option key={feat.id} value={feat.id}>{feat.name}</option>
                                            ))}
                                        </select>
                                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                            expand_more
                                        </span>
                                    </div>
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

                                {/* Inputter Name */}
                                <div>
                                    <label className="form-label">User yang login (ketika salah input)</label>
                                    <input
                                        type="text"
                                        name="inputter_name"
                                        className="w-full rounded-lg border border-slate-200 h-11 px-4 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm"
                                        placeholder="Nama petugas yang salah input"
                                        value={formData.inputter_name}
                                        onChange={handleChange}
                                    />
                                </div>

                                {/* Priority */}
                                <div>
                                    <label className="form-label">Tingkat Prioritas</label>
                                    <div className="relative">
                                        <select
                                            name="priority"
                                            className="w-full rounded-lg border border-slate-200 h-11 px-4 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm appearance-none"
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

                                {/* Description */}
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

                            {/* Detail Lines Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                                    <span className="material-symbols-outlined text-primary">analytics</span>
                                    <h3 className="text-slate-900 text-base font-bold uppercase tracking-wide">
                                        Detail Baris Perbaikan
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Wrong Data Table */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 px-1">
                                            <span className="size-2 rounded-full bg-red-500"></span>
                                            <span className="text-red-600 text-[11px] font-bold uppercase tracking-widest">
                                                Data Salah (Sebelum)
                                            </span>
                                        </div>
                                        <div className="overflow-hidden rounded-xl border border-slate-200">
                                            <table className="w-full">
                                                <thead>
                                                    <tr>
                                                        <th className="table-header w-2/3">NAMA ITEM</th>
                                                        <th className="table-header w-1/3 text-center border-l border-slate-200">QTY</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {wrongDataLines.map((line, index) => (
                                                        <tr key={index}>
                                                            <td className="table-cell">
                                                                <input
                                                                    type="text"
                                                                    className="w-full border-none bg-transparent p-0 focus:ring-0 text-sm placeholder-slate-300"
                                                                    placeholder="Input item..."
                                                                    value={line.item_name}
                                                                    onChange={(e) => handleWrongDataChange(index, 'item_name', e.target.value)}
                                                                />
                                                            </td>
                                                            <td className="table-cell border-l border-slate-200">
                                                                <input
                                                                    type="text"
                                                                    className="w-full border-none bg-transparent p-0 focus:ring-0 text-sm text-center placeholder-slate-300"
                                                                    placeholder="0"
                                                                    value={line.value}
                                                                    onChange={(e) => handleWrongDataChange(index, 'value', e.target.value)}
                                                                />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Correct Data Table */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 px-1">
                                            <span className="size-2 rounded-full bg-green-500"></span>
                                            <span className="text-green-600 text-[11px] font-bold uppercase tracking-widest">
                                                Data Benar (Sesudah)
                                            </span>
                                        </div>
                                        <div className="overflow-hidden rounded-xl border border-slate-200">
                                            <table className="w-full">
                                                <thead>
                                                    <tr>
                                                        <th className="table-header w-2/3">NAMA ITEM</th>
                                                        <th className="table-header w-1/3 text-center border-l border-slate-200">QTY</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {correctDataLines.map((line, index) => (
                                                        <tr key={index}>
                                                            <td className="table-cell">
                                                                <input
                                                                    type="text"
                                                                    className="w-full border-none bg-transparent p-0 focus:ring-0 text-sm placeholder-slate-300"
                                                                    placeholder="Input item..."
                                                                    value={line.item_name}
                                                                    onChange={(e) => handleCorrectDataChange(index, 'item_name', e.target.value)}
                                                                />
                                                            </td>
                                                            <td className="table-cell border-l border-slate-200">
                                                                <input
                                                                    type="text"
                                                                    className="w-full border-none bg-transparent p-0 focus:ring-0 text-sm text-center placeholder-slate-300"
                                                                    placeholder="0"
                                                                    value={line.value}
                                                                    onChange={(e) => handleCorrectDataChange(index, 'value', e.target.value)}
                                                                />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                {/* Add Row Button */}
                                <button
                                    type="button"
                                    onClick={addNewRow}
                                    className="mt-2 flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all text-sm font-semibold"
                                >
                                    <span className="material-symbols-outlined text-[20px]">add_circle</span>
                                    Tambah Baris Baru
                                </button>
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
                            © 2024 DataCare. Layanan Pelaporan Koreksi Data Terpadu Versi 2.1.0-Release.
                        </p>
                    </div>
                </div>
            </main>
        </Layout>
    );
};

export default CreateTicket;
