import { useState } from 'react';
import { Users, GitBranch, Building2 } from 'lucide-react';
import { useEmployees } from './hooks/useEmployees';
import EmployeeTable from './components/EmployeeTable';
import EmployeeDrawer from './components/EmployeeDrawer';
import OrgChart from './components/OrgChart';
import type { Employee } from './types/employee';

type Tab = 'directory' | 'orgchart';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('directory');
  const hook = useEmployees();

  const handleViewInOrgChart = (id: string) => {
    hook.setHighlightedId(id);
    setActiveTab('orgchart');
    hook.closeDrawer();
  };

  const handleOffboarded = (updated: Employee) => {
    // Update the employee in the shared list so Table reflects new INACTIVE status immediately
    hook.setEmployees(prev => prev.map(e => e.id === updated.id ? updated : e));
    // Update the selected employee in the drawer to show the Inactive badge
    hook.setSelectedEmployee(updated);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--color-bg)' }}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <header
        className="flex items-center justify-between px-6 py-3 shrink-0 border-b"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <Building2 size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-none">Trainery One</h1>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Human Resource Information System
            </p>
          </div>
        </div>

        {/* Tab navigation */}
        <nav className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <button
            id="tab-directory"
            onClick={() => setActiveTab('directory')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'directory'
                ? 'text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
              }`}
            style={
              activeTab === 'directory'
                ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }
                : {}
            }
          >
            <Users size={15} />
            Directory
          </button>
          <button
            id="tab-orgchart"
            onClick={() => setActiveTab('orgchart')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'orgchart'
                ? 'text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
              }`}
            style={
              activeTab === 'orgchart'
                ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }
                : {}
            }
          >
            <GitBranch size={15} />
            Org Chart
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)' }}
          >
            A
          </div>
          <span className="text-sm text-slate-300">Admin</span>
        </div>
      </header>

      {/* ── Main Content ────────────────────────────────────────── */}
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'directory' && (
          <EmployeeTable
            employees={hook.filteredEmployees}
            allEmployees={hook.employees}
            loading={hook.loading}
            error={hook.error}
            searchQuery={hook.searchQuery}
            onSearchChange={hook.setSearchQuery}
            departmentFilter={hook.departmentFilter}
            onDepartmentChange={hook.setDepartmentFilter}
            statusFilter={hook.statusFilter}
            onStatusChange={hook.setStatusFilter}
            hireDateFrom={hook.hireDateFrom}
            onHireDateFromChange={hook.setHireDateFrom}
            hireDateTo={hook.hireDateTo}
            onHireDateToChange={hook.setHireDateTo}
            dateError={hook.dateError}
            onRowClick={hook.openDrawer}
            onEmployeeAdded={hook.fetchEmployees}
          />
        )}
        {activeTab === 'orgchart' && (
          <OrgChart
            employees={hook.employees.filter(e => e.status !== 'INACTIVE')}
            loading={hook.loading}
            onNodeClick={hook.openDrawer}
            highlightedId={hook.highlightedId}
            onHighlightClear={() => hook.setHighlightedId(null)}
          />
        )}
      </main>

      {/* ── Shared Slide-out Drawer ──────────────────────────────── */}
      <EmployeeDrawer
        employee={hook.selectedEmployee}
        isOpen={hook.drawerOpen}
        onClose={hook.closeDrawer}
        onViewInOrgChart={handleViewInOrgChart}
        onManagerClick={(emp) => hook.openDrawer(emp)}
        allEmployees={hook.employees}
        onOffboarded={handleOffboarded}
      />
    </div>
  );
}
