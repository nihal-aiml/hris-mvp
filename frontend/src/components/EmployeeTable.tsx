import { useState } from 'react';
import {
  Search, SlidersHorizontal, Plus, ChevronUp, ChevronDown,
  Loader2, AlertCircle, Users
} from 'lucide-react';
import {
  Employee, Department, EmployeeStatus,
  DEPARTMENT_LABELS, DEPARTMENT_COLORS, STATUS_LABELS
} from '../types/employee';
import AddEmployeeModal from './AddEmployeeModal';

interface Props {
  employees: Employee[];
  allEmployees: Employee[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  departmentFilter: Department | 'ALL';
  onDepartmentChange: (v: Department | 'ALL') => void;
  statusFilter: EmployeeStatus | 'ALL';
  onStatusChange: (v: EmployeeStatus | 'ALL') => void;
  hireDateFrom: string;
  onHireDateFromChange: (v: string) => void;
  hireDateTo: string;
  onHireDateToChange: (v: string) => void;
  dateError: string | null;
  onRowClick: (emp: Employee) => void;
  onEmployeeAdded: () => void;
}

type SortKey = 'name' | 'employeeId' | 'department' | 'status';
type SortDir = 'asc' | 'desc';

function Avatar({ emp }: { emp: Employee }) {
  const initials = `${emp.firstName[0]}${emp.lastName[0]}`.toUpperCase();
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-md"
      style={{ background: `linear-gradient(135deg, ${emp.avatarColor}, ${emp.avatarColor}99)` }}
    >
      {initials}
    </div>
  );
}

function StatusBadge({ status }: { status: EmployeeStatus }) {
  const cls = {
    ACTIVE: 'badge-active',
    ON_LEAVE: 'badge-on-leave',
    ONBOARDING: 'badge-onboarding',
    INACTIVE: 'badge-inactive',
  }[status];
  const dot = {
    ACTIVE: '#34d399',
    ON_LEAVE: '#fbbf24',
    ONBOARDING: '#a5b4fc',
    INACTIVE: '#94a3b8',
  }[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: dot }} />
      {STATUS_LABELS[status]}
    </span>
  );
}

function DeptBadge({ dept }: { dept: Department }) {
  const color = DEPARTMENT_COLORS[dept];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}
    >
      {DEPARTMENT_LABELS[dept]}
    </span>
  );
}

export default function EmployeeTable({
  employees, allEmployees, loading, error,
  searchQuery, onSearchChange,
  departmentFilter, onDepartmentChange,
  statusFilter, onStatusChange,
  hireDateFrom, onHireDateFromChange,
  hireDateTo, onHireDateToChange,
  dateError,
  onRowClick, onEmployeeAdded,
}: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [showModal, setShowModal] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sorted = [...employees].sort((a, b) => {
    let av = '', bv = '';
    if (sortKey === 'name') { av = `${a.firstName} ${a.lastName}`; bv = `${b.firstName} ${b.lastName}`; }
    else if (sortKey === 'employeeId') { av = a.employeeId; bv = b.employeeId; }
    else if (sortKey === 'department') { av = a.department; bv = b.department; }
    else if (sortKey === 'status') { av = a.status; bv = b.status; }
    return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronUp size={12} className="opacity-30" />;
    return sortDir === 'asc' ? <ChevronUp size={12} className="opacity-90" /> : <ChevronDown size={12} className="opacity-90" />;
  };

  const thClass = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none whitespace-nowrap';

  return (
    <div className="flex flex-col h-full">
      {/* ── Toolbar ───────────────────────────────────────────── */}
      <div
        className="flex flex-wrap items-center gap-3 px-6 py-4 shrink-0 border-b"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="employee-search"
            type="text"
            placeholder="Search by name, email, or role…"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border outline-none transition-all"
            style={{
              background: 'var(--color-surface-2)',
              borderColor: 'var(--color-border-2)',
              color: 'var(--color-text)',
            }}
          />
        </div>

        {/* Department filter */}
        <div className="relative flex items-center gap-1">
          <SlidersHorizontal size={14} className="text-slate-400" />
          <select
            id="dept-filter"
            value={departmentFilter}
            onChange={e => onDepartmentChange(e.target.value as Department | 'ALL')}
            className="pl-2 pr-7 py-2 text-sm rounded-lg border outline-none appearance-none cursor-pointer"
            style={{
              background: 'var(--color-surface-2)',
              borderColor: 'var(--color-border-2)',
              color: 'var(--color-text)',
            }}
          >
            <option value="ALL">All Departments</option>
            {Object.entries(DEPARTMENT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <select
          id="status-filter"
          value={statusFilter}
          onChange={e => onStatusChange(e.target.value as EmployeeStatus | 'ALL')}
          className="pl-3 pr-7 py-2 text-sm rounded-lg border outline-none appearance-none cursor-pointer"
          style={{
            background: 'var(--color-surface-2)',
            borderColor: 'var(--color-border-2)',
            color: 'var(--color-text)',
          }}
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="ON_LEAVE">On Leave</option>
          <option value="ONBOARDING">Onboarding</option>
          <option value="INACTIVE">Inactive</option>
        </select>

        {/* Date From Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400">Hired From:</span>
          <input
            id="hire-date-from"
            type="date"
            min="2000-01-01"
            max={hireDateTo || undefined}
            value={hireDateFrom}
            onChange={e => onHireDateFromChange(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border outline-none cursor-pointer transition-all"
            style={{
              background: 'var(--color-surface-2)',
              borderColor: hireDateFrom ? 'var(--color-accent)' : 'var(--color-border-2)',
              color: 'var(--color-text)',
            }}
          />
        </div>

        {/* Date To Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400">To:</span>
          <input
            id="hire-date-to"
            type="date"
            min={hireDateFrom || "2000-01-01"}
            value={hireDateTo}
            onChange={e => onHireDateToChange(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border outline-none cursor-pointer transition-all"
            style={{
              background: 'var(--color-surface-2)',
              borderColor: hireDateTo ? 'var(--color-accent)' : 'var(--color-border-2)',
              color: 'var(--color-text)',
            }}
          />
        </div>

        {/* Clear Date Filters Button */}
        {(hireDateFrom || hireDateTo) && (
          <button
            id="clear-date-filters"
            onClick={() => {
              onHireDateFromChange('');
              onHireDateToChange('');
            }}
            className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors py-1.5 px-2.5 rounded-lg border border-red-500/20 hover:bg-red-500/10 cursor-pointer"
          >
            Clear Dates
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-slate-400">
            {employees.length} employee{employees.length !== 1 ? 's' : ''}
          </span>
          <button
            id="add-employee-btn"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <Plus size={15} />
            Add Employee
          </button>
        </div>
      </div>

      {/* ── Date Validation Error Banner ── */}
      {dateError && (
        <div
          className="flex items-center gap-2 px-6 py-2 text-xs font-medium text-red-400 border-b border-red-500/20 shrink-0"
          style={{ background: 'rgba(239,68,68,0.08)' }}
        >
          <AlertCircle size={14} className="shrink-0" />
          <span>{dateError}</span>
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        {loading && (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Loader2 size={32} className="text-indigo-400 animate-spin" />
            <p className="text-slate-400 text-sm">Loading employees…</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <AlertCircle size={32} className="text-red-400" />
            <p className="text-red-400 text-sm">{error}</p>
            <p className="text-slate-500 text-xs">Make sure the backend is running on port 3001</p>
          </div>
        )}

        {!loading && !error && (
          <table className="w-full border-collapse">
            <thead style={{ background: 'var(--color-surface)', position: 'sticky', top: 0, zIndex: 10 }}>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th
                  className={thClass}
                  style={{ color: 'var(--color-text-muted)' }}
                  onClick={() => handleSort('name')}
                >
                  <span className="flex items-center gap-1">Employee <SortIcon col="name" /></span>
                </th>
                <th
                  className={thClass}
                  style={{ color: 'var(--color-text-muted)' }}
                  onClick={() => handleSort('employeeId')}
                >
                  <span className="flex items-center gap-1">ID <SortIcon col="employeeId" /></span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Job Title</th>
                <th
                  className={thClass}
                  style={{ color: 'var(--color-text-muted)' }}
                  onClick={() => handleSort('department')}
                >
                  <span className="flex items-center gap-1">Department <SortIcon col="department" /></span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Manager</th>
                <th
                  className={thClass}
                  style={{ color: 'var(--color-text-muted)' }}
                  onClick={() => handleSort('status')}
                >
                  <span className="flex items-center gap-1">Status <SortIcon col="status" /></span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-20">
                    <div className="flex flex-col items-center gap-3 text-slate-500">
                      <Users size={40} className="opacity-30" />
                      <p className="text-sm">No employees found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sorted.map((emp) => (
                  <tr
                    key={emp.id}
                    id={`row-${emp.id}`}
                    onClick={() => onRowClick(emp)}
                    className="table-row-hover cursor-pointer border-b"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar emp={emp} />
                        <div>
                          <div className="text-sm font-semibold text-slate-100">
                            {emp.firstName} {emp.lastName}
                          </div>
                          <div className="text-xs text-slate-400">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-indigo-400">{emp.employeeId}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{emp.jobTitle}</td>
                    <td className="px-4 py-3"><DeptBadge dept={emp.department} /></td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : (
                        <span className="text-xs text-indigo-400 font-medium">— CEO</span>
                      )}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={emp.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Employee Modal */}
      {showModal && (
        <AddEmployeeModal
          allEmployees={allEmployees}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); onEmployeeAdded(); }}
        />
      )}
    </div>
  );
}
