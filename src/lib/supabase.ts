import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kjhoavcazbhxvsvybvoe.supabase.co';
const supabaseAnonKey = 'sb_publishable_aDeGzX7OmGVWDlMezbsKLQ_9zkgam9p';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export const uploadImageToStorage = async (file: File, folder: string): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('moonferret-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase storage upload fail:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('moonferret-images')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (err) {
    console.error('Supabase storage upload exception:', err);
    return null;
  }
};
