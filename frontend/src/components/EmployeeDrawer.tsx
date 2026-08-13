import { useState, useEffect } from 'react';
import {
  X, GitBranch, Mail, Phone, MapPin, Calendar, Briefcase,
  User, AlertTriangle, ChevronRight, UserX
} from 'lucide-react';
import {
  Employee,
  DEPARTMENT_LABELS, DEPARTMENT_COLORS, STATUS_LABELS, EMPLOYMENT_TYPE_LABELS
} from '../types/employee';
import { employeesApi } from '../api/employees';

interface Props {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onViewInOrgChart: (id: string) => void;
  onManagerClick: (emp: Employee) => void;
  allEmployees: Employee[];
  onOffboarded: (updated: Employee) => void;
}

type DrawerTab = 'personal' | 'employment' | 'emergency';

function Avatar({ emp, size = 56 }: { emp: Employee; size?: number }) {
  const initials = `${emp.firstName[0]}${emp.lastName[0]}`.toUpperCase();
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%',
        background: `linear-gradient(135deg, ${emp.avatarColor}, ${emp.avatarColor}88)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size > 40 ? 20 : 14, fontWeight: 700, color: '#fff',
        boxShadow: `0 0 0 3px ${emp.avatarColor}33, 0 8px 24px ${emp.avatarColor}44`,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

function Field({ icon, label, value }: { icon?: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
      {icon && (
        <div className="mt-0.5 shrink-0 text-indigo-400">{icon}</div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium uppercase tracking-wider mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
          {label}
        </div>
        <div className="text-sm text-slate-200 break-words">{value || '—'}</div>
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

export default function EmployeeDrawer({ employee, isOpen, onClose, onViewInOrgChart, onManagerClick, allEmployees, onOffboarded }: Props) {
  const [tab, setTab] = useState<DrawerTab>('personal');
  const [animClass, setAnimClass] = useState('');
  const [visible, setVisible] = useState(false);
  const [offboardLoading, setOffboardLoading] = useState(false);
  const [offboardError, setOffboardError] = useState<string | null>(null);
  const [confirmOffboard, setConfirmOffboard] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setAnimClass('drawer-enter');
      setTab('personal');
      setOffboardError(null);
      setConfirmOffboard(false);
    } else if (visible) {
      setAnimClass('drawer-exit');
      const t = setTimeout(() => setVisible(false), 220);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!visible || !employee) return null;

  const deptColor = DEPARTMENT_COLORS[employee.department];
  const managerEmployee = employee.managerId
    ? allEmployees.find(e => e.id === employee.managerId) || null
    : null;

  const tabBtn = (t: DrawerTab, label: string) => (
    <button
      id={`drawer-tab-${t}`}
      onClick={() => setTab(t)}
      className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap ${
        tab === t ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
      }`}
    >
      {label}
    </button>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 ${isOpen ? 'backdrop-enter' : 'backdrop-exit'}`}
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full z-50 flex flex-col overflow-hidden ${animClass}`}
        style={{
          width: 'min(440px, 35vw)',
          background: 'var(--color-surface)',
          borderLeft: '1px solid var(--color-border)',
          boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* ── Header ──────────────────────────────────────── */}
        <div
          className="shrink-0 p-6 pb-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          {/* Top row */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar emp={employee} size={56} />
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-white truncate">
                  {employee.firstName} {employee.lastName}
                </h2>
                <p className="text-sm text-slate-400 truncate">{employee.jobTitle}</p>
                <span
                  className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium"
                  style={{ background: `${deptColor}20`, color: deptColor, border: `1px solid ${deptColor}40` }}
                >
                  {DEPARTMENT_LABELS[employee.department]}
                </span>
              </div>
            </div>
            <button
              id="drawer-close-btn"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {/* View in Org Chart button */}
          <button
            id="view-in-orgchart-btn"
            onClick={() => onViewInOrgChart(employee.id)}
            className="w-full flex items-center justify-center gap-2 py-2 mb-4 rounded-lg text-sm font-medium text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/10 transition-all duration-200"
          >
            <GitBranch size={14} />
            View in Org Chart
          </button>

          {/* Status pills */}
          <div className="flex items-center gap-2 mb-4">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              { ACTIVE: 'badge-active', ON_LEAVE: 'badge-on-leave', ONBOARDING: 'badge-onboarding', INACTIVE: 'badge-inactive' }[employee.status]
            }`}>
              <span className="w-1.5 h-1.5 rounded-full" style={{
                background: { ACTIVE: '#34d399', ON_LEAVE: '#fbbf24', ONBOARDING: '#a5b4fc', INACTIVE: '#94a3b8' }[employee.status]
              }} />
              {STATUS_LABELS[employee.status]}
            </span>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs text-slate-400">{EMPLOYMENT_TYPE_LABELS[employee.employmentType]}</span>
          </div>

          {/* Tabs */}
          <div className="flex border-b -mx-6 px-6" style={{ borderColor: 'var(--color-border)' }}>
            {tabBtn('personal', 'Personal')}
            {tabBtn('employment', 'Employment')}
            {tabBtn('emergency', 'Emergency')}
          </div>
        </div>

        {/* ── Tab Content ───────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'personal' && (
            <div>
              <Field icon={<Mail size={15} />} label="Email Address" value={
                <a href={`mailto:${employee.email}`} className="text-indigo-400 hover:underline">{employee.email}</a>
              } />
              <Field icon={<Phone size={15} />} label="Phone Number" value={employee.phone} />
              <Field icon={<MapPin size={15} />} label="Location" value={employee.location} />
              <Field icon={<Calendar size={15} />} label="Date of Birth" value={formatDate(employee.dateOfBirth)} />
            </div>
          )}

          {tab === 'employment' && (
            <div>
              <Field icon={<User size={15} />} label="Employee ID" value={
                <span className="font-mono text-indigo-400">{employee.employeeId}</span>
              } />
              <Field icon={<Calendar size={15} />} label="Hire Date" value={formatDate(employee.hireDate)} />
              {employee.terminationDate && (
                <Field icon={<Calendar size={15} />} label="Termination Date" value={formatDate(employee.terminationDate)} />
              )}
              <Field icon={<Briefcase size={15} />} label="Employment Type" value={EMPLOYMENT_TYPE_LABELS[employee.employmentType]} />
              <Field label="Direct Manager" value={
                managerEmployee ? (
                  <button
                    className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition-colors"
                    onClick={() => onManagerClick(managerEmployee)}
                  >
                    <span className="w-5 h-5 rounded-full text-xs flex items-center justify-center text-white"
                      style={{ background: managerEmployee.avatarColor }}>
                      {managerEmployee.firstName[0]}
                    </span>
                    {managerEmployee.firstName} {managerEmployee.lastName}
                    <ChevronRight size={14} />
                  </button>
                ) : (
                  <span className="text-indigo-400 font-medium">— CEO / Founder</span>
                )
              } />
              {employee.directReports.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-3">
                    Direct Reports ({employee.directReports.length})
                  </p>
                  <div className="flex flex-col gap-2">
                    {employee.directReports.map(dr => (
                      <div key={dr.id} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'var(--color-surface-2)' }}>
                        <div className="w-7 h-7 rounded-full text-xs flex items-center justify-center text-white font-bold shrink-0"
                          style={{ background: dr.avatarColor }}>
                          {dr.firstName[0]}{dr.lastName[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-200 truncate">{dr.firstName} {dr.lastName}</p>
                          <p className="text-xs text-slate-500 truncate">{dr.jobTitle}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'emergency' && (
            <div>
              {employee.emergencyContactName ? (
                <>
                  <Field icon={<User size={15} />} label="Contact Name" value={employee.emergencyContactName} />
                  <Field label="Relationship" value={employee.emergencyContactRelationship} />
                  <Field icon={<Phone size={15} />} label="Contact Phone" value={employee.emergencyContactPhone} />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
                  <AlertTriangle size={32} className="opacity-40" />
                  <p className="text-sm">No emergency contact on file</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Offboard Button ─────────────────────────────────── */}
        {employee.status !== 'INACTIVE' && (
          <div className="shrink-0 p-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            {offboardError && (
              <div className="flex items-start gap-2 mb-3 p-3 rounded-lg text-xs text-red-400"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>{offboardError}</span>
              </div>
            )}
            {confirmOffboard ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-slate-400 text-center mb-1">
                  This will permanently mark <strong className="text-white">{employee.firstName} {employee.lastName}</strong> as Inactive.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmOffboard(false)}
                    className="flex-1 py-2 rounded-lg text-sm font-medium text-slate-400 border transition-all hover:bg-white/5"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    Cancel
                  </button>
                  <button
                    id="confirm-offboard-btn"
                    disabled={offboardLoading}
                    onClick={async () => {
                      setOffboardLoading(true);
                      setOffboardError(null);
                      try {
                        const updated = await employeesApi.offboard(employee.id);
                        onOffboarded(updated);
                      } catch (err: any) {
                        setOffboardError(err.message || 'Offboard failed.');
                        setConfirmOffboard(false);
                      } finally {
                        setOffboardLoading(false);
                      }
                    }}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition-all"
                    style={{ background: offboardLoading ? '#6b2020' : 'linear-gradient(135deg,#dc2626,#b91c1c)' }}
                  >
                    {offboardLoading ? 'Processing…' : 'Confirm Offboard'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                id="offboard-employee-btn"
                onClick={() => { setConfirmOffboard(true); setOffboardError(null); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-all duration-200"
              >
                <UserX size={15} />
                Offboard Employee
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
