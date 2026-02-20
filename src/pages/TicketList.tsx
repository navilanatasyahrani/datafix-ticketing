import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { getTickets, getTicketStats, updateTicket } from "../services/ticketService";
import { getBranches, getRegions } from "../services/masterDataService";
import { ASSIGNEES } from "../constants/assignees";
import { useAuth } from "../contexts/AuthContext";
import { Ticket, TicketStatus, Region, Branch, UserRole } from "../types";
import { format } from "date-fns";
import * as XLSX from "xlsx";

const TEAM_LABELS: Record<string, string> = {
  FIN_REGION: 'Finance Region',
  ACC_HO: 'Accounting HO',
  IT_SABANG: 'IT Sabang',
};

interface Stats {
  total_tickets: number;
  open_tickets: number;
  in_progress_tickets: number;
  resolved_tickets: number;
  rejected_tickets: number;
}

const TicketList: React.FC = () => {
  const { isAdmin, canManageTickets, userRole } = useAuth();
  const navigate = useNavigate();
  const showTeamColumn = isAdmin || userRole === UserRole.FIN_ADMIN || userRole === UserRole.ACCOUNTING_HO;
  const showAssignedColumn = isAdmin || userRole === UserRole.IT_SABANG;
  // Role-based filter visibility
  const showRegionFilter = isAdmin || userRole === UserRole.ACCOUNTING_HO || userRole === UserRole.IT_SABANG;
  const showTeamFilter = isAdmin || userRole === UserRole.FIN_ADMIN || userRole === UserRole.ACCOUNTING_HO;
  const showBranchFilter = userRole === UserRole.OUTLET;
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Count active filters for badge (only count visible filters)
  const activeFilterCount = [
    statusFilter, priorityFilter, dateFrom, dateTo,
    ...(showRegionFilter ? [regionFilter] : []),
    ...(showTeamFilter ? [teamFilter] : []),
    ...(showBranchFilter ? [branchFilter] : []),
  ].filter(Boolean).length;

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTickets.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, statusFilter, priorityFilter, regionFilter, teamFilter, branchFilter, dateFrom, dateTo, tickets]);

  const loadData = async () => {
    setLoading(true);

    const { data: ticketsData } = await getTickets();
    const { data: statsData } = await getTicketStats();
    const { data: regionsData } = await getRegions();
    const { data: branchesData } = await getBranches();

    if (ticketsData) {
      // Filter tickets based on user role
      let roleFilteredTickets = ticketsData;
      if (userRole === UserRole.ACCOUNTING_HO) {
        // Accounting sees tickets targeted to ACC_HO or redirected to IT_SABANG
        roleFilteredTickets = ticketsData.filter(t => t.target_team === 'ACC_HO' || t.target_team === 'IT_SABANG');
      } else if (userRole === UserRole.IT_SABANG) {
        roleFilteredTickets = ticketsData.filter(t => t.target_team === 'IT_SABANG');
      }
      // FIN_ADMIN, admin, and OUTLET see all (OUTLET is filtered by RLS)
      setTickets(roleFilteredTickets);
      setFilteredTickets(roleFilteredTickets);
    }

    if (branchesData) {
      setBranches(branchesData);
    }

    if (regionsData) {
      setRegions(regionsData);
    }

    if (statsData) {
      // Map backend pending_tickets to open_tickets
      const mappedStats = {
        ...statsData,
        open_tickets: (statsData as any).pending_tickets || (statsData as any).open_tickets || 0,
        total_tickets: (statsData as any).total_tickets || 0,
        in_progress_tickets: (statsData as any).in_progress_tickets || 0,
        resolved_tickets: (statsData as any).resolved_tickets || (statsData as any).done || 0,
        rejected_tickets: (statsData as any).rejected_tickets || 0,
      };
      setStats(mappedStats as Stats);
    } else {
      console.error("Failed to load ticket stats. Check API permissions or response format.");
    }

    setLoading(false);
  };



  const handleAssigneeChange = async (ticketId: string, newAssignee: string) => {
    // Optimistic update
    const updatedTickets = tickets.map(t =>
      t.id === ticketId
        ? { ...t, assigned_to: newAssignee }
        : t
    );
    setTickets(updatedTickets);
    setFilteredTickets(prev => prev.map(t =>
      t.id === ticketId
        ? { ...t, assigned_to: newAssignee }
        : t
    ));

    const { error } = await updateTicket(ticketId, { assigned_to: newAssignee || undefined });

    if (error) {
      alert("Gagal mengupdate Nama Penginput Perbaikan");
      loadData(); // Revert on failure
    }
  };

  const applyFilters = () => {
    let filtered = [...tickets];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.id.toLowerCase().includes(query) ||
          t.feature?.name?.toLowerCase().includes(query) ||
          t.feature_other?.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query),
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter) {
      filtered = filtered.filter(
        (t) => t.priority === parseInt(priorityFilter),
      );
    }

    // Region filter (origin region)
    if (regionFilter) {
      filtered = filtered.filter((t) => t.origin_region_id === regionFilter);
    }

    // Team filter
    if (teamFilter) {
      filtered = filtered.filter((t) => t.target_team === teamFilter);
    }

    // Branch filter
    if (branchFilter) {
      filtered = filtered.filter((t) => t.branch_id === branchFilter);
    }

    // Date range filter (based on created_at)
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      filtered = filtered.filter((t) => new Date(t.created_at) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter((t) => new Date(t.created_at) <= to);
    }

    setFilteredTickets(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const exportToExcel = () => {
    const statusLabel = (s: string) => {
      switch (s) {
        case 'open': return 'Dalam Antrean';
        case 'in_progress': return 'Sedang Diproses';
        case 'done': return 'Selesai';
        case 'rejected': return 'Ditolak';
        default: return s;
      }
    };
    const priorityLabel = (p: number) => {
      switch (p) {
        case 1: return 'Tinggi';
        case 2: return 'Sedang';
        case 3: return 'Rendah';
        default: return String(p);
      }
    };

    const data = filteredTickets.map(t => ({
      'ID Tiket': t.id,
      'Fitur': (t.feature?.name === 'Lainnya' ? t.feature_other : t.feature?.name) || t.feature_other || '-',
      'Status': statusLabel(t.status),
      'Prioritas': priorityLabel(t.priority),
      'Cabang': t.branch?.name || '-',
      'Region': t.origin_region?.region_name || '-',
      'Tim': t.target_team ? (TEAM_LABELS[t.target_team] || t.target_team) : '-',
      'PIC': t.inputter_name || '-',
      'Tanggal Dibuat': format(new Date(t.created_at), 'dd/MM/yyyy'),
      'Deskripsi': (t.description || '').replace(/[\n\r]+/g, ' '),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    // Auto-fit column widths
    ws['!cols'] = [
      { wch: 38 }, // ID Tiket
      { wch: 25 }, // Fitur
      { wch: 16 }, // Status
      { wch: 10 }, // Prioritas
      { wch: 20 }, // Cabang
      { wch: 15 }, // Region
      { wch: 18 }, // Tim
      { wch: 20 }, // PIC
      { wch: 14 }, // Tanggal Dibuat
      { wch: 50 }, // Deskripsi
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Progress Tiket');
    XLSX.writeFile(wb, `tiket-progress-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
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

  return (
    <Layout>
      <main className="flex flex-1 justify-center py-6 md:py-10 px-4 md:px-6">
        <div className="layout-content-container flex flex-col max-w-[1200px] flex-1 gap-4 md:gap-6">
          {/* Page Heading */}
          <div className="flex flex-wrap justify-between items-end gap-3">
            <div className="flex flex-col gap-1 md:gap-2">
              <h1 className="text-[#111418] text-2xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
                Progress Tiket Perbaikan
              </h1>
              <p className="text-[#60758a] text-sm md:text-base font-normal leading-normal">
                Pantau status pengajuan koreksi data Anda secara real-time.
              </p>
            </div>
          </div>

          {/* Statistics Summary */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mt-1 md:mt-2">
            <div className="col-span-2 md:col-span-1 p-3 md:p-4 bg-white rounded-xl shadow-sm border border-[#e5e7eb]">
              <p className="text-xs font-bold text-[#60758a] uppercase tracking-wider mb-1">
                Total Tiket
              </p>
              <p className="text-xl md:text-2xl font-black text-[#111418]">
                {stats?.total_tickets || 0}
              </p>
            </div>
            <div className="p-3 md:p-4 bg-white rounded-xl shadow-sm border border-[#e5e7eb]">
              <p className="text-xs font-bold text-[#60758a] uppercase tracking-wider mb-1">
                Dalam Antrean
              </p>
              <p className="text-xl md:text-2xl font-black text-[#111418]">
                {stats?.open_tickets || 0}
              </p>
            </div>
            <div className="p-3 md:p-4 bg-white rounded-xl shadow-sm border border-[#e5e7eb]">
              <p className="text-xs font-bold text-[#60758a] uppercase tracking-wider mb-1">
                Diproses
              </p>
              <p className="text-xl md:text-2xl font-black text-primary">
                {stats?.in_progress_tickets || 0}
              </p>
            </div>
            <div className="p-3 md:p-4 bg-white rounded-xl shadow-sm border border-[#e5e7eb]">
              <p className="text-xs font-bold text-[#60758a] uppercase tracking-wider mb-1">
                Selesai
              </p>
              <p className="text-xl md:text-2xl font-black text-green-600">
                {stats?.resolved_tickets || 0}
              </p>
            </div>
            <div className="p-3 md:p-4 bg-white rounded-xl shadow-sm border border-[#e5e7eb]">
              <p className="text-xs font-bold text-[#60758a] uppercase tracking-wider mb-1">
                Ditolak
              </p>
              <p className="text-xl md:text-2xl font-black text-rose-600">
                {stats?.rejected_tickets || 0}
              </p>
            </div>
          </div>

          {/* Search and Filters Section */}
          <div className="bg-white rounded-xl shadow-sm border border-[#e5e7eb] p-3 md:p-4">
            <div className="flex flex-col md:flex-row gap-3 md:gap-4">
              {/* Search Bar */}
              <div className="flex-1">
                <label className="flex flex-col w-full">
                  <div className="flex w-full items-stretch rounded-lg h-10 md:h-11 border border-[#e5e7eb] overflow-hidden">
                    <div className="text-[#60758a] flex bg-[#f0f2f5] items-center justify-center px-3 md:px-4">
                      <span className="material-symbols-outlined text-[20px]">
                        search
                      </span>
                    </div>
                    <input
                      className="form-input flex w-full border-none bg-white text-[#111418] focus:ring-0 px-3 md:px-4 text-sm font-normal"
                      placeholder="Cari ID Tiket atau Fitur..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </label>
              </div>

              {/* Filter Toggle Button & Export */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex h-10 md:h-11 items-center gap-2 rounded-lg px-4 border transition-all text-sm font-medium ${showFilters || activeFilterCount > 0
                    ? 'bg-primary text-white border-primary'
                    : 'bg-[#f0f2f5] text-[#111418] border-transparent hover:border-primary/30'
                    }`}
                >
                  <span className="material-symbols-outlined text-[18px] md:text-[20px]">filter_list</span>
                  <span className="hidden sm:inline">Filter</span>
                  {activeFilterCount > 0 && (
                    <span className={`min-w-[20px] h-5 flex items-center justify-center rounded-full text-xs font-bold ${showFilters ? 'bg-white/20 text-white' : 'bg-primary text-white'
                      }`}>
                      {activeFilterCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={exportToExcel}
                  className="flex h-10 md:h-11 items-center gap-2 rounded-lg px-4 bg-[#f0f2f5] text-[#111418] border border-transparent hover:border-green-400 hover:bg-green-50 transition-all text-sm font-medium"
                  title="Export ke Excel"
                >
                  <span className="material-symbols-outlined text-[18px] md:text-[20px]">download</span>
                  <span className="hidden sm:inline">Export</span>
                </button>
              </div>
            </div>

            {/* Collapsible Filter Panel */}
            {showFilters && (
              <div className="mt-3 pt-3 border-t border-[#e5e7eb]">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {/* Status */}
                  <div>
                    <label className="text-[10px] font-bold text-[#60758a] uppercase tracking-wider mb-1.5 block">Status</label>
                    <div className="relative">
                      <select
                        className="flex w-full h-10 md:h-11 items-center rounded-lg bg-[#f0f2f5] px-3 md:px-4 border border-transparent hover:border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all appearance-none pr-9 text-[#111418] text-xs md:text-sm font-medium"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="">Semua Status</option>
                        <option value="open">Dalam Antrean</option>
                        <option value="in_progress">Sedang Diproses</option>
                        <option value="done">Selesai</option>
                        <option value="rejected">Ditolak</option>
                      </select>
                      <span className="material-symbols-outlined text-[18px] absolute right-2 md:right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#60758a]">keyboard_arrow_down</span>
                    </div>
                  </div>

                  {/* Prioritas */}
                  <div>
                    <label className="text-[10px] font-bold text-[#60758a] uppercase tracking-wider mb-1.5 block">Prioritas</label>
                    <div className="relative">
                      <select
                        className="flex w-full h-10 md:h-11 items-center rounded-lg bg-[#f0f2f5] px-3 md:px-4 border border-transparent hover:border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all appearance-none pr-9 text-[#111418] text-xs md:text-sm font-medium"
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                      >
                        <option value="">Semua Prioritas</option>
                        <option value="1">Tinggi</option>
                        <option value="2">Sedang</option>
                        <option value="3">Rendah</option>
                      </select>
                      <span className="material-symbols-outlined text-[18px] absolute right-2 md:right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#60758a]">keyboard_arrow_down</span>
                    </div>
                  </div>

                  {/* Region — only for Admin, Accounting HO, IT Sabang */}
                  {showRegionFilter && (
                    <div>
                      <label className="text-[10px] font-bold text-[#60758a] uppercase tracking-wider mb-1.5 block">Region</label>
                      <div className="relative">
                        <select
                          className="flex w-full h-10 md:h-11 items-center rounded-lg bg-[#f0f2f5] px-3 md:px-4 border border-transparent hover:border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all appearance-none pr-9 text-[#111418] text-xs md:text-sm font-medium"
                          value={regionFilter}
                          onChange={(e) => setRegionFilter(e.target.value)}
                        >
                          <option value="">Semua Region</option>
                          {regions.map(r => (
                            <option key={r.id} value={r.id}>{r.region_name}</option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined text-[18px] absolute right-2 md:right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#60758a]">keyboard_arrow_down</span>
                      </div>
                    </div>
                  )}

                  {/* Tim — only for Admin, FIN_ADMIN, Accounting HO */}
                  {showTeamFilter && (
                    <div>
                      <label className="text-[10px] font-bold text-[#60758a] uppercase tracking-wider mb-1.5 block">Tim</label>
                      <div className="relative">
                        <select
                          className="flex w-full h-10 md:h-11 items-center rounded-lg bg-[#f0f2f5] px-3 md:px-4 border border-transparent hover:border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all appearance-none pr-9 text-[#111418] text-xs md:text-sm font-medium"
                          value={teamFilter}
                          onChange={(e) => setTeamFilter(e.target.value)}
                        >
                          <option value="">Semua Tim</option>
                          {Object.entries(TEAM_LABELS).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined text-[18px] absolute right-2 md:right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#60758a]">keyboard_arrow_down</span>
                      </div>
                    </div>
                  )}

                  {/* Cabang — only for Outlet */}
                  {showBranchFilter && (
                    <div>
                      <label className="text-[10px] font-bold text-[#60758a] uppercase tracking-wider mb-1.5 block">Cabang</label>
                      <div className="relative">
                        <select
                          className="flex w-full h-10 md:h-11 items-center rounded-lg bg-[#f0f2f5] px-3 md:px-4 border border-transparent hover:border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all appearance-none pr-9 text-[#111418] text-xs md:text-sm font-medium"
                          value={branchFilter}
                          onChange={(e) => setBranchFilter(e.target.value)}
                        >
                          <option value="">Semua Cabang</option>
                          {branches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined text-[18px] absolute right-2 md:right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#60758a]">keyboard_arrow_down</span>
                      </div>
                    </div>
                  )}

                  {/* Dari Tanggal */}
                  <div>
                    <label className="text-[10px] font-bold text-[#60758a] uppercase tracking-wider mb-1.5 block">Dari Tanggal</label>
                    <input
                      type="date"
                      className="flex w-full h-10 md:h-11 items-center rounded-lg bg-[#f0f2f5] px-3 md:px-4 border border-transparent hover:border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-[#111418] text-xs md:text-sm font-medium"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                  </div>

                  {/* Sampai Tanggal */}
                  <div>
                    <label className="text-[10px] font-bold text-[#60758a] uppercase tracking-wider mb-1.5 block">Sampai Tanggal</label>
                    <input
                      type="date"
                      className="flex w-full h-10 md:h-11 items-center rounded-lg bg-[#f0f2f5] px-3 md:px-4 border border-transparent hover:border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-[#111418] text-xs md:text-sm font-medium"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </div>
                </div>

                {/* Reset Filter */}
                {activeFilterCount > 0 && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => {
                        setStatusFilter('');
                        setPriorityFilter('');
                        setRegionFilter('');
                        setTeamFilter('');
                        setBranchFilter('');
                        setDateFrom('');
                        setDateTo('');
                      }}
                      className="text-xs font-medium text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                      Reset Semua Filter
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {currentItems.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => navigate(`/tickets/${ticket.id}`)}
                className="bg-white rounded-xl shadow-sm border border-[#e5e7eb] p-4 active:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-mono font-bold text-primary">
                    #{ticket.id.substring(0, 8).toUpperCase()}
                  </span>
                  {getStatusBadge(ticket.status)}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#60758a] font-medium">Fitur</span>
                    <span className="text-sm text-[#111418] font-medium text-right max-w-[60%] truncate">
                      {(ticket.feature?.name === "Lainnya"
                        ? ticket.feature_other
                        : ticket.feature?.name) ||
                        ticket.feature_other ||
                        ticket.issue_type}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#60758a] font-medium">Tanggal</span>
                    <span className="text-sm text-[#111418]">
                      {format(new Date(ticket.created_at), "dd MMM yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#60758a] font-medium">Cabang</span>
                    <span className="text-sm text-[#111418] text-right max-w-[60%] truncate">
                      {ticket.branch?.name || '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#60758a] font-medium">Region</span>
                    <span className="text-sm text-[#111418]">
                      {ticket.origin_region?.region_name || '-'}
                    </span>
                  </div>
                  {showTeamColumn && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#60758a] font-medium">Tim Tujuan</span>
                      <span className="text-sm text-[#111418]">
                        {ticket.target_team ? (TEAM_LABELS[ticket.target_team] || ticket.target_team) : '-'}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#60758a] font-medium">Prioritas</span>
                    {getPriorityBadge(ticket.priority)}
                  </div>
                </div>
              </div>
            ))}
            {filteredTickets.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-[#e5e7eb] p-8 text-center text-[#60758a]">
                Tidak ada tiket yang ditemukan
              </div>
            )}
          </div>

          {/* Desktop Table Card */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-[#e5e7eb]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1100px]">
                <thead>
                  <tr className="bg-[#f8fafc] border-b border-[#e5e7eb]">
                    <th className="px-6 py-4 text-xs font-bold text-[#60758a] uppercase tracking-wider">
                      ID Tiket
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-[#60758a] uppercase tracking-wider">
                      Tanggal Pengajuan
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-[#60758a] uppercase tracking-wider">
                      Fitur
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-[#60758a] uppercase tracking-wider">
                      Cabang
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-[#60758a] uppercase tracking-wider">
                      Region
                    </th>
                    {showTeamColumn && (
                      <th className="px-6 py-4 text-xs font-bold text-[#60758a] uppercase tracking-wider">
                        Tim Tujuan
                      </th>
                    )}
                    <th className="px-6 py-4 text-xs font-bold text-[#60758a] uppercase tracking-wider">
                      Prioritas
                    </th>
                    {showAssignedColumn && (
                      <th className="px-6 py-4 text-xs font-bold text-[#60758a] uppercase tracking-wider">
                        Assigned To
                      </th>
                    )}
                    <th className="px-6 py-4 text-xs font-bold text-[#60758a] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-[#60758a] uppercase tracking-wider text-center">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb]">
                  {currentItems.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="hover:bg-[#f8fafc] transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-mono font-medium text-primary">
                        #{ticket.id.substring(0, 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#111418]">
                        {format(new Date(ticket.created_at), "dd MMM yyyy")}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#111418]">
                        {(ticket.feature?.name === "Lainnya"
                          ? ticket.feature_other
                          : ticket.feature?.name) ||
                          ticket.feature_other ||
                          ticket.issue_type}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#111418]">
                        {ticket.branch?.name || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#111418]">
                        {ticket.origin_region?.region_name || '-'}
                      </td>
                      {showTeamColumn && (
                        <td className="px-6 py-4 text-sm text-[#111418]">
                          {ticket.target_team ? (TEAM_LABELS[ticket.target_team] || ticket.target_team) : '-'}
                        </td>
                      )}
                      <td className="px-6 py-4">
                        {getPriorityBadge(ticket.priority)}
                      </td>
                      {showAssignedColumn && (
                        <td className="px-6 py-4">
                          {(isAdmin || canManageTickets) ? (
                            <div className="relative group min-w-[170px]">
                              <select
                                value={ticket.assigned_to || ""}
                                onChange={(e) => handleAssigneeChange(ticket.id, e.target.value)}
                                className="appearance-none w-full bg-white border border-slate-200 text-[#111418] text-sm rounded-lg pl-9 pr-8 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer hover:border-slate-300"
                              >
                                <option value="">Unassigned</option>
                                {ASSIGNEES.map((name) => (
                                  <option key={name} value={name}>
                                    {name}
                                  </option>
                                ))}
                              </select>

                              {/* Avatar Icon Overlay */}
                              <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
                                <div className={`size-5 rounded-full flex items-center justify-center overflow-hidden ${ticket.assigned_to
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-slate-100 text-slate-400'
                                  }`}>
                                  <span className="text-[10px] font-bold">
                                    {(ticket.assigned_to || '?')[0].toUpperCase()}
                                  </span>
                                </div>
                              </div>

                              {/* Chevron Icon Overlay */}
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <span className="material-symbols-outlined text-[18px]">
                                  unfold_more
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className={`size-6 rounded-full flex items-center justify-center overflow-hidden ${ticket.assigned_to
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-slate-100 text-slate-400'
                                }`}>
                                <span className="text-xs font-bold">
                                  {(ticket.assigned_to || '?')[0].toUpperCase()}
                                </span>
                              </div>
                              <span className={`text-sm ${ticket.assigned_to ? 'text-[#111418] font-medium' : 'text-slate-400 italic'}`}>
                                {ticket.assigned_to || 'Unassigned'}
                              </span>
                            </div>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4">
                        {getStatusBadge(ticket.status)}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/tickets/${ticket.id}`)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-bold transition-colors"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredTickets.length === 0 && (
                    <tr>
                      <td
                        colSpan={showAssignedColumn ? 10 : showTeamColumn ? 9 : 8}
                        className="px-6 py-12 text-center text-[#60758a]"
                      >
                        Tidak ada tiket yang ditemukan
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {filteredTickets.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 md:px-6 py-3 md:py-4 bg-white rounded-xl shadow-sm border border-[#e5e7eb]">
              <p className="text-xs md:text-sm text-[#60758a] text-center sm:text-left">
                Menampilkan{" "}
                <span className="font-medium text-[#111418]">
                  {Math.min((currentPage - 1) * itemsPerPage + 1, filteredTickets.length)}
                </span>{" "}
                sampai{" "}
                <span className="font-medium text-[#111418]">
                  {Math.min(currentPage * itemsPerPage, filteredTickets.length)}
                </span>{" "}
                dari{" "}
                <span className="font-medium text-[#111418]">
                  {filteredTickets.length}
                </span>{" "}
                hasil
              </p>
              <div className="flex gap-1.5 md:gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center justify-center size-8 md:size-9 rounded-lg border border-[#e5e7eb] bg-white text-[#111418] hover:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[16px] md:text-[18px]">
                    chevron_left
                  </span>
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`flex items-center justify-center size-8 md:size-9 rounded-lg border text-xs md:text-sm font-bold ${currentPage === pageNum
                        ? "border-primary bg-primary text-white"
                        : "border-[#e5e7eb] bg-white text-[#111418] hover:bg-gray-50"
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex items-center justify-center size-8 md:size-9 rounded-lg border border-[#e5e7eb] bg-white text-[#111418] hover:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[16px] md:text-[18px]">
                    chevron_right
                  </span>
                </button>
              </div>
            </div>
          )}
          {/* Footer Copyright */}
          <div className="text-center py-6 mt-2">
            <p className="text-[12px] text-slate-400">
              © {new Date().getFullYear()} PT Sabang Digital Indonesia. All Rights Reserved.
            </p>
          </div>
        </div>
      </main>
    </Layout>
  );
};

// Helper function to render priority badge
function getPriorityBadge(priority: number) {
  const config = {
    1: {
      bg: "bg-red-100",
      text: "text-red-800",
      label: "Tinggi",
    },
    2: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      label: "Sedang",
    },
    3: {
      bg: "bg-blue-100",
      text: "text-blue-800",
      label: "Rendah",
    },
  };

  const badge = config[priority as keyof typeof config] || config[2];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}
    >
      {badge.label}
    </span>
  );
}

// Helper function to render status badge
function getStatusBadge(status: TicketStatus) {
  const statusConfig: Record<
    TicketStatus,
    { bg: string; text: string; dot: string; label: string }
  > = {
    [TicketStatus.PENDING]: {
      bg: "bg-orange-100",
      text: "text-orange-600",
      dot: "bg-orange-400",
      label: "Dalam Antrean",
    },
    [TicketStatus.OPEN]: {
      bg: "bg-[#f0f2f5]",
      text: "text-gray-600",
      dot: "bg-gray-400",
      label: "Dalam Antrean",
    },
    [TicketStatus.IN_PROGRESS]: {
      bg: "bg-primary/10",
      text: "text-primary",
      dot: "bg-primary",
      label: "Sedang Diproses",
    },
    [TicketStatus.RESOLVED]: {
      bg: "bg-green-100",
      text: "text-green-700",
      dot: "bg-green-600",
      label: "Selesai",
    },
    [TicketStatus.REJECTED]: {
      bg: "bg-red-100",
      text: "text-red-700",
      dot: "bg-red-600",
      label: "Ditolak",
    },
  };

  const config = statusConfig[status] || statusConfig[TicketStatus.OPEN];

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold ${config.bg} ${config.text}`}
    >
      <span className={`size-2 rounded-full ${config.dot} mr-2`}></span>
      {config.label}
    </span>
  );
}

export default TicketList;
