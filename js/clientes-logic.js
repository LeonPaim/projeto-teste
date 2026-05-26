
let clientes = JSON.parse(localStorage.getItem('clientes_rj')) || [];
let indexEdicao = null;
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

    if (usuarioAtual.cargo === 'ESTOQUISTA') {
        window.location.href = 'estoque.html';
        return;
    }

    const nomeExibicao = usuarioAtual.nome ? usuarioAtual.nome.split(' ')[0] : usuarioAtual.email.split('@')[0];
    document.getElementById('nomeUsuarioLogado').innerText = `${nomeExibicao} (${usuarioAtual.cargo})`;

    const menuContainer = document.getElementById('menuNavegacao');
    let menuHTML = '';

    if (usuarioAtual.cargo === 'ADMIN') {
        menuHTML += `<a href="relatorios.html" class="tab-item">📊 Relatórios</a>`;
    }

    if (['ADMIN', 'ESTOQUISTA', 'FINANCEIRO'].includes(usuarioAtual.cargo)) {
        menuHTML += `<a href="estoque.html" class="tab-item">📦 Estoque</a>`;
    }

    if (['ADMIN', 'FINANCEIRO'].includes(usuarioAtual.cargo)) {
        menuHTML += `<a href="movimentacoes.html" class="tab-item">📝 Movimentações</a>`;
    }
    
    menuHTML += `<a href="clientes.html" class="tab-item active">👥 Clientes</a>`;

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

// Variável global para "lembrar" qual cliente será apagado
let idClienteParaExcluir = null;


function excluirCliente(id) {
    
    if (usuarioAtual.cargo !== 'ADMIN') {
        alert("Apenas administradores podem excluir clientes.");
        return;
    }

    idClienteParaExcluir = id;
    document.getElementById('textoModalExclusao').innerText = "Tem certeza que deseja excluir este Cliente? Esta ação não poderá ser desfeita.";
    document.getElementById('modalExclusaoCliente').style.display = 'flex';
}

// 2. Função para fechar o modal
function fecharModalExclusao() {
    idClienteParaExcluir = null; // Limpa a memória
    document.getElementById('modalExclusaoCliente').style.display = 'none';
}

// 3. Função que executa a exclusão após o clique em "Sim, Excluir"
function executarExclusaoCliente() {
    if (idClienteParaExcluir === null) return;

    let clientes = JSON.parse(localStorage.getItem('clientes_rj')) || [];
    
    // Transforma a ID recebida em Número (Index)
    const index = Number(idClienteParaExcluir);

    // Resgata o cliente para o Log antes de apagar
    const clienteDeletado = clientes[index];
    
    if (clienteDeletado && typeof registrarLogAuditoria === 'function') {
        registrarLogAuditoria(`Excluiu o cliente: ${clienteDeletado.nome || 'Sem Nome'}`);
    }

    
    if (index >= 0 && index < clientes.length) {
        clientes.splice(index, 1);
    }
    
    localStorage.setItem('clientes_rj', JSON.stringify(clientes));
    
    fecharModalExclusao(); 
    renderizarClientes(clientes);
    
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

// --- MÁSCARAS DE UI/UX ---

function mascaraCPFCNPJ(input) {
    // Remove tudo que não for número
    let valor = input.value.replace(/\D/g, '');
    
    if (valor.length <= 11) {
        // Máscara de CPF: 000.000.000-00
        valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
        valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
        valor = valor.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
        // Máscara de CNPJ: 00.000.000/0000-00
        valor = valor.replace(/^(\d{2})(\d)/, '$1.$2');
        valor = valor.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
        valor = valor.replace(/\.(\d{3})(\d)/, '.$1/$2');
        valor = valor.replace(/(\d{4})(\d)/, '$1-$2');
    }
    
    input.value = valor;
}

function mascaraTelefone(input) {
    // Remove tudo que não for número
    let valor = input.value.replace(/\D/g, '');
    
    // Máscara de Telefone: (00) 0000-0000 ou (00) 00000-0000
    valor = valor.replace(/^(\d{2})(\d)/g, '($1) $2');
    valor = valor.replace(/(\d)(\d{4})$/, '$1-$2');
    
    input.value = valor;
}

// Fluxo de Inicialização
verificarAutenticacaoEPermissoes();
renderizarClientes();

