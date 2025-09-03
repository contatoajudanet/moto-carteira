export default function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    const data = req.body
    
    res.status(200).json({ 
      success: true,
      message: 'API funcionando!',
      data: data,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro interno',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    })
  }
}
