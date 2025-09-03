export default function handler(req: any, res: any) {
  // Permitir CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  
  try {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'API funcionando perfeitamente!',
      method: req.method,
      url: req.url
    })
  } catch (error) {
    res.status(500).json({
      error: 'Erro interno',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    })
  }
}
