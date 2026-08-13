import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { validateEmployee } from '../middleware/validate';

const router = Router();
const prisma = new PrismaClient();

const employeeSelect = {
  id: true,
  employeeId: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  jobTitle: true,
  department: true,
  status: true,
  employmentType: true,
  hireDate: true,
  dateOfBirth: true,
  terminationDate: true,
  location: true,
  avatarColor: true,
  isTopLevel: true,
  emergencyContactName: true,
  emergencyContactRelationship: true,
  emergencyContactPhone: true,
  managerId: true,
  manager: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      jobTitle: true,
    },
  },
  directReports: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      jobTitle: true,
      department: true,
      avatarColor: true,
    },
  },
  createdAt: true,
  updatedAt: true,
};

// GET /api/employees — list all
router.get('/', async (req: Request, res: Response) => {
  try {
    const { hireDateFrom, hireDateTo } = req.query;
    const where: any = {};

    const minDate = new Date('2000-01-01');

    const hasFrom = hireDateFrom && hireDateFrom !== 'undefined' && hireDateFrom !== 'null' && hireDateFrom !== '';
    const hasTo = hireDateTo && hireDateTo !== 'undefined' && hireDateTo !== 'null' && hireDateTo !== '';

    if (hasFrom) {
      const from = new Date(hireDateFrom as string);
      if (isNaN(from.getTime())) {
        res.status(400).json({ error: 'Invalid hireDateFrom date format.' });
        return;
      }
      if (from < minDate) {
        res.status(400).json({ error: 'Hire date from cannot be earlier than January 1, 2000.' });
        return;
      }
      where.hireDate = { ...where.hireDate, gte: from };
    }

    if (hasTo) {
      const to = new Date(hireDateTo as string);
      if (isNaN(to.getTime())) {
        res.status(400).json({ error: 'Invalid hireDateTo date format.' });
        return;
      }
      if (to < minDate) {
        res.status(400).json({ error: 'Hire date to cannot be earlier than January 1, 2000.' });
        return;
      }
      where.hireDate = { ...where.hireDate, lte: to };
    }

    if (hasFrom && hasTo) {
      const from = new Date(hireDateFrom as string);
      const to = new Date(hireDateTo as string);
      if (from > to) {
        res.status(400).json({ error: "'From' date must be before 'To' date." });
        return;
      }
    }

    const employees = await prisma.employee.findMany({
      where,
      select: employeeSelect,
      orderBy: [{ department: 'asc' }, { firstName: 'asc' }],
    });
    res.json(employees);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// GET /api/employees/:id — single employee
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: req.params.id },
      select: employeeSelect,
    });
    if (!employee) {
      res.status(404).json({ error: 'Employee not found' });
      return;
    }
    res.json(employee);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

// POST /api/employees — create
router.post('/', validateEmployee, async (req: Request, res: Response) => {
  try {
    const {
      employeeId, firstName, lastName, email, phone, jobTitle,
      department, status, employmentType, hireDate, dateOfBirth,
      location, avatarColor, isTopLevel, managerId,
      emergencyContactName, emergencyContactRelationship, emergencyContactPhone,
    } = req.body;

    const employee = await prisma.employee.create({
      data: {
        employeeId,
        firstName,
        lastName,
        email,
        phone,
        jobTitle,
        department,
        status: status || 'ONBOARDING',
        employmentType: employmentType || 'FULL_TIME',
        hireDate: new Date(hireDate),
        dateOfBirth: new Date(dateOfBirth),
        location,
        avatarColor: avatarColor || '#6366f1',
        isTopLevel: isTopLevel || false,
        managerId: managerId || null,
        emergencyContactName,
        emergencyContactRelationship,
        emergencyContactPhone,
      },
      select: employeeSelect,
    });

    res.status(201).json(employee);
  } catch (err: any) {
    console.error(err);
    if (err.code === 'P2002') {
      res.status(400).json({ errors: ['Employee ID or email already exists.'] });
      return;
    }
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

// PUT /api/employees/:id — update
router.put('/:id', validateEmployee, async (req: Request, res: Response) => {
  try {
    const existing = await prisma.employee.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: 'Employee not found' });
      return;
    }

    const updateData: any = { ...req.body };
    if (updateData.hireDate) updateData.hireDate = new Date(updateData.hireDate);
    if (updateData.dateOfBirth) updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const employee = await prisma.employee.update({
      where: { id: req.params.id },
      data: updateData,
      select: employeeSelect,
    });
    res.json(employee);
  } catch (err: any) {
    console.error(err);
    if (err.code === 'P2002') {
      res.status(400).json({ errors: ['Email already in use by another employee.'] });
      return;
    }
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// DELETE /api/employees/:id — soft delete (mark inactive)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const employee = await prisma.employee.update({
      where: { id: req.params.id },
      data: { status: 'ON_LEAVE' },
      select: { id: true, employeeId: true },
    });
    res.json({ message: 'Employee status updated', employee });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

// PUT /api/employees/:id/offboard — soft-delete with orphan prevention
router.put('/:id/offboard', async (req: Request, res: Response) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        status: true,
        _count: { select: { directReports: true } },
      },
    });

    if (!employee) {
      res.status(404).json({ error: 'Employee not found.' });
      return;
    }

    if (employee.status === 'INACTIVE') {
      res.status(400).json({ error: 'Employee is already inactive.' });
      return;
    }

    if (employee._count.directReports > 0) {
      res.status(400).json({
        error: 'Cannot offboard a manager. Reassign their direct reports first.',
      });
      return;
    }

    const updated = await prisma.employee.update({
      where: { id: req.params.id },
      data: {
        status: 'INACTIVE',
        terminationDate: new Date(),
      },
      select: employeeSelect,
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to offboard employee.' });
  }
});

export default router;
