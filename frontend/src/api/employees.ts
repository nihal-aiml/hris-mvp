import { Employee, EmployeeFormData } from '../types/employee';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message =
      data.errors?.join(', ') || data.error || `HTTP ${res.status}`;
    throw new Error(message);
  }
  return res.json();
}

export const employeesApi = {
  getAll: (filters?: { hireDateFrom?: string; hireDateTo?: string }): Promise<Employee[]> => {
    const params = new URLSearchParams();
    if (filters?.hireDateFrom && filters.hireDateFrom !== 'undefined' && filters.hireDateFrom !== 'null' && filters.hireDateFrom !== '') {
      params.append('hireDateFrom', filters.hireDateFrom);
    }
    if (filters?.hireDateTo && filters.hireDateTo !== 'undefined' && filters.hireDateTo !== 'null' && filters.hireDateTo !== '') {
      params.append('hireDateTo', filters.hireDateTo);
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetch(`${BASE_URL}/employees${query}`).then((r) => handleResponse<Employee[]>(r));
  },

  getById: (id: string): Promise<Employee> =>
    fetch(`${BASE_URL}/employees/${id}`).then((r) =>
      handleResponse<Employee>(r)
    ),

  create: (data: EmployeeFormData): Promise<Employee> =>
    fetch(`${BASE_URL}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<Employee>(r)),

  update: (id: string, data: Partial<EmployeeFormData>): Promise<Employee> =>
    fetch(`${BASE_URL}/employees/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<Employee>(r)),

  delete: (id: string): Promise<void> =>
    fetch(`${BASE_URL}/employees/${id}`, { method: 'DELETE' }).then((r) =>
      handleResponse<void>(r)
    ),

  offboard: (id: string): Promise<import('../types/employee').Employee> =>
    fetch(`${BASE_URL}/employees/${id}/offboard`, { method: 'PUT' }).then((r) =>
      handleResponse<import('../types/employee').Employee>(r)
    ),
};
