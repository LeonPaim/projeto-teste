// js/clientes-logic.js

let clientes = JSON.parse(localStorage.getItem('clientes_rj')) || [];
let indexEdicao = null;
let usuarioAtual = null;

/**
 * 1. REGRA DE NEGÓCIO: Verificação de Acesso e Renderização do Menu
 */
function verificarAutenticacaoEPermissoes() {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    
    // Se não tem ninguém logado, chuta pro login
    if (!usuarioLogado) {
        window.location.href = 'index.html';
        return;
    }

    usuarioAtual = JSON.parse(usuarioLogado);

    // Regra: Estoquista não tem acesso à tela de Clientes
    if (usuarioAtual.cargo === 'ESTOQUISTA') {
        window.location.href = 'estoque.html';
        return;
    }

    // Injeta o nome e cargo no Top Nav
    document.getElementById('nomeUsuarioLogado').innerText = `${usuarioAtual.email.split('@')[0]} (${usuarioAtual.cargo})`;

    // Constrói as abas baseadas no cargo
    const menuContainer = document.getElementById('menuNavegacao');
    let menuHTML = '';

    // Abas Gerenciais (Apenas Admin)
    if (usuarioAtual.cargo === 'ADMIN') {
        menuHTML += `<a href="relatorios.html" class="tab-item">📊 Relatórios</a>`;
    }

    // Abas Operacionais
    if (['ADMIN'].includes(usuarioAtual.cargo)) {
        menuHTML += `<a href="estoque.html" class="tab-item">📦 Estoque</a>`;
    }
    if (['ADMIN', 'FINANCEIRO'].includes(usuarioAtual.cargo)) {
        menuHTML += `<a href="movimentacoes.html" class="tab-item">📝 Movimentações</a>`;
    }
    
    // A própria aba de Clientes (Ativa) - Financeiro e Admin veem
    menuHTML += `<a href="clientes.html" class="tab-item active">👥 Clientes</a>`;

    if (['ADMIN', 'FINANCEIRO', 'OPERADOR'].includes(usuarioAtual.cargo)) {
        menuHTML += `<a href="servicos.html" class="tab-item">⚙️ Serviços</a>`;
    }

    // Mais Abas Gerenciais (Apenas Admin)
    if (usuarioAtual.cargo === 'ADMIN') {
        menuHTML += `<a href="usuarios.html" class="tab-item">👤 Usuários</a>`;
        menuHTML += `<a href="logs.html" class="tab-item">🛡️ Logs</a>`;
    }

    menuContainer.innerHTML = menuHTML;
}

/**
 * 2. Renderiza a tabela de clientes
 */
function renderizarClientes(dados = clientes) {
    const corpo = document.getElementById('corpoClientes');
    if (!corpo) return;

    if (dados.length === 0) {
        corpo.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--prata-aluminio);">Nenhum cliente cadastrado.</td></tr>';
        return;
    }

    corpo.innerHTML = dados.map((c, index) => {
        // REGRA DE NEGÓCIO: Só renderiza botão Excluir se for ADMIN
        let botaoExcluirHTML = '';
        if (usuarioAtual && usuarioAtual.cargo === 'ADMIN') {
            botaoExcluirHTML = `<button onclick="excluirCliente(${index})" class="btn-delete">Excluir</button>`;
        }

        const localizacao = c.cidade ? `${c.cidade} - ${c.estado}` : '---';

        return `
        <tr>
            <td><strong>${c.nome}</strong></td>
            <td>${c.telefone || '---'}</td>
            <td>${c.documento || '---'}</td>
            <td>${localizacao}</td>
            <td>
                <div style="display: flex; gap: 5px;">
                    <button onclick="prepararEdicao(${index})" class="btn-details">Editar</button>
                    ${botaoExcluirHTML}
                </div>
            </td>
        </tr>
    `}).join('');
}

// Funções de Modal e CRUD
function abrirModalCliente() {
    document.getElementById('modalCliente').style.display = 'flex';
}

function fecharModalCliente() {
    document.getElementById('modalCliente').style.display = 'none';
    document.getElementById('formCliente').reset();
    indexEdicao = null;
    document.getElementById('tituloModal').innerText = "Novo Cliente";
}

function salvarCliente(e) {
    e.preventDefault();
    
    const novoCliente = {
        nome: document.getElementById('nomeCliente').value,
        documento: document.getElementById('docCliente').value,
        telefone: document.getElementById('telCliente').value,
        email: document.getElementById('emailCliente').value,
        endereco: document.getElementById('endCliente').value,
        cidade: document.getElementById('cidadeCliente').value,
        estado: document.getElementById('ufCliente').value,
        observacoes: document.getElementById('obsCliente').value
    };

    if (indexEdicao !== null) {
        // LOGICA DE LOG DE AUDITORIA: Só entra aqui quando clica em Editar
        registrarLogAuditoria(`Editou o cliente: ${clientes[indexEdicao].nome}`);
        clientes[indexEdicao] = novoCliente;
    } else {
        clientes.push(novoCliente);
    }

    localStorage.setItem('clientes_rj', JSON.stringify(clientes));
    fecharModalCliente();
    renderizarClientes();
}

function prepararEdicao(index) {
    indexEdicao = index;
    const c = clientes[index];
    
    document.getElementById('nomeCliente').value = c.nome;
    document.getElementById('docCliente').value = c.documento || '';
    document.getElementById('telCliente').value = c.telefone || '';
    document.getElementById('emailCliente').value = c.email || '';
    document.getElementById('endCliente').value = c.endereco || '';
    document.getElementById('cidadeCliente').value = c.cidade || '';
    document.getElementById('ufCliente').value = c.estado || '';
    document.getElementById('obsCliente').value = c.observacoes || '';
    
    document.getElementById('tituloModal').innerText = "Editar Cliente";
    abrirModalCliente();
}

function excluirCliente(index) {
    if (confirm(`Deseja realmente excluir o cliente ${clientes[index].nome}?\nEsta ação não poderá ser desfeita.`)) {
        clientes.splice(index, 1);
        localStorage.setItem('clientes_rj', JSON.stringify(clientes));
        renderizarClientes();
    }
}

function buscarClientes() {
    const termo = document.getElementById('buscaCliente').value.toLowerCase();
    const filtrados = clientes.filter(c => 
        c.nome.toLowerCase().includes(termo) || 
        (c.documento && c.documento.includes(termo))
    );
    renderizarClientes(filtrados);
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
        tela: 'Clientes'
    });
    
    localStorage.setItem('logs_rj', JSON.stringify(logs));
}

// Fluxo de Inicialização
verificarAutenticacaoEPermissoes();
renderizarClientes();

