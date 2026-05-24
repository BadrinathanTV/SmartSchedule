import { useState, useEffect, useCallback } from 'react';
import {
  DollarSign, Users, TrendingUp, TrendingDown, BarChart3, PieChart,
  Calendar, Clock, RefreshCw, ChevronDown, ChevronUp, Plus, Edit,
  Trash2, AlertTriangle, CheckCircle, Search, Eye, MoreVertical,
  ArrowUpRight, ArrowDownRight, UserPlus, Shield, Activity
} from 'lucide-react';
import { createUser, getDailyAnalytics, getMonthlySummary, getUsers, updateUser } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { UserProfile } from '../contexts/AuthContext';
import { channelConfigs, channelComparisons } from '../data/mockData';

interface ChannelDailyAnalytics {
  id: string;
  channel_id: string;
  date: string;
  total_viewers: number;
  avg_retention: number;
  total_watch_time_hours: number;
  ad_impressions: number;
  ad_revenue: number;
  unique_viewers: number;
  peak_concurrent_viewers: number;
}

interface MonthlyChannelSummary {
  id: string;
  channel_id: string;
  month: string;
  total_revenue: number;
  total_viewers: number;
  avg_retention: number;
  growth_percentage: number;
}

export function AdminDashboard() {
  const { isAdmin } = useAuth();
  const [dailyAnalytics, setDailyAnalytics] = useState<ChannelDailyAnalytics[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<MonthlyChannelSummary[]>([]);
  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<UserProfile | null>(null);
  const [activeSection, setActiveSection] = useState<'overview' | 'revenue' | 'employees'>('overview');

  // Employee form state
  const [newEmployee, setNewEmployee] = useState({
    email: '',
    fullName: '',
    password: '',
    assignedChannels: [] as string[],
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch daily analytics
      const dailyData = await getDailyAnalytics() as ChannelDailyAnalytics[];
      setDailyAnalytics(dailyData || []);

      const monthlyData = await getMonthlySummary() as MonthlyChannelSummary[];
      setMonthlySummary(monthlyData || []);

      const profilesData = await getUsers() as UserProfile[];
      setEmployees(profilesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin, fetchData]);

  const handleAddEmployee = async () => {
    if (!newEmployee.email || !newEmployee.fullName || !newEmployee.password) return;

    try {
      await createUser({
        email: newEmployee.email,
        full_name: newEmployee.fullName,
        role: 'employee',
        assigned_channels: newEmployee.assignedChannels,
      });

      // Reset form and refresh
      setNewEmployee({ email: '', fullName: '', password: '', assignedChannels: [] });
      setShowAddEmployee(false);
      fetchData();
    } catch (error) {
      console.error('Error adding employee:', error);
      alert('Failed to add employee. Please try again.');
    }
  };

  const handleToggleEmployeeStatus = async (employee: UserProfile) => {
    try {
      await updateUser(employee.id, { is_active: !employee.is_active });
      fetchData();
    } catch (error) {
      console.error('Error updating employee:', error);
    }
  };

  // Calculate totals
  const totalRevenue = monthlySummary.reduce((sum, m) => sum + Number(m.total_revenue), 0);
  const totalViewers = dailyAnalytics.reduce((sum, d) => sum + d.total_viewers, 0);
  const avgRetention = dailyAnalytics.length > 0
    ? dailyAnalytics.reduce((sum, d) => sum + Number(d.avg_retention), 0) / dailyAnalytics.length
    : 0;
  const activeEmployees = employees.filter(e => e.is_active && e.role === 'employee').length;
  const totalAdImpressions = dailyAnalytics.reduce((sum, d) => sum + d.ad_impressions, 0);

  // Get channel by ID
  const getChannel = (channelId: string) => channelConfigs.find(c => c.id === channelId);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="w-12 h-12 text-rose-400 mx-auto mb-3" />
          <p className="text-slate-400">Admin access required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-cyan-400" />
            Admin Dashboard
          </h1>
          <p className="text-sm text-slate-400">Channel analytics, revenue & employee management</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['overview', 'revenue', 'employees'] as const).map(section => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize whitespace-nowrap ${
              activeSection === section
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {section}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      ) : (
        <>
          {/* Overview Section */}
          {activeSection === 'overview' && (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
                <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-xl border border-emerald-500/30 p-4">
                  <DollarSign className="w-5 h-5 text-emerald-400 mb-2" />
                  <p className="text-2xl font-bold text-white">${(totalRevenue / 1000000).toFixed(2)}M</p>
                  <p className="text-xs text-slate-400 mt-1">Total Revenue</p>
                </div>
                <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 rounded-xl border border-cyan-500/30 p-4">
                  <Users className="w-5 h-5 text-cyan-400 mb-2" />
                  <p className="text-2xl font-bold text-white">{(totalViewers / 1e9).toFixed(2)}B</p>
                  <p className="text-xs text-slate-400 mt-1">Total Viewers</p>
                </div>
                <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-xl border border-amber-500/30 p-4">
                  <TrendingUp className="w-5 h-5 text-amber-400 mb-2" />
                  <p className="text-2xl font-bold text-white">{avgRetention.toFixed(1)}%</p>
                  <p className="text-xs text-slate-400 mt-1">Avg Retention</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl border border-purple-500/30 p-4">
                  <BarChart3 className="w-5 h-5 text-purple-400 mb-2" />
                  <p className="text-2xl font-bold text-white">{activeEmployees}</p>
                  <p className="text-xs text-slate-400 mt-1">Active Employees</p>
                </div>
                <div className="bg-gradient-to-br from-rose-500/20 to-rose-600/10 rounded-xl border border-rose-500/30 p-4">
                  <Activity className="w-5 h-5 text-rose-400 mb-2" />
                  <p className="text-2xl font-bold text-white">{(totalAdImpressions / 1e6).toFixed(1)}M</p>
                  <p className="text-xs text-slate-400 mt-1">Ad Impressions</p>
                </div>
              </div>

              {/* Channel Performance Grid */}
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 lg:p-6">
                <h2 className="text-lg font-semibold text-slate-200 mb-4">Channel Performance</h2>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="text-xs text-slate-400 border-b border-slate-700">
                        <th className="text-left py-3 px-2">Channel</th>
                        <th className="text-right py-3 px-2">Revenue</th>
                        <th className="text-right py-3 px-2">Viewers</th>
                        <th className="text-right py-3 px-2">Retention</th>
                        <th className="text-right py-3 px-2">Growth</th>
                        <th className="text-right py-3 px-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {channelConfigs.map(channel => {
                        const monthly = monthlySummary.find(m => m.channel_id === channel.id);
                        const daily = dailyAnalytics.filter(d => d.channel_id === channel.id);
                        const latestDaily = daily[0];

                        return (
                          <tr key={channel.id} className="text-sm border-b border-slate-700/30">
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: channel.color }} />
                                <span className="text-slate-200 font-medium">{channel.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-2 text-right text-slate-300">
                              ${((monthly?.total_revenue || 0) / 1000).toFixed(0)}K
                            </td>
                            <td className="py-3 px-2 text-right text-slate-300">
                              {((latestDaily?.total_viewers || 0) / 1000).toFixed(0)}K
                            </td>
                            <td className="py-3 px-2 text-right">
                              <span className={Number(monthly?.avg_retention || 0) >= 80 ? 'text-emerald-400' : 'text-amber-400'}>
                                {(monthly?.avg_retention || 0).toFixed(1)}%
                              </span>
                            </td>
                            <td className="py-3 px-2 text-right">
                              <span className={`flex items-center justify-end gap-1 ${
                                (monthly?.growth_percentage || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}>
                                {(monthly?.growth_percentage || 0) >= 0 ? (
                                  <ArrowUpRight className="w-3 h-3" />
                                ) : (
                                  <ArrowDownRight className="w-3 h-3" />
                                )}
                                {(monthly?.growth_percentage || 0).toFixed(1)}%
                              </span>
                            </td>
                            <td className="py-3 px-2 text-right">
                              <span className={`px-2 py-1 rounded text-xs ${
                                channel.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                                channel.status === 'maintenance' ? 'bg-amber-500/20 text-amber-400' :
                                'bg-slate-500/20 text-slate-400'
                              }`}>
                                {channel.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Revenue Section */}
          {activeSection === 'revenue' && (
            <div className="space-y-4">
              {/* Revenue by Channel */}
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 lg:p-6">
                <h2 className="text-lg font-semibold text-slate-200 mb-4">Monthly Revenue Breakdown</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {monthlySummary.map(summary => {
                    const channel = getChannel(summary.channel_id);
                    const percentage = (Number(summary.total_revenue) / totalRevenue) * 100;

                    return (
                      <div key={summary.id} className="bg-slate-700/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: channel?.color }} />
                          <span className="text-sm font-medium text-slate-200">{channel?.name}</span>
                        </div>
                        <p className="text-2xl font-bold text-white mb-2">
                          ${(Number(summary.total_revenue) / 1000).toFixed(0)}K
                        </p>
                        <div className="h-2 bg-slate-600 rounded-full overflow-hidden mb-2">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: channel?.color
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>{percentage.toFixed(1)}% of total</span>
                          <span className={summary.growth_percentage >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {summary.growth_percentage >= 0 ? '+' : ''}{summary.growth_percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Daily Trends */}
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 lg:p-6">
                <h2 className="text-lg font-semibold text-slate-200 mb-4">Daily Ad Revenue Trends</h2>
                <div className="h-48 flex items-end gap-2">
                  {dailyAnalytics.slice(0, 10).map(day => (
                    <div key={day.id} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t"
                        style={{ height: `${(Number(day.ad_revenue) / 300000) * 100}%` }}
                      />
                      <p className="text-xs text-slate-500 mt-1 truncate w-full text-center">
                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Employees Section */}
          {activeSection === 'employees' && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-200">Employee Management</h2>
                <button
                  onClick={() => setShowAddEmployee(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-500"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Employee
                </button>
              </div>

              {/* Employee List */}
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-xs text-slate-400 border-b border-slate-700 bg-slate-800">
                        <th className="text-left py-3 px-4">Employee</th>
                        <th className="text-left py-3 px-4">Role</th>
                        <th className="text-left py-3 px-4">Assigned Channels</th>
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-left py-3 px-4">Last Login</th>
                        <th className="text-right py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map(employee => (
                        <tr key={employee.id} className="text-sm border-b border-slate-700/30 hover:bg-slate-700/20">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-slate-200">{employee.full_name || 'N/A'}</p>
                              <p className="text-xs text-slate-400">{employee.email}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs ${
                              employee.role === 'admin' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'
                            }`}>
                              {employee.role}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              {employee.assigned_channels.length > 0 ? (
                                employee.assigned_channels.map(chId => {
                                  const ch = getChannel(chId);
                                  return (
                                    <span key={chId} className="text-xs bg-slate-700 px-2 py-0.5 rounded text-slate-300">
                                      {ch?.name || chId}
                                    </span>
                                  );
                                })
                              ) : (
                                <span className="text-xs text-slate-500">All channels</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs ${
                              employee.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                            }`}>
                              {employee.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400 text-xs">
                            {employee.last_login
                              ? new Date(employee.last_login).toLocaleDateString()
                              : 'Never'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setSelectedEmployee(employee)}
                                className="p-1.5 rounded hover:bg-slate-600"
                              >
                                <Eye className="w-4 h-4 text-slate-400" />
                              </button>
                              <button
                                onClick={() => handleToggleEmployeeStatus(employee)}
                                className="p-1.5 rounded hover:bg-slate-600"
                              >
                                {employee.is_active ? (
                                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                                ) : (
                                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Employee Modal */}
      {showAddEmployee && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-slate-100">Add New Employee</h3>
              <button onClick={() => setShowAddEmployee(false)} className="p-1.5 hover:bg-slate-700 rounded">
                <Trash2 className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Full Name</label>
                <input
                  type="text"
                  value={newEmployee.fullName}
                  onChange={(e) => setNewEmployee({ ...newEmployee, fullName: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Email</label>
                <input
                  type="email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Password</label>
                <input
                  type="password"
                  value={newEmployee.password}
                  onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200"
                  placeholder="Min 6 characters"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Assign Channels</label>
                <div className="flex flex-wrap gap-2">
                  {channelConfigs.map(channel => (
                    <label key={channel.id} className="flex items-center gap-2 bg-slate-700/50 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-700">
                      <input
                        type="checkbox"
                        checked={newEmployee.assignedChannels.includes(channel.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewEmployee({
                              ...newEmployee,
                              assignedChannels: [...newEmployee.assignedChannels, channel.id]
                            });
                          } else {
                            setNewEmployee({
                              ...newEmployee,
                              assignedChannels: newEmployee.assignedChannels.filter(id => id !== channel.id)
                            });
                          }
                        }}
                        className="w-4 h-4 rounded border-slate-600 text-cyan-600 focus:ring-cyan-500"
                      />
                      <span className="text-xs text-slate-300">{channel.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => setShowAddEmployee(false)}
                className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEmployee}
                disabled={!newEmployee.email || !newEmployee.fullName || !newEmployee.password}
                className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Employee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-slate-100">Employee Details</h3>
              <button onClick={() => setSelectedEmployee(null)} className="p-1.5 hover:bg-slate-700 rounded">
                <Trash2 className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                  {selectedEmployee.full_name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-medium text-slate-200">{selectedEmployee.full_name || 'N/A'}</p>
                  <p className="text-sm text-slate-400">{selectedEmployee.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 bg-slate-700/30 rounded-lg p-3">
                <div>
                  <p className="text-xs text-slate-400">Role</p>
                  <p className="text-sm text-slate-200 capitalize">{selectedEmployee.role}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Status</p>
                  <p className="text-sm text-slate-200">{selectedEmployee.is_active ? 'Active' : 'Inactive'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Created</p>
                  <p className="text-sm text-slate-200">
                    {new Date(selectedEmployee.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Last Login</p>
                  <p className="text-sm text-slate-200">
                    {selectedEmployee.last_login ? new Date(selectedEmployee.last_login).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-2">Assigned Channels</p>
                <div className="flex flex-wrap gap-2">
                  {selectedEmployee.assigned_channels.length > 0 ? (
                    selectedEmployee.assigned_channels.map(chId => {
                      const ch = getChannel(chId);
                      return (
                        <span key={chId} className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">
                          {ch?.name || chId}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-xs text-slate-500">All channels (default)</span>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => setSelectedEmployee(null)}
                className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-600"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleToggleEmployeeStatus(selectedEmployee);
                  setSelectedEmployee(null);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  selectedEmployee.is_active
                    ? 'bg-amber-600 text-white hover:bg-amber-500'
                    : 'bg-emerald-600 text-white hover:bg-emerald-500'
                }`}
              >
                {selectedEmployee.is_active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
