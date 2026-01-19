import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { getTickets, getTicketStats } from "../services/ticketService";
import { Ticket, TicketStatus } from "../types";
import { format } from "date-fns";

interface Stats {
  total_tickets: number;
  pending_tickets: number;
  in_progress_tickets: number;
  resolved_tickets: number;
  rejected_tickets: number;
}

const TicketList: React.FC = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, statusFilter, priorityFilter, tickets]);

  const loadData = async () => {
    setLoading(true);

    const { data: ticketsData } = await getTickets();
    const { data: statsData } = await getTicketStats();

    if (ticketsData) {
      setTickets(ticketsData);
      setFilteredTickets(ticketsData);
    }
    if (statsData) setStats(statsData as Stats);

    setLoading(false);
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

    setFilteredTickets(filtered);
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
      <main className="flex flex-1 justify-center py-10 px-6">
        <div className="layout-content-container flex flex-col max-w-[1200px] flex-1 gap-6">
          {/* Page Heading */}
          <div className="flex flex-wrap justify-between items-end gap-3">
            <div className="flex min-w-72 flex-col gap-2">
              <h1 className="text-[#111418] text-4xl font-black leading-tight tracking-[-0.033em]">
                Progress Tiket Perbaikan
              </h1>
              <p className="text-[#60758a] text-base font-normal leading-normal">
                Pantau status pengajuan koreksi data Anda secara real-time.
              </p>
            </div>
          </div>

          {/* Search and Filters Section */}
          <div className="bg-white rounded-xl shadow-sm border border-[#e5e7eb] p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1">
                <label className="flex flex-col w-full">
                  <div className="flex w-full items-stretch rounded-lg h-11 border border-[#e5e7eb] overflow-hidden">
                    <div className="text-[#60758a] flex bg-[#f0f2f5] items-center justify-center px-4">
                      <span className="material-symbols-outlined text-[20px]">
                        search
                      </span>
                    </div>
                    <input
                      className="form-input flex w-full border-none bg-white text-[#111418] focus:ring-0 px-4 text-sm font-normal"
                      placeholder="Cari ID Tiket atau Fitur..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </label>
              </div>

              {/* Filters */}
              <div className="flex gap-3 flex-wrap">
                <div className="relative">
                  <select
                    className="flex h-11 items-center justify-center gap-x-2 rounded-lg bg-[#f0f2f5] px-4 border border-transparent hover:border-primary/30 transition-all appearance-none pr-10 text-[#111418] text-sm font-medium"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">Semua Status</option>
                    <option value="open">Dalam Antrean</option>
                    <option value="in_progress">Sedang Diproses</option>
                    <option value="resolved">Selesai</option>
                    <option value="rejected">Ditolak</option>
                  </select>
                  <span className="material-symbols-outlined text-[20px] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    keyboard_arrow_down
                  </span>
                </div>

                <div className="relative">
                  <select
                    className="flex h-11 items-center justify-center gap-x-2 rounded-lg bg-[#f0f2f5] px-4 border border-transparent hover:border-primary/30 transition-all appearance-none pr-10 text-[#111418] text-sm font-medium"
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                  >
                    <option value="1">Tinggi</option>
                    <option value="2">Sedang</option>
                    <option value="3">Rendah</option>
                  </select>
                  <span className="material-symbols-outlined text-[20px] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    keyboard_arrow_down
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Table Card */}
          <div className="bg-white rounded-xl shadow-sm border border-[#e5e7eb] overflow-hidden">
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-left border-collapse min-w-[800px]">
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
                      Prioritas
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-[#60758a] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-[#60758a] uppercase tracking-wider text-right">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb]">
                  {filteredTickets.slice(0, 10).map((ticket) => (
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
                      <td className="px-6 py-4">
                        {getPriorityBadge(ticket.priority)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(ticket.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => navigate(`/tickets/${ticket.id}`)}
                          className="text-primary hover:underline text-sm font-semibold"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredTickets.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-[#60758a]"
                      >
                        Tidak ada tiket yang ditemukan
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredTickets.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-[#e5e7eb] bg-[#f8fafc]">
                <p className="text-sm text-[#60758a]">
                  Menampilkan{" "}
                  <span className="font-medium text-[#111418]">1</span> sampai{" "}
                  <span className="font-medium text-[#111418]">
                    {Math.min(10, filteredTickets.length)}
                  </span>{" "}
                  dari{" "}
                  <span className="font-medium text-[#111418]">
                    {filteredTickets.length}
                  </span>{" "}
                  hasil
                </p>
                <div className="flex gap-2">
                  <button className="flex items-center justify-center size-9 rounded-lg border border-[#e5e7eb] bg-white text-gray-400 cursor-not-allowed">
                    <span className="material-symbols-outlined text-[18px]">
                      chevron_left
                    </span>
                  </button>
                  <button className="flex items-center justify-center size-9 rounded-lg border border-primary bg-primary text-white font-bold text-sm">
                    1
                  </button>
                  <button className="flex items-center justify-center size-9 rounded-lg border border-[#e5e7eb] bg-white text-[#111418] hover:bg-gray-50 text-sm">
                    2
                  </button>
                  <button className="flex items-center justify-center size-9 rounded-lg border border-[#e5e7eb] bg-white text-[#111418] hover:bg-gray-50 text-sm">
                    3
                  </button>
                  <button className="flex items-center justify-center size-9 rounded-lg border border-[#e5e7eb] bg-white text-[#111418] hover:bg-gray-50">
                    <span className="material-symbols-outlined text-[18px]">
                      chevron_right
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Statistics Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
            <div className="p-4 bg-white rounded-xl shadow-sm border border-[#e5e7eb]">
              <p className="text-xs font-bold text-[#60758a] uppercase tracking-wider mb-1">
                Total Tiket
              </p>
              <p className="text-2xl font-black text-[#111418]">
                {stats?.total_tickets || 0}
              </p>
            </div>
            <div className="p-4 bg-white rounded-xl shadow-sm border border-[#e5e7eb]">
              <p className="text-xs font-bold text-[#60758a] uppercase tracking-wider mb-1">
                Menunggu
              </p>
              <p className="text-2xl font-black text-[#111418]">
                {stats?.pending_tickets || 0}
              </p>
            </div>
            <div className="p-4 bg-white rounded-xl shadow-sm border border-[#e5e7eb]">
              <p className="text-xs font-bold text-[#60758a] uppercase tracking-wider mb-1">
                Diproses
              </p>
              <p className="text-2xl font-black text-primary">
                {stats?.in_progress_tickets || 0}
              </p>
            </div>
            <div className="p-4 bg-white rounded-xl shadow-sm border border-[#e5e7eb]">
              <p className="text-xs font-bold text-[#60758a] uppercase tracking-wider mb-1">
                Selesai
              </p>
              <p className="text-2xl font-black text-green-600">
                {stats?.resolved_tickets || 0}
              </p>
            </div>
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
      label: "Menunggu",
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
