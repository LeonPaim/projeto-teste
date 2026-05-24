// js/relatorios-logic.js

let usuarioAtual = null;
let acaoAposAlerta = null; // Memória para saber se deve mudar de tela após o clique

/**
 * --- FUNÇÕES DO NOVO MODAL DE ALERTA ---
 */
function mostrarAlerta(mensagem, acaoAoFechar = null) {
    document.getElementById('textoAlerta').innerText = mensagem;
    document.getElementById('modalAlerta').style.display = 'flex';
    acaoAposAlerta = acaoAoFechar;
}

function fecharModalAlerta() {
    document.getElementById('modalAlerta').style.display = 'none';
    if (acaoAposAlerta) {
        acaoAposAlerta(); // Executa a ação pendente (ex: voltar para tela inicial)
        acaoAposAlerta = null;
    }
}

/**
 * 1. REGRA DE SEGURANÇA MÁXIMA
 */
function verificarAcessoAdministrativo() {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    if (!usuarioLogado) {
        window.location.href = 'index.html';
        return;
    }

    usuarioAtual = JSON.parse(usuarioLogado);

    // Bloqueio inteligente: usa o modal chique e só expulsa após o clique!
    if (usuarioAtual.cargo !== 'ADMIN') {
        mostrarAlerta("Acesso restrito!\nApenas administradores têm acesso ao painel estratégico de relatórios.", () => {
            window.location.href = 'index.html';
        });
        return;
    }

    document.getElementById('nomeUsuarioLogado').innerText = `${usuarioAtual.nome} (${usuarioAtual.cargo})`;

    const menuContainer = document.getElementById('menuNavegacao');
    menuContainer.innerHTML = `
        <a href="relatorios.html" class="tab-item active">📊 Relatórios</a>
        <a href="estoque.html" class="tab-item">📦 Estoque</a>
        <a href="movimentacoes.html" class="tab-item">📝 Movimentações</a>
        <a href="clientes.html" class="tab-item">👥 Clientes</a>
        <a href="servicos.html" class="tab-item">⚙️ Serviços</a>
        <a href="usuarios.html" class="tab-item">👤 Usuários</a>
        <a href="logs.html" class="tab-item">🛡️ Logs</a>
    `;
}

/**
 * 2. Lógica de Simulação de Exportação
 */
function solicitarExportacao(formato) {
    const mes = document.getElementById('filtroMes').value;
    const ano = document.getElementById('filtroAno').value;
    const tipo = document.getElementById('filtroTipo').value;

    // Validação usando o novo Modal
    if (!mes || !ano || !tipo) {
        mostrarAlerta("É necessário preencher o Mês, o Ano e o Tipo de Informação para conseguir exportar o documento.");
        return;
    }

    const textoMes = document.getElementById('filtroMes').options[document.getElementById('filtroMes').selectedIndex].text;
    const textoTipo = document.getElementById('filtroTipo').options[document.getElementById('filtroTipo').selectedIndex].text;

    const statusDiv = document.getElementById('statusExportacao');
    statusDiv.style.display = 'block';
    statusDiv.innerText = `Comunicando com o servidor para gerar o ${formato}... Aguarde.`;
    
    document.querySelectorAll('.btn-export').forEach(btn => btn.disabled = true);

    setTimeout(() => {
        statusDiv.style.backgroundColor = '#dcfce7';
        statusDiv.style.borderColor = '#bbf7d0';
        statusDiv.style.color = '#166534';
        statusDiv.style.animation = 'none';
        statusDiv.innerText = `✅ Sucesso! O download do arquivo ${formato} começará em instantes.`;

        registrarLogAuditoria(`Exportou o ${textoTipo} (${textoMes}/${ano}) em formato ${formato}`);

        setTimeout(() => {
            statusDiv.style.display = 'none';
            statusDiv.style.backgroundColor = '#e0f2fe'; 
            statusDiv.style.borderColor = '#bae6fd';
            statusDiv.style.color = 'var(--azul-meia-noite)';
            document.querySelectorAll('.btn-export').forEach(btn => btn.disabled = false);
        }, 3000);

    }, 2000); 
}

/**
 * 3. Gravação na tabela de Logs
 */
function registrarLogAuditoria(acao) {
    const logs = JSON.parse(localStorage.getItem('logs_rj')) || [];
    const dataAtual = new Date().toLocaleString('pt-BR');
    const autor = usuarioAtual ? usuarioAtual.nome : 'Sistema';
    
    logs.unshift({
        dataHora: dataAtual,
        usuario: autor,
        acao: acao,
        tela: 'Relatórios'
    });
    
    localStorage.setItem('logs_rj', JSON.stringify(logs));
}

// Inicializa a tela
document.addEventListener('DOMContentLoaded', () => {
    verificarAcessoAdministrativo();
});