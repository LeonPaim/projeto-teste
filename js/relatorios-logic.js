let usuarioAtual = null;
let acaoAposAlerta = null; 

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
        acaoAposAlerta(); 
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

    if (usuarioAtual.cargo !== 'ADMIN') {
        mostrarAlerta("Acesso restrito!\nApenas administradores têm acesso ao painel estratégico de relatórios.", () => {
            window.location.href = 'index.html';
        });
        return;
    }

    // Bloco padrão de exibição do usuário
    const nomeExibicao = usuarioAtual.nome ? usuarioAtual.nome.split(' ')[0] : usuarioAtual.email.split('@')[0];
    document.getElementById('nomeUsuarioLogado').innerText = `${nomeExibicao} (${usuarioAtual.cargo})`;

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
    carregarFiltrosDinamicos();
});

/**
 * Alimenta os filtros de Mês e Ano dinamicamente com base nos dados reais do sistema
 */
function carregarFiltrosDinamicos() {
    const movimentacoes = JSON.parse(localStorage.getItem('movimentacoes_rj')) || [];
    const servicos = JSON.parse(localStorage.getItem('servicos_rj')) || [];

    const anosEncontrados = new Set();
    const mesesEncontrados = new Set();

    const nomesMeses = {
        "01": "Janeiro", "02": "Fevereiro", "03": "Março", "04": "Abril",
        "05": "Maio", "06": "Junho", "07": "Julho", "08": "Agosto",
        "09": "Setembro", "10": "Outubro", "11": "Novembro", "12": "Dezembro"
    };

    // Função interna para extrair mês/ano de strings de data (Ex: "25/05/2026, 10:30:00")
    function extrairData(stringData) {
        if (!stringData) return;
        const partes = stringData.split(',')[0].split('/');
        if (partes.length === 3) {
            const mes = partes[1]; // "05"
            const ano = partes[2]; // "2026"
            mesesEncontrados.add(mes);
            anosEncontrados.add(ano);
        }
    }

    // 2. Varremos todas as movimentações e serviços extraindo as datas existentes
    movimentacoes.forEach(mov => extrairData(mov.dataHora));
    servicos.forEach(ser => extrairData(ser.data)); // ajuste para o nome do campo de data da O.S.

    // 🚨 REGRA DE SEGURANÇA: Se o sistema for novinho e não tiver NADA gravado ainda,
    // ele coloca o mês e ano atual para o chefe conseguir testar a tela.
    if (anosEncontrados.size === 0) {
        const dataAtual = new Date();
        const mesAtual = String(dataAtual.getMonth() + 1).padStart(2, '0');
        const anoAtual = String(dataAtual.getFullYear());
        mesesEncontrados.add(mesAtual);
        anosEncontrados.add(anoAtual);
    }

    const selectAno = document.getElementById('filtroAno');
    Array.from(anosEncontrados).sort((a, b) => b - a).forEach(ano => {
        const option = document.createElement('option');
        option.value = ano;
        option.innerText = ano;
        selectAno.appendChild(option);
    });

    // 4. Injetamos as opções descobertas no SELECT de Meses
    const selectMes = document.getElementById('filtroMes');
    // Ordena os meses numericamente ("01", "02"...)
    Array.from(mesesEncontrados).sort().forEach(numMes => {
        const option = document.createElement('option');
        option.value = numMes;
        option.innerText = nomesMeses[numMes] || numMes;
        selectMes.appendChild(option);
    });
}