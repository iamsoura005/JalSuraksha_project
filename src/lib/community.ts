import { supabase } from './supabase';

export interface CreateReportData {
  title: string;
  description: string;
  category: 'complaint' | 'report' | 'suggestion' | 'emergency';
  priority: 'low' | 'medium' | 'high' | 'critical';
  location?: string;
  latitude?: number;
  longitude?: number;
  attachments?: string[];
}

export interface UpdateReportData {
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  admin_response?: string;
}

// Create a new community report
export const createCommunityReport = async (data: CreateReportData) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User not authenticated');

    const { data: report, error } = await supabase
      .from('community_reports')
      .insert({
        user_id: user.id,
        ...data
      })
      .select()
      .single();

    if (error) throw error;
    return { data: report, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Get all community reports with pagination
export const getCommunityReports = async (
  page: number = 1,
  limit: number = 10,
  filters?: {
    category?: string;
    status?: string;
    priority?: string;
    user_id?: string;
  }
) => {
  try {
    let query = supabase
      .from('community_reports')
      .select(`
        *,
        users (
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: reports, error, count } = await query;

    if (error) throw error;
    return { data: reports, count, error: null };
  } catch (error) {
    return { data: null, count: 0, error };
  }
};

// Get a single community report by ID
export const getCommunityReport = async (id: string) => {
  try {
    const { data: report, error } = await supabase
      .from('community_reports')
      .select(`
        *,
        users (
          full_name,
          email,
          phone
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data: report, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Update a community report (for admins)
export const updateCommunityReport = async (id: string, updates: UpdateReportData) => {
  try {
    const updateData: Record<string, unknown> = { ...updates };
    
    if (updates.status === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { data: report, error } = await supabase
      .from('community_reports')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data: report, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Get user's own reports
export const getUserReports = async () => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User not authenticated');

    const { data: reports, error } = await supabase
      .from('community_reports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: reports, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Get report statistics
export const getReportStatistics = async () => {
  try {
    const { data: stats, error } = await supabase
      .from('community_reports')
      .select('category, status, priority, created_at');

    if (error) throw error;

    const statistics = {
      total: stats?.length || 0,
      byCategory: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
      recent: stats?.filter(report => {
        const reportDate = new Date(report.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return reportDate >= weekAgo;
      }).length || 0
    };

    stats?.forEach(report => {
      statistics.byCategory[report.category] = (statistics.byCategory[report.category] || 0) + 1;
      statistics.byStatus[report.status] = (statistics.byStatus[report.status] || 0) + 1;
      statistics.byPriority[report.priority] = (statistics.byPriority[report.priority] || 0) + 1;
    });

    return { data: statistics, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Upload attachment (placeholder - would need actual file upload implementation)
export const uploadAttachment = async (file: File): Promise<{ url: string; error: null } | { url: null; error: unknown }> => {
  try {
    // This would typically upload to Supabase Storage
    // For now, return a placeholder URL
    const fileName = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage
      .from('community-attachments')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('community-attachments')
      .getPublicUrl(fileName);

    return { url: publicUrl, error: null };
  } catch (error) {
    return { url: null, error };
  }
};