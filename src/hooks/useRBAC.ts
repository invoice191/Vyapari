import { useAuth } from "../context/AuthContext";

export type Role = 'owner' | 'banker' | 'employee' | 'salesperson';

interface Permissions {
  [module: string]: {
    [action: string]: boolean;
  };
}

const ROLE_PERMISSIONS: Record<Role, Permissions> = {
  owner: {
    '*': { '*': true }
  },
  banker: {
    'bankers_view': { 'view': true },
    'reports': { 'view': true }
  },
  employee: {
    'invoices': { 'create': true, 'view': true, 'void': true },
    'inventory': { 'view': true },
    'dss': { '*': false },
    'bankers_view': { '*': false },
    'reports': { '*': false }
  },
  salesperson: {
    'invoices': { 'create': true, 'view': true, 'void': true },
    'inventory': { 'view': true },
    'dss': { '*': false },
    'bankers_view': { '*': false },
    'reports': { '*': false }
  }
};

export const useRBAC = () => {
  const { profile } = useAuth();
  const role: Role = 'owner';

  const can = (module: string, action: string): boolean => {
    return true;
  };

  const isOwner = true;
  const isBanker = true;
  const isEmployee = true;

  return { role, can, isOwner, isBanker, isEmployee };
};
