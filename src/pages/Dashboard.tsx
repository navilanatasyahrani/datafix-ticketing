import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { getTicketStats, getTickets } from "../services/ticketService";
import { useAuth } from "../contexts/AuthContext";
import { Ticket, TicketStatus } from "../types";
import { format, subMonths } from "date-fns";
import { id } from "date-fns/locale";
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Stats {
  total_tickets: number;
  open_tickets: number;
  in_progress_tickets: number;
  resolved_tickets: number;
  rejected_tickets: number;
}

const Dashboard: React.FC = () => {
  const { profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);

    const { data: statsData } = await getTicketStats();
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
    }

    const { data: ticketsData } = await getTickets();
    if (ticketsData) {
      setTickets(ticketsData);
    }

    setLoading(false);
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

  const activeRequests =
    (stats?.open_tickets || 0) + (stats?.in_progress_tickets || 0);
  const successRate = stats?.total_tickets
    ? ((stats.resolved_tickets / stats.total_tickets) * 100).toFixed(1)
    : "0.0";

  return (
    <Layout>
      <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-slate-900 text-3xl font-black leading-tight tracking-tight">
              Welcome back,{" "}
              {profile?.display_name ||
                profile?.full_name ||
                profile?.email ||
                "User"}
            </h1>
            <p className="text-slate-500 text-base font-normal">
              Manage and track your data correction requests efficiently.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/tickets/new")}
              className="flex items-center justify-center gap-2 px-5 h-11 bg-primary text-white text-sm font-bold rounded-lg shadow-lg shadow-primary/20 hover:brightness-110 transition-all"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              <span>New Ticket</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {/* Total Submissions */}
          <div className="flex flex-col gap-3 rounded-xl p-6 bg-white border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-blue-50 rounded-lg">
                <span className="material-symbols-outlined text-primary">
                  description
                </span>
              </div>
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium">
                Total Submissions
              </p>
              <p className="text-slate-900 tracking-tight text-2xl font-black">
                {(stats?.total_tickets || 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Active Requests */}
          <div className="flex flex-col gap-3 rounded-xl p-6 bg-white border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-amber-50 rounded-lg">
                <span className="material-symbols-outlined text-amber-500">
                  pending_actions
                </span>
              </div>
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium">
                Active Requests
              </p>
              <p className="text-slate-900 tracking-tight text-2xl font-black">
                {activeRequests}
              </p>
            </div>
          </div>

          {/* Success Rate */}
          <div className="flex flex-col gap-3 rounded-xl p-6 bg-white border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <span className="material-symbols-outlined text-emerald-500">
                  task_alt
                </span>
              </div>
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium">Success Rate</p>
              <p className="text-slate-900 tracking-tight text-2xl font-black">
                {successRate}%
              </p>
            </div>
          </div>
        </div>

        {/* Charts Section - Only visible to Admins */}
        {isAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            {/* Tren Perbaikan Data - Takes 2 columns */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="mb-6">
                <h3 className="text-slate-900 text-lg font-bold">Tren Perbaikan Data</h3>
                <p className="text-slate-500 text-sm">Aktivitas permintaan perbaikan 3 bulan terakhir</p>
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart
                  data={getTrendData(tickets)}
                  margin={{ top: 20, right: 35, left: 0, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id="colorSelesai" x1="0" y1="0" x2="0" y2="0">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorMasuk" x1="0" y1="0" x2="0" y2="0">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    padding={{ top: 30, bottom: 0 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontSize: '12px'
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: '20px', fontSize: '12px', fontWeight: 600 }}
                    iconType="circle"
                  />
                  <Area
                    type="monotone"
                    dataKey="selesai"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorSelesai)"
                    name="SELESAI"
                  />
                  <Area
                    type="monotone"
                    dataKey="masuk"
                    stroke="#14b8a6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorMasuk)"
                    name="MASUK"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Distribusi Fitur */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="mb-6">
                <h3 className="text-slate-900 text-lg font-bold">Distribusi Fitur</h3>
                <p className="text-slate-500 text-sm">Proporsi tiket berdasarkan kategori</p>
              </div>
              <div className="relative h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getFeatureDistribution(tickets)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      labelLine={false}
                    >
                      {getFeatureDistribution(tickets).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, name: any) => [`${value} Tiket`, name]}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-slate-900">
                    {tickets.length > 1000 ? `${(tickets.length / 1000).toFixed(1)}k` : tickets.length}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    TOTAL TIKET
                  </span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                {getFeatureDistribution(tickets).map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-xs text-slate-900">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Activities Header */}
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-slate-900 text-xl font-bold leading-tight tracking-tight">
            Recent Activities
          </h2>
          <button
            onClick={() => navigate("/tickets")}
            className="text-primary text-sm font-bold hover:underline transition-all"
          >
            View All
          </button>
        </div>

        {/* Activities Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-slate-900 text-xs font-bold uppercase tracking-wider w-[140px]">
                    Ticket ID
                  </th>
                  <th className="px-6 py-4 text-slate-900 text-xs font-bold uppercase tracking-wider">
                    Data Type
                  </th>
                  <th className="px-6 py-4 text-slate-900 text-xs font-bold uppercase tracking-wider w-[160px]">
                    Status
                  </th>
                  <th className="px-6 py-4 text-slate-900 text-xs font-bold uppercase tracking-wider w-[180px]">
                    Date Submitted
                  </th>
                  <th className="px-6 py-4 text-slate-900 text-xs font-bold uppercase tracking-wider">
                    Requester
                  </th>
                  <th className="px-6 py-4 text-slate-900 text-xs font-bold uppercase tracking-wider w-[120px] text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {tickets.slice(0, 5).map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-slate-900 text-sm font-semibold">
                      #{ticket.id.substring(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-600 text-sm">
                        {ticket.feature?.name ||
                          ticket.feature_other ||
                          ticket.issue_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(ticket.status)}
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-sm">
                      {format(new Date(ticket.created_at), "MMM dd, yyyy")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="size-6 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center">
                          <span className="text-xs font-bold text-slate-600">
                            {(ticket.reporter?.full_name ||
                              ticket.reporter_name ||
                              "U")[0].toUpperCase()}
                          </span>
                        </div>
                        <span className="text-slate-600 text-sm">
                          {ticket.reporter?.full_name ||
                            ticket.reporter_name ||
                            "Unknown"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/tickets/${ticket.id}`)}
                        className="text-primary text-sm font-bold hover:text-blue-700 transition-colors"
                      >
                        Details
                      </button>

                    </td>
                  </tr>
                ))}
                {tickets.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      No tickets found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer / Pagination */}
          {tickets.length > 0 && (
            <div className="px-6 py-4 bg-slate-50 flex items-center justify-between border-t border-slate-200">
              <p className="text-xs text-slate-500 font-medium">
                Showing recent {Math.min(5, tickets.length)} of{" "}
                {(stats?.total_tickets || 0).toLocaleString()} activities
              </p>
              <button
                onClick={() => navigate("/tickets")}
                className="text-primary text-xs font-bold hover:underline"
              >
                View full history
              </button>
            </div>
          )}
        </div>

        <div className="h-20"></div>
      </main>
    </Layout >
  );
};

// Helper function to generate trend data for the last 3 months
function getTrendData(tickets: Ticket[]) {
  const now = new Date();

  return Array.from({ length: 3 }).map((_, index) => {
    const monthDate = subMonths(now, 2 - index);
    const monthName = format(monthDate, 'MMM', { locale: id }).toUpperCase();

    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

    const ticketsInMonth = tickets.filter(t => {
      const createdDate = new Date(t.created_at);
      return createdDate >= monthStart && createdDate <= monthEnd;
    });

    const selesai = ticketsInMonth.filter(t =>
      t.status === TicketStatus.RESOLVED || t.status === TicketStatus.REJECTED
    ).length; // Counting resolved and rejected as 'Selesai' (processed)

    const masuk = ticketsInMonth.length;

    return {
      month: monthName,
      selesai,
      masuk
    };
  });
}

// Helper function to get feature distribution
function getFeatureDistribution(tickets: Ticket[]) {
  const featureCount: Record<string, number> = {};

  tickets.forEach(ticket => {
    const featureName = ticket.feature?.name || ticket.feature_other || 'Others';
    featureCount[featureName] = (featureCount[featureName] || 0) + 1;
  });

  const colors = ['#4F46E5', '#14b8a6', '#06b6d4', '#94a3b8'];
  const sortedFeatures = Object.entries(featureCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return sortedFeatures.map(([name, value], index) => ({
    name: name,
    value,
    color: colors[index % colors.length]
  }));
}

// Helper function to render status badge
function getStatusBadge(status: TicketStatus) {
  const statusConfig: Record<
    TicketStatus,
    { bg: string; text: string; dot: string; label: string }
  > = {
    [TicketStatus.OPEN]: {
      bg: "bg-amber-100",
      text: "text-amber-700",
      dot: "bg-amber-600",
      label: "Open",
    },
    [TicketStatus.IN_PROGRESS]: {
      bg: "bg-blue-100",
      text: "text-blue-700",
      dot: "bg-blue-600",
      label: "In Progress",
    },
    [TicketStatus.RESOLVED]: {
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      dot: "bg-emerald-600",
      label: "Resolved",
    },
    [TicketStatus.REJECTED]: {
      bg: "bg-rose-100",
      text: "text-rose-700",
      dot: "bg-rose-600",
      label: "Rejected",
    },
    [TicketStatus.PENDING]: {
      bg: "bg-slate-100",
      text: "text-slate-700",
      dot: "bg-slate-600",
      label: "Pending",
    },
  };

  const config = statusConfig[status] || statusConfig[TicketStatus.OPEN];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${config.bg} ${config.text}`}
    >
      <span className={`size-1.5 rounded-full ${config.dot}`}></span>
      {config.label}
    </span>
  );
}

export default Dashboard;
