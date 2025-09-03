import type { NextApiRequest, NextApiResponse } from 'next'
import puppeteer from 'puppeteer'

interface PDFData {
  nome: string
  telefone: string
  tipoSolicitacao: string
  valor?: number
  descricao?: string
  status: string
  aprovacaoSup: string
  dataCriacao: string
}

function generateHTML(data: PDFData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Relatório de Solicitação</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .section { margin-bottom: 25px; }
        .label { font-weight: bold; color: #555; }
        .value { margin-left: 10px; color: #333; }
        .status { padding: 5px 10px; border-radius: 4px; color: white; }
        .pendente { background-color: #f39c12; }
        .aprovado { background-color: #27ae60; }
        .rejeitado { background-color: #e74c3c; }
        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #777; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Relatório de Solicitação</h1>
        <h2>Sistema Motoboy Fuel Buddy</h2>
      </div>
      
      <div class="section">
        <div><span class="label">Nome:</span><span class="value">${data.nome}</span></div>
        <div><span class="label">Telefone:</span><span class="value">${data.telefone}</span></div>
        <div><span class="label">Tipo de Solicitação:</span><span class="value">${data.tipoSolicitacao}</span></div>
        ${data.valor ? `<div><span class="label">Valor:</span><span class="value">R$ ${data.valor.toFixed(2)}</span></div>` : ''}
        ${data.descricao ? `<div><span class="label">Descrição:</span><span class="value">${data.descricao}</span></div>` : ''}
        <div><span class="label">Status:</span><span class="value">${data.status}</span></div>
        <div><span class="label">Aprovação Supervisor:</span>
          <span class="status ${data.aprovacaoSup}">${data.aprovacaoSup.toUpperCase()}</span>
        </div>
        <div><span class="label">Data de Criação:</span><span class="value">${data.dataCriacao}</span></div>
      </div>
      
      <div class="footer">
        <p>Documento gerado automaticamente pelo sistema</p>
        <p>Data: ${new Date().toLocaleDateString('pt-BR')} - Hora: ${new Date().toLocaleTimeString('pt-BR')}</p>
      </div>
    </body>
    </html>
  `
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    const data: PDFData = req.body
    
    if (!data.nome || !data.telefone || !data.tipoSolicitacao) {
      return res.status(400).json({ error: 'Dados obrigatórios não fornecidos' })
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    })
    
    const page = await browser.newPage()
    const html = generateHTML(data)
    await page.setContent(html, { waitUntil: 'networkidle0' })
    
    const pdf = await page.pdf({ 
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    })
    
    await browser.close()
    
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=solicitacao_${data.nome.replace(/\s+/g, '_')}_${Date.now()}.pdf`)
    res.setHeader('Content-Length', pdf.length.toString())
    
    res.send(pdf)
    
  } catch (error) {
    console.error('Erro ao gerar PDF:', error)
    res.status(500).json({ error: 'Erro interno ao gerar PDF' })
  }
}
