import { supabase } from './supabase';

export async function saveFile(name: string, headers: string[], data: any[][]) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No authenticated user");

  const { data: savedReport, error } = await supabase
    .from('reports')
    .insert([{
      name,
      headers,
      data,
      user_id: user.id
    }])
    .select()
    .single();

  if (error) throw error;
  return savedReport.id;
}

export async function getFiles() {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching files from Supabase", error);
    return [];
  }
  
  // Transform to match the UI expectations (created_at -> date)
  return data.map(report => ({
    ...report,
    date: new Date(report.created_at)
  }));
}

export async function deleteFile(id: string) {
  const { error } = await supabase
    .from('reports')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
