import { useAuth } from "../context/AuthContext";

export type Role = 'owner' | 'manager' | 'staff' | 'banker';

interface Permissions {
  [module: string]: {
    [action: string]: boolean;
  };
}

const ROLE_PERMISSIONS: Record<Role, Permissions> = {
  owner: {
    '*': { '*': true }
  },
  manager: {
    'dashboard': { 'view': true },
    'pos': { 'view': true, 'create': true },
    'inventory': { 'view': true, 'edit': true },
    'purchases': { 'view': true, 'create': true },
    'invoices': { 'view': true, 'create': true },
    'ocr': { 'view': true, 'create': true },
    'contacts': { 'view': true, 'create': true },
    'reports': { 'view': true },
    'ledger': { 'view': true },
    // Cannot access Settings, AutoPilot, System Logs, Staff, DSS
  },
  staff: {
    'pos': { 'view': true, 'create': true },
    'invoices': { 'view': true, 'create': true },
    'inventory': { 'view': true, 'edit': false }, // Can see stock but not modify
    // Everything else blocked
  },
  banker: {
    'banker': { 'view': true },
    'reports': { 'view': true },
    'ledger': { 'view': true },
  }
};

export const useRBAC = () => {
  const { profile } = useAuth();
  
  // Default to staff if no role is found to be safe, but owner for local testing if profile is missing
  const role: Role = (profile?.role as Role) || 'owner';

  const can = (module: string, action: string = 'view'): boolean => {
    if (role === 'owner') return true;
    
    const rolePerms = ROLE_PERMISSIONS[role];
    if (!rolePerms) return false;

    const modulePerms = rolePerms[module];
    if (!modulePerms) return false;

    return modulePerms[action] || modulePerms['*'] || false;
  };

  const isOwner = role === 'owner';
  const isManager = role === 'manager';
  const isStaff = role === 'staff';
  const isBanker = role === 'banker';

  return { role, can, isOwner, isManager, isStaff, isBanker };
};
