let logsLocais = JSON.parse(localStorage.getItem('logs_rj')) || [];
let usuarioAtual = null;

/**
 * 1. REGRA DE SEGURANÇA MÁXIMA: Só o Admin pode acessar essa tela
 */
function verificarAcessoAdministrativo() {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    if (!usuarioLogado) {
        window.location.href = 'index.html';
        return;
    }

    usuarioAtual = JSON.parse(usuarioLogado);

    // Se não for ADMIN, bloqueia imediatamente
    if (usuarioAtual.cargo !== 'ADMIN') {
        alert("Acesso restrito! Apenas administradores têm permissão para visualizar os logs do sistema.");
        window.location.href = 'index.html';
        return;
    }

    // Bloco padrão de exibição do usuário
    const nomeExibicao = usuarioAtual.nome ? usuarioAtual.nome.split(' ')[0] : usuarioAtual.email.split('@')[0];
    document.getElementById('nomeUsuarioLogado').innerText = `${nomeExibicao} (${usuarioAtual.cargo})`;

    const menuContainer = document.getElementById('menuNavegacao');
    menuContainer.innerHTML = `
        <a href="relatorios.html" class="tab-item">📊 Relatórios</a>
        <a href="estoque.html" class="tab-item">📦 Estoque</a>
        <a href="movimentacoes.html" class="tab-item">📝 Movimentações</a>
        <a href="clientes.html" class="tab-item">👥 Clientes</a>
        <a href="servicos.html" class="tab-item">⚙️ Serviços</a>
        <a href="usuarios.html" class="tab-item">👤 Usuários</a>
        <a href="logs.html" class="tab-item active">🛡️ Logs</a>
    `;
}

/**
 * 2. Renderiza a listagem de auditoria no formato de console de logs
 */
function renderizarLogs(dados = logsLocais) {
    const painel = document.getElementById('painelLogs');
    if (!painel) return;

    if (dados.length === 0) {
        painel.innerHTML = `<div class="empty-logs">>_ Nenhum registo de alteração ou segurança detetado no sistema.</div>`;
        return;
    }

    // Renderiza as linhas formatadas sem botões de ação (Passivo)
    painel.innerHTML = dados.map(log => `
        <div class="log-line">
            <span class="log-date">[${log.dataHora}]</span> 
            <span class="log-user">@${log.usuario.toLowerCase()}</span> 
            na tela <span class="log-screen">${log.tela}</span>: 
            <span class="log-text">"${log.acao}"</span>
        </div>
    `).join('');
}

/**
 * 3. Filtro dinâmico da caixa de pesquisa (Busca por utilizador, data ou texto da ação)
 */
function filtrarLogs() {
    const termo = document.getElementById('buscaLog').value.toLowerCase();
    logsLocais = JSON.parse(localStorage.getItem('logs_rj')) || [];

    const filtrados = logsLocais.filter(log => 
        log.usuario.toLowerCase().includes(termo) ||
        log.dataHora.toLowerCase().includes(termo) ||
        log.tela.toLowerCase().includes(termo) ||
        log.acao.toLowerCase().includes(termo)
    );

    renderizarLogs(filtrados);
}

// Inicialização da página
document.addEventListener('DOMContentLoaded', () => {
    verificarAcessoAdministrativo();
    renderizarLogs();
});