let estoque = JSON.parse(localStorage.getItem('estoque_rj')) || [];
let indexEdicao = null;
let usuarioAtual = null;
let acaoExclusaoPendente = null;

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
    
    if (usuarioAtual.cargo === 'OPERADOR') {
        window.location.href = 'servicos.html';
        return;
    }

    const nomeExibicao = usuarioAtual.nome ? usuarioAtual.nome.split(' ')[0] : usuarioAtual.email.split('@')[0];
    document.getElementById('nomeUsuarioLogado').innerText = `${nomeExibicao} (${usuarioAtual.cargo})`;

    const menuContainer = document.getElementById('menuNavegacao');
    let menuHTML = '';

    if (usuarioAtual.cargo === 'ADMIN') {
        menuHTML += `<a href="relatorios.html" class="tab-item">📊 Relatórios</a>`;
    }

    // ABA ATUAL
    if (['ADMIN', 'ESTOQUISTA', 'FINANCEIRO'].includes(usuarioAtual.cargo)) {
        menuHTML += `<a href="estoque.html" class="tab-item active">📦 Estoque</a>`;
    }

    if (['ADMIN', 'FINANCEIRO', 'ESTOQUISTA'].includes(usuarioAtual.cargo)) {
        menuHTML += `<a href="movimentacoes.html" class="tab-item">📝 Movimentações</a>`;
    }
    
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
 * 2. Renderiza a tabela do Catálogo
 */
function renderizarTabela(dadosParaExibir = null) {
    const corpo = document.getElementById('corpoTabela');
    if (!corpo) return;

    if (!dadosParaExibir) {
        estoque = JSON.parse(localStorage.getItem('estoque_rj')) || [];
    }
    
    const lista = dadosParaExibir || estoque;

    if (lista.length === 0) {
        corpo.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px; color:var(--prata-aluminio); font-weight: 600;">Nenhum produto cadastrado no catálogo.</td></tr>`;
        return;
    }

    corpo.innerHTML = lista.map((item) => {
        const realIndex = estoque.findIndex(i => i.nome === item.nome);
        
        let botaoExcluirHTML = '';
        if (usuarioAtual && usuarioAtual.cargo === 'ADMIN') {
            botaoExcluirHTML = `<button onclick="remover(${realIndex})" class="btn-delete">Excluir</button>`;
        }
        
        return `
            <tr>
                <td><strong>${item.nome}</strong></td>
                <td>${item.descricao || '---'}</td>
                <td>
                    <strong style="color: var(--azul-petroleo); font-size: 16px;">${item.quantidade}</strong> 
                    <span style="font-size: 12px; color: var(--prata-aluminio); text-transform: uppercase;">${item.unidade}</span>
                </td>
                <td>${item.localizacao || '---'}</td>
                <td>
                    <div style="display: flex; gap: 8px;">
                        <button onclick="prepararEdicao(${realIndex})" class="btn-edit">Editar</button>
                        ${botaoExcluirHTML}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * 3. Funções do Modal e CRUD
 */
function filtrarEstoque() {
    const termo = document.getElementById('searchInput').value.toLowerCase();
    estoque = JSON.parse(localStorage.getItem('estoque_rj')) || []; 
    
    const filtrados = estoque.filter(item => 
        item.nome.toLowerCase().includes(termo) || 
        (item.descricao && item.descricao.toLowerCase().includes(termo))
    );
    renderizarTabela(filtrados);
}

function abrirModal() { 
    // Restaura a visibilidade da quantidade para novos cadastros
    document.getElementById('grupoQuantidade').style.display = 'flex';
    document.getElementById('modalEstoque').style.display = 'flex'; 
}

function fecharModal() { 
    document.getElementById('modalEstoque').style.display = 'none';
    indexEdicao = null; 
    document.getElementById('formEstoque').reset(); 
    document.getElementById('tituloModal').innerText = "Novo Item";
    // Volta a tornar a quantidade obrigatória pro próximo cadastro
    document.getElementById('qtdItem').required = true;
    document.getElementById('unidadeItem').required = true;
}

function prepararEdicao(index) {
    estoque = JSON.parse(localStorage.getItem('estoque_rj')) || [];
    indexEdicao = index;
    const item = estoque[index];

    document.getElementById('nomeItem').value = item.nome;
    document.getElementById('descItem').value = item.descricao || '';
    document.getElementById('locItem').value = item.localizacao || '';

    // REGRA: Esconde os campos de quantidade na edição
    document.getElementById('grupoQuantidade').style.display = 'none';
    document.getElementById('qtdItem').required = false;
    document.getElementById('unidadeItem').required = false;

    document.getElementById('tituloModal').innerText = "Editar Produto";
    document.getElementById('modalEstoque').style.display = 'flex';
}

function salvarItem(event) {
    event.preventDefault();

    const elNome = document.getElementById('nomeItem');
    estoque = JSON.parse(localStorage.getItem('estoque_rj')) || [];

    if (indexEdicao !== null) {
        // Modo Edição: Salva apenas dados textuais, preservando a quantidade atual
        registrarLogAuditoria(`Editou o cadastro do produto: ${estoque[indexEdicao].nome}`);
        
        estoque[indexEdicao].nome = elNome.value;
        estoque[indexEdicao].descricao = document.getElementById('descItem').value;
        estoque[indexEdicao].localizacao = document.getElementById('locItem').value;
    } else {
        // Modo Novo Cadastro: Salva tudo, incluindo a quantidade inicial
        const dadosItem = {
            nome: elNome.value,
            descricao: document.getElementById('descItem').value,
            quantidade: Number(document.getElementById('qtdItem').value), 
            unidade: document.getElementById('unidadeItem').value,
            localizacao: document.getElementById('locItem').value
        };
        estoque.push(dadosItem);
        registrarLogAuditoria(`Cadastrou novo produto no estoque: ${dadosItem.nome}`);
    }

    localStorage.setItem('estoque_rj', JSON.stringify(estoque));

    document.getElementById('searchInput').value = ''; 
    renderizarTabela();
    fecharModal();
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
        tela: 'Estoque'
    });
    
    localStorage.setItem('logs_rj', JSON.stringify(logs));
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    verificarAutenticacaoEPermissoes();
    renderizarTabela();
});


// Funções exclusivas do Modal 3
function fecharModalConfirmacao() {
    document.getElementById('modalConfirmacao').style.display = 'none';
    acaoExclusaoPendente = null; 
}

function confirmarExclusaoAcao() {
    if (acaoExclusaoPendente) {
        acaoExclusaoPendente(); 
    }
    fecharModalConfirmacao();
}

function remover(index) {
    const alvo = estoque[index]; 
    
    document.getElementById('textoConfirmacao').innerText = `Deseja realmente remover a peça "${alvo.nome}" do catálogo?\nEsta ação não poderá ser desfeita.`;
    
    // Salva o que vai acontecer quando ele clicar em "Sim, Excluir"
    acaoExclusaoPendente = function() {
        registrarLogAuditoria(`Excluiu a peça do catálogo: ${alvo.nome}`);
        estoque.splice(index, 1);
        localStorage.setItem('estoque_rj', JSON.stringify(estoque));
        
        // Atualiza a tabela chamando o nome correto que você usa no seu arquivo
        renderizarTabela();
    };

    // Abre o modal!
    document.getElementById('modalConfirmacao').style.display = 'flex';
}