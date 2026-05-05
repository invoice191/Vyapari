import { supabase } from "../supabase";

export const auditService = {
  getLogs: async (page = 1, pageSize = 15, search = "") => {
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`action.ilike.%${search}%,user_email.ilike.%${search}%,module.ilike.%${search}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await query
      .order('timestamp', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { data, count };
  }
};
