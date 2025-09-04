import { supabase } from './supabase';

export const uploadPDFToStorage = async (
  file: Blob,
  filename: string,
  folder: string = 'laudos'
): Promise<string | null> => {
  try {
    const filePath = `${folder}/${filename}`;
    
    const { data, error } = await supabase.storage
      .from('motoboy-documents')
      .upload(filePath, file, {
        contentType: 'application/pdf',
        cacheControl: '3600'
      });

    if (error) {
      console.error('Erro ao fazer upload do PDF:', error);
      return null;
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('motoboy-documents')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Erro ao fazer upload do PDF:', error);
    return null;
  }
};

export const createStorageBucket = async () => {
  try {
    const { data, error } = await supabase.storage.createBucket('motoboy-documents', {
      public: true,
      allowedMimeTypes: ['application/pdf'],
      fileSizeLimit: 5242880 // 5MB
    });

    if (error) {
      console.error('Erro ao criar bucket:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao criar bucket:', error);
    return false;
  }
};
