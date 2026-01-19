import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { getTicketStats, getTickets } from "../services/ticketService";
import { useAuth } from "../contexts/AuthContext";
import { Ticket, TicketStatus } from "../types";
import { format } from "date-fns";

interface Stats {
  total_tickets: number;
  pending_tickets: number;
  in_progress_tickets: number;
  resolved_tickets: number;
  rejected_tickets: number;
}

const Dashboard: React.FC = () => {
  const { profile } = useAuth();
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
      setStats(statsData as Stats);
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
    (stats?.pending_tickets || 0) + (stats?.in_progress_tickets || 0);
  const successRate = stats?.total_tickets
    ? ((stats.resolved_tickets / stats.total_tickets) * 100).toFixed(1)
    : "0.0";

  return (
    <Layout>
      <main className="max-w-[1200px] mx-auto px-4 md:px-10 lg:px-40 py-8">
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
              <span className="text-emerald-600 text-xs font-bold px-2 py-1 bg-emerald-50 rounded-full">
                +12%
              </span>
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
              <span className="text-emerald-600 text-xs font-bold px-2 py-1 bg-emerald-50 rounded-full">
                +5%
              </span>
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
              <span className="text-emerald-600 text-xs font-bold px-2 py-1 bg-emerald-50 rounded-full">
                +0.5%
              </span>
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium">Success Rate</p>
              <p className="text-slate-900 tracking-tight text-2xl font-black">
                {successRate}%
              </p>
            </div>
          </div>
        </div>

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
                  <th className="px-6 py-4 text-primary text-xs font-bold uppercase tracking-wider w-[120px] text-right">
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
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-400 text-sm">
                          {getDataTypeIcon(ticket.issue_type)}
                        </span>
                        <span className="text-slate-600 text-sm">
                          {ticket.feature?.name ||
                            ticket.feature_other ||
                            ticket.issue_type}
                        </span>
                      </div>
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
                Showing {Math.min(5, tickets.length)} of{" "}
                {(stats?.total_tickets || 0).toLocaleString()} results
              </p>
              <div className="flex gap-2">
                <button className="size-8 flex items-center justify-center rounded border border-slate-200 bg-white text-slate-400 cursor-not-allowed">
                  <span className="material-symbols-outlined text-sm">
                    chevron_left
                  </span>
                </button>
                <button className="size-8 flex items-center justify-center rounded border border-slate-200 bg-primary text-white text-sm font-bold">
                  1
                </button>
                <button className="size-8 flex items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:border-primary transition-all text-sm font-bold">
                  2
                </button>
                <button className="size-8 flex items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:border-primary transition-all text-sm font-bold">
                  3
                </button>
                <button className="size-8 flex items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:border-primary transition-all">
                  <span className="material-symbols-outlined text-sm">
                    chevron_right
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="h-20"></div>
      </main>
    </Layout>
  );
};

// Helper function to get icon based on data type
function getDataTypeIcon(issueType: string): string {
  const iconMap: Record<string, string> = {
    data_entry_error: "person",
    system_bug: "bug_report",
    missing_data: "inventory_2",
    incorrect_calculation: "payments",
    other: "help",
  };
  return iconMap[issueType] || "description";
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
