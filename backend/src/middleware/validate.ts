import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Regex patterns
const NAME_REGEX = /^[A-Za-z\s\-']+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\+\(\)\s]{10,15}$/;

function parseDate(val: unknown): Date | null {
  if (!val) return null;
  const d = new Date(val as string);
  return isNaN(d.getTime()) ? null : d;
}

function yearsDiff(from: Date, to: Date): number {
  let years = to.getFullYear() - from.getFullYear();
  const m = to.getMonth() - from.getMonth();
  if (m < 0 || (m === 0 && to.getDate() < from.getDate())) years--;
  return years;
}

/** Recursively check if targetId appears in the reporting chain above currentId */
async function hasCircularReporting(
  employeeId: string,
  newManagerId: string
): Promise<boolean> {
  let current: string | null = newManagerId;
  const visited = new Set<string>();

  while (current !== null) {
    if (visited.has(current)) break; // safety — shouldn't happen
    if (current === employeeId) return true; // circle detected
    visited.add(current);

    const emp = await prisma.employee.findUnique({
      where: { id: current },
      select: { managerId: true },
    });
    current = emp?.managerId ?? null;
  }
  return false;
}

export async function validateEmployee(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const body = req.body;
  const errors: string[] = [];
  const isUpdate = req.method === 'PUT';
  const currentId = req.params.id;
  const today = new Date();

  // ── Name validations ───────────────────────────────────────────────────────
  if (!isUpdate || body.firstName !== undefined) {
    if (!body.firstName || !NAME_REGEX.test(body.firstName)) {
      errors.push('First name may only contain letters, spaces, hyphens, or apostrophes.');
    }
  }
  if (!isUpdate || body.lastName !== undefined) {
    if (!body.lastName || !NAME_REGEX.test(body.lastName)) {
      errors.push('Last name may only contain letters, spaces, hyphens, or apostrophes.');
    }
  }

  // ── Email validation ───────────────────────────────────────────────────────
  if (!isUpdate || body.email !== undefined) {
    if (!body.email || !EMAIL_REGEX.test(body.email)) {
      errors.push('Invalid email format.');
    } else {
      // Uniqueness check
      const existing = await prisma.employee.findUnique({ where: { email: body.email } });
      if (existing && existing.id !== currentId) {
        errors.push('An employee with this email already exists.');
      }
    }
  }

  // ── Phone validation ───────────────────────────────────────────────────────
  if (!isUpdate || body.phone !== undefined) {
    if (!body.phone || !PHONE_REGEX.test(body.phone)) {
      errors.push('Phone must be 10-15 characters: digits, +, (, ), or spaces only.');
    }
  }

  // ── Date validations ───────────────────────────────────────────────────────
  let dob: Date | null = null;
  let hireDate: Date | null = null;

  if (!isUpdate || body.dateOfBirth !== undefined) {
    dob = parseDate(body.dateOfBirth);
    if (!dob) {
      errors.push('Date of birth is required and must be a valid date.');
    } else {
      const age = yearsDiff(dob, today);
      if (age < 18) errors.push('Employee must be at least 18 years old.');
      if (age > 100) errors.push('Employee cannot be more than 100 years old.');
    }
  }

  if (!isUpdate || body.hireDate !== undefined) {
    hireDate = parseDate(body.hireDate);
    if (!hireDate) {
      errors.push('Hire date is required and must be a valid date.');
    } else {
      const minHireDate = new Date('2000-01-01');
      if (hireDate < minHireDate) {
        errors.push('Hire date cannot be before January 1, 2000 (company founding).');
      }
      const maxHireDate = new Date(today);
      maxHireDate.setMonth(maxHireDate.getMonth() + 3);
      if (hireDate > maxHireDate) {
        errors.push('Hire date cannot be more than 3 months in the future.');
      }
      if (dob) {
        const ageAtHire = yearsDiff(dob, hireDate);
        if (ageAtHire < 18) {
          errors.push('Employee must be at least 18 years old at the time of hire.');
        }
      }
    }
  }

  // ── Hierarchy validations ──────────────────────────────────────────────────
  const managerId = body.managerId;

  // CEO / top-level cannot have a manager
  if (body.isTopLevel && managerId) {
    errors.push('The CEO/top-level employee cannot have a manager.');
  }

  // Cannot be own manager
  if (managerId && managerId === currentId) {
    errors.push('An employee cannot be their own manager.');
  }

  // Circular reporting check
  if (managerId && currentId && managerId !== currentId) {
    const circular = await hasCircularReporting(currentId, managerId);
    if (circular) {
      errors.push('Circular reporting detected: this assignment would create an infinite loop.');
    }
  }

  if (errors.length > 0) {
    res.status(400).json({ errors });
    return;
  }

  next();
}
