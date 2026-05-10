'use client'

import { useEffect, useState } from 'react'
import {
  Users, FolderOpen, Image, Coins, TrendingUp, CreditCard,
  Bot, AlertCircle, Zap
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis,
  CartesianGrid, Tooltip
} from 'recharts'
import { AdminStatsCard } from '@/components/admin/AdminStatsCard'
import { AdminChartCard } from '@/components/admin/AdminChartCard'
import { StatusBadge, RoleBadge } from '@/components/admin/StatusBadge'
import { CardSkeleton } from '@/components/admin/EmptyState'
import { fetchStats, fetchChartData, fetchUsers, fetchProjects, fetchAgentRuns, ChartDataPoint } from '@/lib/admin-api'
import { toastLoadError } from '@/lib/toast'
import { formatCurrency, formatRelativeDate } from '@/lib/utils'
import { AdminStats } from '@/types/admin'
import { AdminUser } from '@/types/user'
import { AdminProject } from '@/types/project'
import { AgentRunRecord } from '@/types/agent'

const POSTER_COLORS = ['#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#3B82F6']
const POSTER_TYPES = [
  { name: 'Promotion', value: 35 },
  { name: 'Événement', value: 25 },
  { name: 'Restaurant', value: 18 },
  { name: 'Mode', value: 12 },
  { name: 'Corporate', value: 10 },
]

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [recentUsers, setRecentUsers] = useState<AdminUser[]>([])
  const [recentProjects, setRecentProjects] = useState<AdminProject[]>([])
  const [recentErrors, setRecentErrors] = useState<AgentRunRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchStats(),
      fetchChartData(),
      fetchUsers(),
      fetchProjects(),
      fetchAgentRuns(),
    ]).then(([s, cd, users, projects, runs]) => {
      setStats(s)
      setChartData(cd)
      setRecentUsers(users.slice(0, 5))
      setRecentProjects(projects.slice(0, 5))
      setRecentErrors(runs.filter((r) => r.status === 'FAILED').slice(0, 4))
    }).catch((error) => toastLoadError(error, 'Impossible de charger les données')).finally(() => setIsLoading(false))
  }, [])

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const successToday = recentErrors.length === 0 ? 0 :
    chartData[chartData.length - 1]?.generations ?? 0

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-lg font-bold text-[var(--text)]">Tableau de bord</h1>
        <p className="text-xs text-[var(--text-muted)] mt-0.5 capitalize">{today}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {isLoading || !stats ? (
          Array.from({ length: 10 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          <>
            <AdminStatsCard title="Utilisateurs totaux" value={stats.totalUsers} icon={Users} iconColor="text-violet-600" iconBg="bg-[var(--icon-violet)]" trend={12} delay={0} />
            <AdminStatsCard title="Utilisateurs actifs" value={stats.activeUsers} icon={Zap} iconColor="text-emerald-600" iconBg="bg-[var(--icon-emerald)]" trend={8} delay={50} />
            <AdminStatsCard title="Projets créés" value={stats.totalProjects} icon={FolderOpen} iconColor="text-blue-600" iconBg="bg-[var(--icon-blue)]" trend={15} delay={100} />
            <AdminStatsCard title="Prompts générés" value={stats.promptsGenerated} icon={Bot} iconColor="text-amber-600" iconBg="bg-[var(--icon-amber)]" trend={5} delay={150} />
            <AdminStatsCard title="Affiches générées" value={stats.postersGenerated} icon={Image} iconColor="text-pink-600" iconBg="bg-[var(--icon-pink)]" trend={22} delay={200} />
            <AdminStatsCard title="Crédits consommés" value={stats.creditsConsumed} icon={Coins} iconColor="text-orange-600" iconBg="bg-[var(--icon-orange)]" delay={250} />
            <AdminStatsCard title="Revenus du mois" value={formatCurrency(stats.monthlyRevenue)} icon={TrendingUp} iconColor="text-emerald-600" iconBg="bg-[var(--icon-emerald)]" trend={18} delay={300} />
            <AdminStatsCard title="Paiements réussis" value={stats.successfulPayments} icon={CreditCard} iconColor="text-blue-600" iconBg="bg-[var(--icon-blue)]" trend={2} delay={350} />
            <AdminStatsCard title="Taux d'échec IA" value={`${stats.aiFailureRate}%`} icon={AlertCircle} iconColor="text-red-600" iconBg="bg-[var(--icon-red)]" trend={-1} delay={400} />
            <AdminStatsCard title="Agents actifs" value={stats.activeAgents} icon={Bot} iconColor="text-violet-600" iconBg="bg-[var(--icon-violet)]" delay={450} />
          </>
        )}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AdminChartCard title="Nouveaux utilisateurs" subtitle="30 derniers jours">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: 12 }} />
              <Line type="monotone" dataKey="users" stroke="var(--accent)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </AdminChartCard>

        <AdminChartCard title="Générations IA par jour" subtitle="30 derniers jours">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: 12 }} />
              <Bar dataKey="generations" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </AdminChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <AdminChartCard title="Revenus mensuels" subtitle="Évolution sur 30 jours">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} interval={4} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="var(--accent)" strokeWidth={2} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </AdminChartCard>
        </div>
        <AdminChartCard title="Types d'affiches" subtitle="Répartition par catégorie">
          <div className="flex items-center justify-center pt-4">
            <PieChart width={160} height={160}>
              <Pie data={POSTER_TYPES} cx={75} cy={75} innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                {POSTER_TYPES.map((_, i) => (
                  <Cell key={i} fill={POSTER_COLORS[i % POSTER_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: 12 }} />
            </PieChart>
          </div>
          <div className="space-y-1.5 mt-2">
            {POSTER_TYPES.map((t, i) => (
              <div key={t.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: POSTER_COLORS[i % POSTER_COLORS.length] }} />
                  <span className="text-[var(--text-muted)]">{t.name}</span>
                </div>
                <span className="font-medium text-[var(--text)]">{t.value}%</span>
              </div>
            ))}
          </div>
        </AdminChartCard>
      </div>

      {/* Bottom tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent users */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--text)]">Derniers inscrits</h3>
            <a href="/admin/users" className="text-xs text-[var(--accent)] hover:underline">Voir tout</a>
          </div>
          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-8 rounded bg-[var(--bg-subtle)] animate-skeleton" />
              ))
            ) : recentUsers.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)]">Aucun utilisateur</p>
            ) : recentUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {u.fullName.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-[var(--text)] truncate">{u.fullName}</div>
                  <div className="text-xs text-[var(--text-muted)] truncate">{u.email}</div>
                </div>
                <RoleBadge role={u.role} />
              </div>
            ))}
          </div>
        </div>

        {/* Recent projects */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--text)]">Derniers projets</h3>
            <a href="/admin/projects" className="text-xs text-[var(--accent)] hover:underline">Voir tout</a>
          </div>
          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-8 rounded bg-[var(--bg-subtle)] animate-skeleton" />
              ))
            ) : recentProjects.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)]">Aucun projet</p>
            ) : recentProjects.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-[var(--text)] truncate">{p.title}</div>
                  <div className="text-xs text-[var(--text-muted)]">{p.user?.fullName || '—'}</div>
                </div>
                <StatusBadge status={p.status} size="sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent errors */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--text)]">Erreurs IA récentes</h3>
            <a href="/admin/logs" className="text-xs text-[var(--accent)] hover:underline">Voir logs</a>
          </div>
          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 rounded bg-[var(--bg-subtle)] animate-skeleton" />
              ))
            ) : recentErrors.length === 0 ? (
              <div className="flex items-center gap-2 text-xs text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Aucune erreur récente
              </div>
            ) : recentErrors.map((err) => (
              <div key={err.id} className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-[var(--text)]">{err.agentName}</div>
                  <div className="text-xs text-red-500 truncate">{err.error}</div>
                  <div className="text-xs text-[var(--text-subtle)] mt-0.5">{formatRelativeDate(err.createdAt)}</div>
                </div>
              </div>
            ))}
            {!isLoading && successToday > 0 && (
              <div className="pt-2 border-t border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs text-[var(--text-muted)]">{successToday} générations aujourd'hui</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
