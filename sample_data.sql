-- Script para inserir dados de exemplo no sistema Motoboy Fuel Buddy
-- Execute este script APÓS executar o database_schema.sql

-- Inserir usuários do sistema
INSERT INTO usuarios_motoboy (email, nome, role) VALUES
    ('admin@empresa.com', 'Administrador Sistema', 'admin'),
    ('supervisor@empresa.com', 'João Supervisor', 'supervisor'),
    ('gerente@empresa.com', 'Maria Gerente', 'supervisor'),
    ('atendente@empresa.com', 'Pedro Atendente', 'user')
ON CONFLICT (email) DO NOTHING;

-- Inserir motoboys cadastrados
INSERT INTO motoboys_motoboy (matricula, nome, cpf, telefone, placa_veiculo, modelo_veiculo) VALUES
    ('M001', 'João Silva Santos', '123.456.789-01', '(11) 99999-1111', 'ABC-1234', 'Honda CG 160'),
    ('M002', 'Maria Oliveira Costa', '987.654.321-09', '(11) 88888-2222', 'DEF-5678', 'Yamaha YBR 125'),
    ('M003', 'Carlos Pereira Lima', '456.789.123-45', '(11) 77777-3333', 'GHI-9012', 'Honda Biz 125'),
    ('M004', 'Ana Paula Souza', '789.123.456-78', '(11) 66666-4444', 'JKL-3456', 'Yamaha Factor 150'),
    ('M005', 'Roberto Almeida', '321.654.987-32', '(11) 55555-5555', 'MNO-7890', 'Honda CG 150'),
    ('M006', 'Fernanda Costa', '654.321.987-65', '(11) 44444-6666', 'PQR-1234', 'Yamaha YBR 160'),
    ('M007', 'Lucas Mendes', '147.258.369-14', '(11) 33333-7777', 'STU-5678', 'Honda Pop 110'),
    ('M008', 'Patrícia Santos', '258.369.147-25', '(11) 22222-8888', 'VWX-9012', 'Yamaha Factor 125')
ON CONFLICT (matricula) DO NOTHING;

-- Inserir solicitações de exemplo
INSERT INTO solicitacoes_motoboy (data, fone, nome, matricula, placa, solicitacao, valor, valor_combustivel, descricao_pecas, status, aprovacao, avisado, aprovacao_sup) VALUES
    -- Solicitações de Combustível
    ('2024-01-15', '(11) 99999-1111', 'João Silva Santos', 'M001', 'ABC-1234', 'Combustível', 80.00, 80.00, NULL, 'Fase de aprovação', 'pendente', true, 'pendente'),
    ('2024-01-15', '(11) 88888-2222', 'Maria Oliveira Costa', 'M002', 'DEF-5678', 'Combustível', 65.50, 65.50, NULL, 'Aprovado pelo supervisor', 'aprovado', true, 'aprovado'),
    ('2024-01-16', '(11) 77777-3333', 'Carlos Pereira Lima', 'M003', 'GHI-9012', 'Combustível', 45.00, 45.00, NULL, 'Fase de aprovação', 'pendente', true, 'pendente'),
    ('2024-01-16', '(11) 66666-4444', 'Ana Paula Souza', 'M004', 'JKL-3456', 'Combustível', 120.00, 120.00, NULL, 'Rejeitado pelo supervisor', 'rejeitado', true, 'rejeitado'),
    
    -- Solicitações de Vale Peças
    ('2024-01-14', '(11) 55555-5555', 'Roberto Almeida', 'M005', 'MNO-7890', 'Vale Peças', 180.00, NULL, 'Pneu dianteiro, pastilha de freio, óleo de motor', 'Aprovado pelo supervisor', 'aprovado', true, 'aprovado'),
    ('2024-01-15', '(11) 44444-6666', 'Fernanda Costa', 'M006', 'PQR-1234', 'Vale Peças', 95.50, NULL, 'Corrente, coroa, pinhão, óleo de transmissão', 'Fase de aprovação', 'pendente', true, 'pendente'),
    ('2024-01-16', '(11) 33333-7777', 'Lucas Mendes', 'M007', 'STU-5678', 'Vale Peças', 220.00, NULL, 'Bateria nova, cabo de vela, filtro de ar', 'Fase de aprovação', 'pendente', true, 'pendente'),
    
    -- Solicitações de Manutenção
    ('2024-01-13', '(11) 22222-8888', 'Patrícia Santos', 'M008', 'VWX-9012', 'Manutenção', 150.00, NULL, 'Revisão geral, troca de óleo, ajuste de freios', 'Aprovado pelo supervisor', 'aprovado', true, 'aprovado'),
    ('2024-01-15', '(11) 99999-1111', 'João Silva Santos', 'M001', 'ABC-1234', 'Manutenção', 85.00, NULL, 'Troca de óleo, filtros, verificação elétrica', 'Fase de aprovação', 'pendente', true, 'pendente'),
    
    -- Solicitações de Outros
    ('2024-01-14', '(11) 88888-2222', 'Maria Oliveira Costa', 'M002', 'DEF-5678', 'Outros', 35.00, NULL, 'Limpador de carburador, aditivo de combustível', 'Aprovado pelo supervisor', 'aprovado', true, 'aprovado'),
    ('2024-01-16', '(11) 77777-3333', 'Carlos Pereira Lima', 'M003', 'GHI-9012', 'Outros', 25.50, NULL, 'Cabo de acelerador, manoplas', 'Fase de aprovação', 'pendente', true, 'pendente');

-- Inserir histórico de aprovações de exemplo
INSERT INTO historico_aprovacoes_motoboy (solicitacao_id, usuario_id, acao, valor_anterior, valor_novo, observacao) 
SELECT 
    s.id,
    u.id,
    'status_alterado',
    'pendente',
    s.aprovacao,
    'Alteração automática do sistema'
FROM solicitacoes_motoboy s
CROSS JOIN usuarios_motoboy u
WHERE u.role = 'admin' AND s.aprovacao != 'pendente'
LIMIT 5;

-- Inserir configurações adicionais
INSERT INTO configuracoes_motoboy (chave, valor, descricao) VALUES
    ('empresa_nome', 'Transportadora Express Ltda', 'Nome da empresa'),
    ('sistema_versao', '1.0.0', 'Versão atual do sistema'),
    ('limite_diario_geral', '200.00', 'Limite diário geral por motoboy'),
    ('horario_funcionamento', '08:00-18:00', 'Horário de funcionamento da empresa'),
    ('telefone_suporte', '(11) 4000-0000', 'Telefone para suporte técnico')
ON CONFLICT (chave) DO NOTHING;

-- Verificar dados inseridos
SELECT 'Usuários inseridos:' as info, COUNT(*) as total FROM usuarios_motoboy
UNION ALL
SELECT 'Motoboys inseridos:', COUNT(*) FROM motoboys_motoboy
UNION ALL
SELECT 'Solicitações inseridas:', COUNT(*) FROM solicitacoes_motoboy
UNION ALL
SELECT 'Configurações inseridas:', COUNT(*) FROM configuracoes_motoboy;

-- Mostrar algumas solicitações de exemplo
SELECT 
    s.data,
    s.nome,
    s.solicitacao,
    s.valor,
    s.status,
    s.aprovacao,
    s.aprovacao_sup as aprovacao_supervisor
FROM solicitacoes_motoboy s
ORDER BY s.data DESC, s.created_at DESC
LIMIT 10;
