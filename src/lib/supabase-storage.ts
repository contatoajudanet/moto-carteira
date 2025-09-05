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

export const deletePDFFromStorage = async (pdfUrl: string): Promise<boolean> => {
  try {
    // Extrair o caminho do arquivo da URL
    const url = new URL(pdfUrl);
    const pathParts = url.pathname.split('/');
    const bucketIndex = pathParts.findIndex(part => part === 'motoboy-documents');
    
    if (bucketIndex === -1) {
      console.error('URL do PDF inválida:', pdfUrl);
      return false;
    }
    
    // Reconstruir o caminho do arquivo
    const filePath = pathParts.slice(bucketIndex + 1).join('/');
    
    console.log('🗑️ Deletando PDF do storage:', filePath);
    
    const { error } = await supabase.storage
      .from('motoboy-documents')
      .remove([filePath]);

    if (error) {
      console.error('Erro ao deletar PDF do storage:', error);
      return false;
    }

    console.log('✅ PDF deletado do storage com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao deletar PDF do storage:', error);
    return false;
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
