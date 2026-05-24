// js/movimentacoes-logic.js

let estoque = JSON.parse(localStorage.getItem('estoque_rj')) || [];
let historico = JSON.parse(localStorage.getItem('historico_rj')) || [];
let clientes = JSON.parse(localStorage.getItem('clientes_rj')) || []; 
let indexEdicao = null;
let filtroAtual = 'Todas';
let usuarioAtual = null;

/**
 * 1. REGRA DE NEGÓCIO: Verificação de Acesso e Renderização do Menu
 */
function verificarAutenticacaoEPermissoes() {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    if (!usuarioLogado) {
        window.location.href = 'index.html';
        return;
    }

    usuarioAtual = JSON.parse(usuarioLogado);

    // Regra: Operador de Laser não tem acesso a Movimentações de Estoque
    if (usuarioAtual.cargo === 'OPERADOR') {
        window.location.href = 'servicos.html';
        return;
    }

    document.getElementById('nomeUsuarioLogado').innerText = `${usuarioAtual.email.split('@')[0]} (${usuarioAtual.cargo})`;

    const menuContainer = document.getElementById('menuNavegacao');
    let menuHTML = '';

    if (usuarioAtual.cargo === 'ADMIN') {
        menuHTML += `<a href="relatorios.html" class="tab-item">📊 Relatórios</a>`;
    }

    if (['ADMIN', 'ESTOQUISTA'].includes(usuarioAtual.cargo)) {
        menuHTML += `<a href="estoque.html" class="tab-item">📦 Estoque</a>`;
    }

    // Tela Atual (Movimentações)
    menuHTML += `<a href="movimentacoes.html" class="tab-item active">📝 Movimentações</a>`;

    if (['ADMIN', 'FINANCEIRO'].includes(usuarioAtual.cargo)) {
        menuHTML += `<a href="clientes.html" class="tab-item">👥 Clientes</a>`;
    }

    if (['ADMIN', 'FINANCEIRO', 'OPERADOR'].includes(usuarioAtual.cargo)) {
        menuHTML += `<a href="servicos.html" class="tab-item">⚙️ Serviços</a>`;
    }

    if (usuarioAtual.cargo === 'ADMIN') {
        menuHTML += `<a href="usuarios.html" class="tab-item">👤 Usuários</a>`;
        menuHTML += `<a href="logs.html" class="tab-item">🛡️ Logs</a>`;
    }

    menuContainer.innerHTML = menuHTML;
}

/**
 * 2. Renderização da Tabela com Filtros
 */
function renderizarMovimentacoes() {
    estoque = JSON.parse(localStorage.getItem('estoque_rj')) || [];
    historico = JSON.parse(localStorage.getItem('historico_rj')) || [];
    filtrar(filtroAtual); 
}

function filtrar(tipo) {
    filtroAtual = tipo;
    
    const botoes = document.querySelectorAll('.btn-filter');
    botoes.forEach(btn => {
        btn.classList.remove('active');
        if (btn.innerText === tipo || (tipo === 'Entrada' && btn.innerText === 'Entradas') || (tipo === 'Saída' && btn.innerText === 'Saídas')) {
            btn.classList.add('active');
        }
    });

    let dadosParaExibir = historico;
    if (tipo !== 'Todas') {
        dadosParaExibir = historico.filter(m => m.tipo === tipo.toUpperCase());
    }

    const corpo = document.getElementById('corpoMovimentacoes');
    if (!corpo) return;

    if (dadosParaExibir.length === 0) {
        corpo.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:var(--prata-aluminio); font-weight: 600;">Nenhuma movimentação ${tipo !== 'Todas' ? tipo.toLowerCase() : ''} encontrada.</td></tr>`;
        return;
    }

    const logs = [...dadosParaExibir].reverse();

    corpo.innerHTML = logs.map((mov) => {
        // Encontra o index real para não excluir o registro errado
        const realIndex = historico.findIndex(h => h.data === mov.data && h.item === mov.item);
        
        // REGRA DE NEGÓCIO: Apenas ADMIN pode ver o botão Excluir
        let botaoExcluirHTML = '';
        if (usuarioAtual && usuarioAtual.cargo === 'ADMIN') {
            botaoExcluirHTML = `<button onclick="excluirMovimentacao(${realIndex})" class="btn-delete">Excluir</button>`;
        }
        
        return `
        <tr>
            <td style="color: var(--azul-petroleo); font-size: 11px; font-weight: 600;">${mov.data}</td>
            <td><strong>${mov.item}</strong></td>
            <td><span class="badge ${mov.tipo.toLowerCase()}">${mov.tipo}</span></td>
            <td><strong style="color: var(--azul-petroleo); font-size: 16px;">${mov.quantidade}</strong></td>
            <td>${mov.tipo === 'SAÍDA' ? `👤 ${mov.cliente || 'Consumidor'}` : '---'}</td>
            <td style="color: var(--prata-aluminio); font-size: 13px; text-transform: capitalize;">${mov.usuario}</td>
            <td>
                <div style="display: flex; gap: 5px;">
                    <button onclick="verDetalhes(${realIndex})" class="btn-details">Detalhes</button>
                    <button onclick="prepararEdicaoMov(${realIndex})" class="btn-details">Editar</button>
                    ${botaoExcluirHTML}
                </div>
            </td>
        </tr>`;
    }).join('');
}

/**
 * 3. Lógica de Negócio: Registro, Edição e Estorno Numérico
 */
function registrarMovimentacao(e) {
    e.preventDefault();
    estoque = JSON.parse(localStorage.getItem('estoque_rj')) || [];

    const nomeItem = document.getElementById('itemMov').value;
    const tipo = document.getElementById('tipoMov').value;
    const qtdNova = Number(document.getElementById('qtdMov').value);
    const cliente = tipo === 'Saída' ? document.getElementById('clienteMov').value : '---';
    const observacao = document.getElementById('obsMov').value;

    const idxEstoque = estoque.findIndex(i => i.nome === nomeItem);

    // Estorno da movimentação antiga (se for modo edição)
    if (indexEdicao !== null) {
        const movAntiga = historico[indexEdicao];
        if (idxEstoque !== -1) {
            let qtdAtualNoEstoque = Number(estoque[idxEstoque].quantidade);
            let qtdAntigaMovida = Number(movAntiga.quantidade);

            if (movAntiga.tipo === "ENTRADA") {
                estoque[idxEstoque].quantidade = qtdAtualNoEstoque - qtdAntigaMovida;
            } else {
                estoque[idxEstoque].quantidade = qtdAtualNoEstoque + qtdAntigaMovida;
            }
        }
        registrarLogAuditoria(`Editou a movimentação de ${movAntiga.tipo} do item: ${nomeItem}`);
    } else {
        registrarLogAuditoria(`Registrou nova movimentação de ${tipo} do item: ${nomeItem}`);
    }

    // Aplica a nova movimentação ao saldo do estoque
    if (idxEstoque !== -1) {
        let saldoAtualizado = Number(estoque[idxEstoque].quantidade);

        if (tipo === "Entrada") {
            estoque[idxEstoque].quantidade = saldoAtualizado + qtdNova;
        } else {
            if (saldoAtualizado < qtdNova) {
                alert(`Saldo insuficiente! Estoque atual: ${saldoAtualizado}`);
                return;
            }
            estoque[idxEstoque].quantidade = saldoAtualizado - qtdNova;
        }
        localStorage.setItem('estoque_rj', JSON.stringify(estoque));
    }

    const dadosMov = {
        data: indexEdicao !== null ? historico[indexEdicao].data : new Date().toLocaleString('pt-BR'),
        item: nomeItem,
        tipo: tipo.toUpperCase(),
        quantidade: qtdNova,
        cliente: cliente,
        observacao: observacao,
        usuario: usuarioAtual ? usuarioAtual.email.split('@')[0] : 'Sistema'
    };

    if (indexEdicao !== null) historico[indexEdicao] = dadosMov;
    else historico.push(dadosMov);

    localStorage.setItem('historico_rj', JSON.stringify(historico));
    fecharModalMov();
    renderizarMovimentacoes();
}

function excluirMovimentacao(index) {
    const mov = historico[index];
    if (!confirm(`ATENÇÃO: Deseja excluir a movimentação de ${mov.item}?\nO saldo do estoque será recalculado automaticamente.`)) return;

    estoque = JSON.parse(localStorage.getItem('estoque_rj')) || [];
    const idxEstoque = estoque.findIndex(i => i.nome === mov.item);
    
    if (idxEstoque !== -1) {
        let qtdNoEstoque = Number(estoque[idxEstoque].quantidade);
        let qtdDaMovimentacao = Number(mov.quantidade);

        if (mov.tipo === "ENTRADA") {
            estoque[idxEstoque].quantidade = qtdNoEstoque - qtdDaMovimentacao;
        } else {
            estoque[idxEstoque].quantidade = qtdNoEstoque + qtdDaMovimentacao;
        }
        localStorage.setItem('estoque_rj', JSON.stringify(estoque));
    }

    registrarLogAuditoria(`Excluiu a movimentação de ${mov.tipo} do item: ${mov.item}`);
    historico.splice(index, 1);
    localStorage.setItem('historico_rj', JSON.stringify(historico));
    renderizarMovimentacoes();
}

/**
 * 4. Funções de Interface (Modal e Detalhes)
 */
function abrirModalMov() {
    estoque = JSON.parse(localStorage.getItem('estoque_rj')) || [];
    clientes = JSON.parse(localStorage.getItem('clientes_rj')) || [];

    const selectItem = document.getElementById('itemMov');
    const selectCliente = document.getElementById('clienteMov');
    
    if (estoque.length === 0) { 
        alert("Cadastre produtos no catálogo de Estoque antes de realizar movimentações."); 
        return; 
    }

    selectItem.innerHTML = '<option value="" disabled selected>Selecione um produto do catálogo...</option>' + 
        estoque.map(item => `<option value="${item.nome}">${item.nome}</option>`).join('');
    
    if (selectCliente) {
        if (clientes.length === 0) {
            selectCliente.innerHTML = '<option value="" disabled selected>Nenhum cliente cadastrado...</option>';
        } else {
            selectCliente.innerHTML = '<option value="" disabled selected>Selecione o cliente destino...</option>' + 
                clientes.map(c => `<option value="${c.nome}">${c.nome}</option>`).join('');
        }
    }
    document.getElementById('modalMovimentacao').style.display = 'flex';
}

function fecharModalMov() {
    document.getElementById('modalMovimentacao').style.display = 'none';
    document.getElementById('formMovimento').reset();
    document.querySelector('#modalMovimentacao h2').innerText = "Nova Movimentação";
    indexEdicao = null;
    if (document.getElementById('groupCliente')) document.getElementById('groupCliente').style.display = 'none';
}

function prepararEdicaoMov(index) {
    indexEdicao = index;
    const mov = historico[index];
    abrirModalMov();
    document.getElementById('tipoMov').value = mov.tipo === 'ENTRADA' ? 'Entrada' : 'Saída';
    document.getElementById('itemMov').value = mov.item;
    document.getElementById('qtdMov').value = mov.quantidade;
    document.getElementById('obsMov').value = mov.observacao || '';
    toggleCliente();
    if (mov.tipo === 'SAÍDA' && document.getElementById('clienteMov')) {
        document.getElementById('clienteMov').value = mov.cliente;
    }
    document.querySelector('#modalMovimentacao h2').innerText = "Editar Movimentação";
}

function toggleCliente() {
    const tipo = document.getElementById('tipoMov').value;
    const groupCliente = document.getElementById('groupCliente');
    if (groupCliente) {
        groupCliente.style.display = tipo === 'Saída' ? 'block' : 'none';
        document.getElementById('clienteMov').required = (tipo === 'Saída');
    }
}

function verDetalhes(index) {
    const mov = historico[index];
    const modal = document.getElementById('modalDetalhes');
    const container = document.getElementById('conteudoDetalhes');
    if (container) {
        container.innerHTML = `
            <div style="display: grid; gap: 8px; text-align: left;">
                <p><strong>Produto:</strong> ${mov.item}</p>
                <p><strong>Tipo:</strong> ${mov.tipo}</p>
                <p><strong>Quantidade:</strong> ${mov.quantidade}</p>
                <p><strong>Responsável:</strong> ${mov.usuario}</p>
                <p><strong>Destino:</strong> ${mov.cliente}</p>
                <hr style="border: 0; border-top: 1px solid var(--prata-aluminio); margin: 10px 0;">
                <p><strong>Observação:</strong></p>
                <p style="color: var(--azul-meia-noite);">${mov.observacao || 'Nenhuma observação registrada.'}</p>
            </div>`;
    }
    if (modal) modal.style.display = 'flex';
}

function fecharModalDetalhes() { 
    document.getElementById('modalDetalhes').style.display = 'none'; 
}

// Simulador de Log de Auditoria
function registrarLogAuditoria(acao) {
    const logs = JSON.parse(localStorage.getItem('logs_rj')) || [];
    const dataAtual = new Date().toLocaleString('pt-BR');
    const autor = usuarioAtual ? usuarioAtual.email.split('@')[0] : 'Sistema';
    
    logs.unshift({
        dataHora: dataAtual,
        usuario: autor,
        acao: acao,
        tela: 'Movimentações'
    });
    
    localStorage.setItem('logs_rj', JSON.stringify(logs));
}

// Fluxo de Inicialização
document.addEventListener('DOMContentLoaded', () => {
    verificarAutenticacaoEPermissoes();
    renderizarMovimentacoes();
});