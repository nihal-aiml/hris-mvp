import { useState, useCallback } from 'react';
import { X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import {
  Employee, Department, EmployeeStatus, EmploymentType,
  DEPARTMENT_LABELS, DEPARTMENT_COLORS, EmployeeFormData
} from '../types/employee';
import { employeesApi } from '../api/employees';

interface Props {
  allEmployees: Employee[];
  onClose: () => void;
  onSuccess: () => void;
}

// ── Validation helpers ─────────────────────────────────────────────────────
const NAME_RE   = /^[A-Za-z\s\-']+$/;
const EMAIL_RE  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE  = /^[\d\+\(\)\s]{10,15}$/;

function yearsDiff(from: Date, to: Date) {
  let y = to.getFullYear() - from.getFullYear();
  const m = to.getMonth() - from.getMonth();
  if (m < 0 || (m === 0 && to.getDate() < from.getDate())) y--;
  return y;
}

function validate(form: EmployeeFormData, allEmployees: Employee[]): Record<string, string> {
  const errors: Record<string, string> = {};
  const today = new Date();

  if (!NAME_RE.test(form.firstName))
    errors.firstName = 'Only letters, spaces, hyphens, or apostrophes allowed.';

  if (!NAME_RE.test(form.lastName))
    errors.lastName = 'Only letters, spaces, hyphens, or apostrophes allowed.';

  if (!EMAIL_RE.test(form.email))
    errors.email = 'Invalid email address format.';
  else if (allEmployees.some(e => e.email.toLowerCase() === form.email.toLowerCase()))
    errors.email = 'An employee with this email already exists.';

  if (!PHONE_RE.test(form.phone))
    errors.phone = 'Phone must be 10–15 characters (digits, +, (, ), spaces).';

  let dob: Date | null = null;
  let hire: Date | null = null;

  if (!form.dateOfBirth) {
    errors.dateOfBirth = 'Date of birth is required.';
  } else {
    dob = new Date(form.dateOfBirth);
    const age = yearsDiff(dob, today);
    if (age < 18) errors.dateOfBirth = 'Employee must be at least 18 years old.';
    else if (age > 100) errors.dateOfBirth = 'Employee cannot be older than 100 years.';
  }

  if (!form.hireDate) {
    errors.hireDate = 'Hire date is required.';
  } else {
    hire = new Date(form.hireDate);
    const minHire = new Date('2000-01-01');
    const maxHire = new Date(today);
    maxHire.setMonth(maxHire.getMonth() + 3);

    if (hire < minHire) errors.hireDate = 'Hire date cannot be before Jan 1, 2000.';
    else if (hire > maxHire) errors.hireDate = 'Hire date cannot be more than 3 months in the future.';
    else if (dob) {
      const ageAtHire = yearsDiff(dob, hire);
      if (ageAtHire < 18) errors.hireDate = 'Employee must be ≥ 18 years old at hire date.';
    }
  }

  if (!form.jobTitle.trim()) errors.jobTitle = 'Job title is required.';
  if (!form.location.trim()) errors.location = 'Location is required.';

  return errors;
}

const PALETTE = [
  '#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981',
  '#3b82f6','#ef4444','#14b8a6','#f97316','#84cc16',
];

const EMPTY: EmployeeFormData = {
  firstName: '', lastName: '', email: '', phone: '',
  jobTitle: '', department: 'ENGINEERING', status: 'ONBOARDING',
  employmentType: 'FULL_TIME', hireDate: '', dateOfBirth: '',
  location: '', avatarColor: PALETTE[Math.floor(Math.random() * PALETTE.length)],
  isTopLevel: false, managerId: null,
  emergencyContactName: '', emergencyContactRelationship: '', emergencyContactPhone: '',
};

interface FieldProps {
  id: string; label: string; error?: string; required?: boolean;
  children: React.ReactNode;
}
function FormField({ id, label, error, required, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
          <AlertCircle size={11} />
          {error}
        </p>
      )}
    </div>
  );
}

const inputCls = `w-full px-3 py-2 text-sm rounded-lg border outline-none transition-all`;
const inputStyle = {
  background: 'var(--color-surface-2)',
  borderColor: 'var(--color-border-2)',
  color: 'var(--color-text)',
};

export default function AddEmployeeModal({ allEmployees, onClose, onSuccess }: Props) {
  const [form, setForm] = useState<EmployeeFormData>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Auto-generate employee ID
  const nextId = `EMP-${String(allEmployees.length + 1).padStart(3, '0')}`;

  const set = useCallback((key: keyof EmployeeFormData, val: unknown) => {
    setForm(prev => ({ ...prev, [key]: val }));
    setFieldErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  }, []);

  const handleSubmit = async () => {
    const errors = validate(form, allEmployees);
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }

    setLoading(true);
    setApiError(null);
    try {
      await employeesApi.create({ ...form, employeeId: nextId } as any);
      setSuccess(true);
      setTimeout(onSuccess, 1000);
    } catch (err: any) {
      setApiError(err.message || 'Failed to create employee');
    } finally {
      setLoading(false);
    }
  };

  // Name field: block numeric input in real-time
  const handleNameKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (/\d/.test(e.key)) {
      e.preventDefault();
      const field = e.currentTarget.name as keyof EmployeeFormData;
      setFieldErrors(prev => ({ ...prev, [field]: 'Numbers are not allowed in name fields.' }));
    }
  };

  const section = (title: string) => (
    <div className="col-span-2 pt-2">
      <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 border-b pb-2" style={{ borderColor: 'var(--color-border)' }}>
        {title}
      </p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div>
            <h2 className="text-lg font-bold text-white">Add New Employee</h2>
            <p className="text-xs text-slate-400">New ID will be: <span className="font-mono text-indigo-400">{nextId}</span></p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Form body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {success && (
            <div className="flex items-center gap-3 p-4 mb-4 rounded-xl text-green-400 border border-green-500/30" style={{ background: 'rgba(16,185,129,0.1)' }}>
              <CheckCircle size={18} />
              Employee created successfully!
            </div>
          )}
          {apiError && (
            <div className="flex items-center gap-3 p-4 mb-4 rounded-xl text-red-400 border border-red-500/30" style={{ background: 'rgba(239,68,68,0.1)' }}>
              <AlertCircle size={18} />
              {apiError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {section('Personal Information')}

            <FormField id="firstName" label="First Name" error={fieldErrors.firstName} required>
              <input
                id="firstName" name="firstName" type="text"
                value={form.firstName} onChange={e => set('firstName', e.target.value)}
                onKeyDown={handleNameKey}
                placeholder="e.g. Victoria"
                className={`${inputCls} ${fieldErrors.firstName ? 'border-red-500/60' : ''}`}
                style={inputStyle}
              />
            </FormField>

            <FormField id="lastName" label="Last Name" error={fieldErrors.lastName} required>
              <input
                id="lastName" name="lastName" type="text"
                value={form.lastName} onChange={e => set('lastName', e.target.value)}
                onKeyDown={handleNameKey}
                placeholder="e.g. Harrington"
                className={`${inputCls} ${fieldErrors.lastName ? 'border-red-500/60' : ''}`}
                style={inputStyle}
              />
            </FormField>

            <FormField id="email" label="Email Address" error={fieldErrors.email} required>
              <input
                id="email" type="email"
                value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="email@acme.com"
                className={`${inputCls} ${fieldErrors.email ? 'border-red-500/60' : ''}`}
                style={inputStyle}
              />
            </FormField>

            <FormField id="phone" label="Phone Number" error={fieldErrors.phone} required>
              <input
                id="phone" type="text"
                value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="+1 (555) 000-0000"
                className={`${inputCls} ${fieldErrors.phone ? 'border-red-500/60' : ''}`}
                style={inputStyle}
              />
            </FormField>

            <FormField id="dateOfBirth" label="Date of Birth" error={fieldErrors.dateOfBirth} required>
              <input
                id="dateOfBirth" type="date"
                value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)}
                className={`${inputCls} ${fieldErrors.dateOfBirth ? 'border-red-500/60' : ''}`}
                style={inputStyle}
              />
              <p className="text-xs text-slate-500 mt-1">Must be 18–100 years ago</p>
            </FormField>

            <FormField id="location" label="Location" error={fieldErrors.location} required>
              <input
                id="location" type="text"
                value={form.location} onChange={e => set('location', e.target.value)}
                placeholder="e.g. New York, NY"
                className={`${inputCls} ${fieldErrors.location ? 'border-red-500/60' : ''}`}
                style={inputStyle}
              />
            </FormField>

            {section('Employment Details')}

            <FormField id="jobTitle" label="Job Title" error={fieldErrors.jobTitle} required>
              <input
                id="jobTitle" type="text"
                value={form.jobTitle} onChange={e => set('jobTitle', e.target.value)}
                placeholder="e.g. Senior Software Engineer"
                className={`${inputCls} ${fieldErrors.jobTitle ? 'border-red-500/60' : ''}`}
                style={inputStyle}
              />
            </FormField>

            <FormField id="department" label="Department" required>
              <select id="department" value={form.department}
                onChange={e => set('department', e.target.value as Department)}
                className={inputCls} style={inputStyle}
              >
                {Object.entries(DEPARTMENT_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </FormField>

            <FormField id="hireDate" label="Hire Date" error={fieldErrors.hireDate} required>
              <input
                id="hireDate" type="date"
                value={form.hireDate} onChange={e => set('hireDate', e.target.value)}
                className={`${inputCls} ${fieldErrors.hireDate ? 'border-red-500/60' : ''}`}
                style={inputStyle}
              />
              <p className="text-xs text-slate-500 mt-1">Min: Jan 1 2000 · Max: +3 months from today</p>
            </FormField>

            <FormField id="employmentType" label="Employment Type" required>
              <select id="employmentType" value={form.employmentType}
                onChange={e => set('employmentType', e.target.value as EmploymentType)}
                className={inputCls} style={inputStyle}
              >
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
              </select>
            </FormField>

            <FormField id="status" label="Status" required>
              <select id="status" value={form.status}
                onChange={e => set('status', e.target.value as EmployeeStatus)}
                className={inputCls} style={inputStyle}
              >
                <option value="ONBOARDING">Onboarding</option>
                <option value="ACTIVE">Active</option>
                <option value="ON_LEAVE">On Leave</option>
              </select>
            </FormField>

            <FormField id="managerId" label="Direct Manager">
              <select
                id="managerId"
                value={form.managerId || ''}
                onChange={e => set('managerId', e.target.value || null)}
                className={inputCls} style={inputStyle}
                disabled={form.isTopLevel}
              >
                <option value="">— No Manager (CEO)</option>
                {allEmployees.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.firstName} {e.lastName} — {e.jobTitle}
                  </option>
                ))}
              </select>
            </FormField>

            <div className="flex items-center gap-3 mt-1">
              <input
                id="isTopLevel" type="checkbox"
                checked={form.isTopLevel}
                onChange={e => { set('isTopLevel', e.target.checked); if (e.target.checked) set('managerId', null); }}
                className="w-4 h-4 accent-indigo-500 cursor-pointer"
              />
              <label htmlFor="isTopLevel" className="text-sm text-slate-300 cursor-pointer">
                Mark as CEO / Top-level (no manager)
              </label>
            </div>

            {section('Emergency Contact')}

            <FormField id="ecName" label="Contact Name">
              <input id="ecName" type="text"
                value={form.emergencyContactName}
                onChange={e => set('emergencyContactName', e.target.value)}
                placeholder="Full name"
                className={inputCls} style={inputStyle}
              />
            </FormField>

            <FormField id="ecRelationship" label="Relationship">
              <input id="ecRelationship" type="text"
                value={form.emergencyContactRelationship}
                onChange={e => set('emergencyContactRelationship', e.target.value)}
                placeholder="e.g. Spouse, Parent"
                className={inputCls} style={inputStyle}
              />
            </FormField>

            <FormField id="ecPhone" label="Contact Phone">
              <input id="ecPhone" type="text"
                value={form.emergencyContactPhone}
                onChange={e => set('emergencyContactPhone', e.target.value)}
                placeholder="+1 (555) 000-0000"
                className={inputCls} style={inputStyle}
              />
            </FormField>

            {/* Avatar color picker */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
                Avatar Color
              </p>
              <div className="flex gap-2 flex-wrap">
                {PALETTE.map(c => (
                  <button
                    key={c} type="button"
                    onClick={() => set('avatarColor', c)}
                    className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                    style={{
                      background: c,
                      outline: form.avatarColor === c ? `3px solid ${c}` : 'none',
                      outlineOffset: 2,
                    }}
                  />
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${form.avatarColor}, ${form.avatarColor}88)` }}>
                  {(form.firstName[0] || 'A').toUpperCase()}{(form.lastName[0] || 'B').toUpperCase()}
                </div>
                <span className="text-xs text-slate-400">Preview</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-4 shrink-0 border-t"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-slate-300 rounded-lg border hover:bg-white/5 transition-all"
            style={{ borderColor: 'var(--color-border-2)' }}
          >
            Cancel
          </button>
          <button
            id="submit-employee-btn"
            onClick={handleSubmit}
            disabled={loading || success}
            className="flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : null}
            {success ? 'Created!' : loading ? 'Creating…' : 'Create Employee'}
          </button>
        </div>
      </div>
    </div>
  );
}
