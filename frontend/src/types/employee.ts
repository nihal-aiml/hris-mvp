export type Department =
  | 'ENGINEERING'
  | 'PRODUCT'
  | 'DESIGN'
  | 'MARKETING'
  | 'SALES'
  | 'HR'
  | 'FINANCE'
  | 'OPERATIONS'
  | 'LEGAL';

export type EmployeeStatus = 'ACTIVE' | 'ON_LEAVE' | 'ONBOARDING' | 'INACTIVE';
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT';

export interface ManagerRef {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
}

export interface DirectReport {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  department: Department;
  avatarColor: string;
}

export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  department: Department;
  status: EmployeeStatus;
  employmentType: EmploymentType;
  hireDate: string;
  dateOfBirth: string;
  location: string;
  avatarColor: string;
  isTopLevel: boolean;
  managerId: string | null;
  manager: ManagerRef | null;
  directReports: DirectReport[];
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactPhone?: string;
  terminationDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  department: Department;
  status: EmployeeStatus;
  employmentType: EmploymentType;
  hireDate: string;
  dateOfBirth: string;
  location: string;
  avatarColor: string;
  isTopLevel: boolean;
  managerId: string | null;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
}

export const DEPARTMENT_COLORS: Record<Department, string> = {
  ENGINEERING: '#6366f1',
  PRODUCT: '#8b5cf6',
  DESIGN: '#ec4899',
  MARKETING: '#f59e0b',
  SALES: '#10b981',
  HR: '#3b82f6',
  FINANCE: '#ef4444',
  OPERATIONS: '#14b8a6',
  LEGAL: '#f97316',
};

export const DEPARTMENT_LABELS: Record<Department, string> = {
  ENGINEERING: 'Engineering',
  PRODUCT: 'Product',
  DESIGN: 'Design',
  MARKETING: 'Marketing',
  SALES: 'Sales',
  HR: 'Human Resources',
  FINANCE: 'Finance',
  OPERATIONS: 'Operations',
  LEGAL: 'Legal',
};

export const STATUS_LABELS: Record<EmployeeStatus, string> = {
  ACTIVE: 'Active',
  ON_LEAVE: 'On Leave',
  ONBOARDING: 'Onboarding',
  INACTIVE: 'Inactive',
};

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  FULL_TIME: 'Full Time',
  PART_TIME: 'Part Time',
  CONTRACT: 'Contract',
};
