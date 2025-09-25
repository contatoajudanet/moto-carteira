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

    // Obter URL pública (não expira) - melhor opção para URLs longas
    const { data: urlData } = supabase.storage
      .from('motoboy-documents')
      .getPublicUrl(filePath);

    console.log('🔗 URL pública gerada (não expira):', urlData.publicUrl);
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

// Função para gerar URL com expiração longa (até 2100)
export const getPDFUrlWithLongExpiry = async (filePath: string): Promise<string | null> => {
  try {
    // Calcular expiração até 2100 (100 anos)
    const expiryDate = new Date('2100-12-31T23:59:59Z');
    const expiresIn = Math.floor((expiryDate.getTime() - Date.now()) / 1000); // segundos
    
    console.log('🔗 Gerando URL com expiração até 2100:', filePath);
    console.log('📅 Expira em:', expiryDate.toISOString());
    console.log('⏰ Segundos até expiração:', expiresIn);
    
    // Verificar se a expiração é válida (máximo 7 dias para URLs assinadas)
    const maxExpiry = 7 * 24 * 60 * 60; // 7 dias em segundos
    
    if (expiresIn > maxExpiry) {
      console.log('⚠️ Expiração muito longa, usando URL pública (não expira)');
      // Para expirações muito longas, usar URL pública que não expira
      const { data: urlData } = supabase.storage
        .from('motoboy-documents')
        .getPublicUrl(filePath);
      return urlData.publicUrl;
    }
    
    const { data, error } = await supabase.storage
      .from('motoboy-documents')
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('Erro ao gerar URL assinada:', error);
      // Fallback para URL pública se falhar
      const { data: urlData } = supabase.storage
        .from('motoboy-documents')
        .getPublicUrl(filePath);
      return urlData.publicUrl;
    }

    console.log('✅ URL com expiração longa gerada:', data.signedUrl);
    return data.signedUrl;
  } catch (error) {
    console.error('Erro ao gerar URL com expiração:', error);
    // Fallback para URL pública se falhar
    const { data: urlData } = supabase.storage
      .from('motoboy-documents')
      .getPublicUrl(filePath);
    return urlData.publicUrl;
  }
};

// Função para obter URL pública (não expira)
export const getPDFPublicUrl = (filePath: string): string => {
  const { data } = supabase.storage
    .from('motoboy-documents')
    .getPublicUrl(filePath);
  
  return data.publicUrl;
};

// Função para obter base64 do arquivo
export const getPDFBase64 = async (filePath: string): Promise<string | null> => {
  try {
    console.log('📄 Obtendo base64 do arquivo:', filePath);
    
    const { data, error } = await supabase.storage
      .from('motoboy-documents')
      .download(filePath);

    if (error) {
      console.error('Erro ao baixar arquivo:', error);
      return null;
    }

    if (!data) {
      console.error('Arquivo não encontrado');
      return null;
    }

    // Converter para base64
    const arrayBuffer = await data.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    console.log('✅ Base64 gerado com sucesso, tamanho:', base64.length, 'caracteres');
    return base64;
  } catch (error) {
    console.error('Erro ao obter base64 do arquivo:', error);
    return null;
  }
};

// Função para obter base64 a partir da URL
export const getPDFBase64FromUrl = async (pdfUrl: string): Promise<string | null> => {
  try {
    // Extrair o caminho do arquivo da URL
    const url = new URL(pdfUrl);
    const pathParts = url.pathname.split('/');
    const bucketIndex = pathParts.findIndex(part => part === 'motoboy-documents');
    
    if (bucketIndex === -1) {
      console.error('URL do PDF inválida:', pdfUrl);
      return null;
    }
    
    // Reconstruir o caminho do arquivo
    const filePath = pathParts.slice(bucketIndex + 1).join('/');
    
    return await getPDFBase64(filePath);
  } catch (error) {
    console.error('Erro ao obter base64 da URL:', error);
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
