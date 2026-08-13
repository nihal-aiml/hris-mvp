import { useState, useEffect, useCallback } from 'react';
import { Employee, Department, EmployeeStatus } from '../types/employee';
import { employeesApi } from '../api/employees';

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Shared drawer state – works from both Table and OrgChart
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<Department | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | 'ALL'>('ALL');

  // Date Filters
  const [hireDateFrom, setHireDateFrom] = useState('');
  const [hireDateTo, setHireDateTo] = useState('');
  const [dateError, setDateError] = useState<string | null>(null);

  // Org chart highlight (used by "View in Org Chart" button)
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    const minDate = new Date('2000-01-01');

    if (hireDateFrom && new Date(hireDateFrom) < minDate) {
      setDateError('Date cannot be earlier than January 1, 2000.');
      return;
    }
    if (hireDateTo && new Date(hireDateTo) < minDate) {
      setDateError('Date cannot be earlier than January 1, 2000.');
      return;
    }
    if (hireDateFrom && hireDateTo && new Date(hireDateFrom) > new Date(hireDateTo)) {
      setDateError("'From' date must be before 'To' date.");
      return;
    }

    setDateError(null);

    try {
      setLoading(true);
      setError(null);
      const data = await employeesApi.getAll({
        hireDateFrom: hireDateFrom || undefined,
        hireDateTo: hireDateTo || undefined,
      });
      setEmployees(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, [hireDateFrom, hireDateTo]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const openDrawer = useCallback((employee: Employee) => {
    setSelectedEmployee(employee);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setTimeout(() => setSelectedEmployee(null), 300);
  }, []);

  const filteredEmployees = employees.filter((emp) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      emp.jobTitle.toLowerCase().includes(q) ||
      emp.employeeId.toLowerCase().includes(q);

    const matchesDept =
      departmentFilter === 'ALL' || emp.department === departmentFilter;
    const matchesStatus =
      statusFilter === 'ALL' || emp.status === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  return {
    employees,
    setEmployees,
    filteredEmployees,
    loading,
    error,
    fetchEmployees,
    selectedEmployee,
    setSelectedEmployee,
    drawerOpen,
    openDrawer,
    closeDrawer,
    searchQuery,
    setSearchQuery,
    departmentFilter,
    setDepartmentFilter,
    statusFilter,
    setStatusFilter,
    hireDateFrom,
    setHireDateFrom,
    hireDateTo,
    setHireDateTo,
    dateError,
    highlightedId,
    setHighlightedId,
  };
}
