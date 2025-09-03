import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🧪 API de teste chamada')
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    const data = req.body
    console.log('📋 Dados recebidos:', JSON.stringify(data, null, 2))
    
    // Simular processamento
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Retornar dados de teste
    res.status(200).json({ 
      success: true,
      message: 'API funcionando!',
      data: data,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('💥 Erro:', error)
    res.status(500).json({ 
      error: 'Erro interno',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    })
  }
}
