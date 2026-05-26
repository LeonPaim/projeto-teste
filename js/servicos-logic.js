let servicos = JSON.parse(localStorage.getItem('servicos_rj')) || [];
let clientes = JSON.parse(localStorage.getItem('clientes_rj')) || [];
let indexEdicao = null;
let filtroAtual = 'Todos';
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
        menuHTML += `<a href="clientes.html" class="tab-item">👥 Clientes</a>`;
    }
    
    menuHTML += `<a href="servicos.html" class="tab-item active">⚙️ Serviços</a>`;

    if (usuarioAtual.cargo === 'ADMIN') {
        menuHTML += `<a href="usuarios.html" class="tab-item">👤 Usuários</a>`;
        menuHTML += `<a href="logs.html" class="tab-item">🛡️ Logs</a>`;
    }
    menuContainer.innerHTML = menuHTML;
}

/**
 * 2. Renderiza a tabela
 */
function renderizarServicos(dados = null) {
    const corpo = document.getElementById('corpoServicos');
    if (!corpo) return;

    if (!dados) {
        servicos = JSON.parse(localStorage.getItem('servicos_rj')) || [];
    }

    let dadosParaExibir = dados || servicos;
    
    if (!dados && filtroAtual !== 'Todos') {
        dadosParaExibir = servicos.filter(s => s.status === filtroAtual);
    }

    if (dadosParaExibir.length === 0) {
        corpo.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:30px; color:var(--prata-aluminio); font-weight: 600;">Nenhum serviço encontrado.</td></tr>';
        return;
    }

    const logs = [...dadosParaExibir].reverse();

    corpo.innerHTML = logs.map((s) => {
        const realIndex = servicos.findIndex(orig => orig.id === s.id);
        const statusAtual = s.status || "Não Iniciado";
        const badgeClass = statusAtual.toLowerCase().replace(/\s+/g, '-');
        
        let infoChapa;
        if (s.origemChapa === 'Empresa') {
            infoChapa = `<div style="font-size: 11px; line-height: 1.2;">
                            <span style="color: var(--azul-petroleo); font-weight: 700;">Empresa:</span> ${s.chapaSelecionada || 'Não informada'}<br>
                            <span style="color: var(--azul-meia-noite);">Tam: ${s.tamanhoChapa || '---'}</span>
                         </div>`;
        } else {
            
            infoChapa = `<div style="font-size: 11px; line-height: 1.2;">
                            <span style="color: var(--prata-aluminio); font-weight: 700; text-transform: uppercase;">Cliente</span><br>
                            <span style="color: var(--azul-meia-noite);">Tam: ${s.tamanhoChapa || '---'}</span>
                         </div>`;
        }

        const textoObs = s.descricao ? 
            `<div style="max-width: 200px; font-size: 11px; color: var(--azul-meia-noite); white-space: pre-wrap; line-height: 1.3;">${s.descricao}</div>` : 
            '<span style="color: var(--prata-aluminio); font-style: italic;">Sem observações</span>';
        
        let valorDisplay;
        if (s.valorFinal) {
            valorDisplay = `<strong style="color: var(--azul-petroleo);">R$ ${parseFloat(s.valorFinal).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</strong>`;
        } else if (s.orcamento) {
            valorDisplay = `R$ ${parseFloat(s.orcamento).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
        } else {
            valorDisplay = '<span style="color: var(--prata-aluminio); font-style: italic;">A calcular</span>';
        }

        // REGRA DE NEGÓCIO: Só Admin exclui
        let botaoExcluirHTML = '';
        if (usuarioAtual && usuarioAtual.cargo === 'ADMIN') {
            botaoExcluirHTML = `<button onclick="excluirServico(${realIndex})" class="btn-delete">Excluir</button>`;
        }

        return `
        <tr>
            <td style="color: var(--azul-meia-noite); font-size: 11px; font-weight: 600;">${s.dataExibicao || '---'}</td>
            <td><strong style="color: var(--azul-petroleo);">👤 ${s.cliente}</strong></td>
            <td>${s.categoria}</td>
            <td>${infoChapa}</td>
            <td>${textoObs}</td> 
            <td>${valorDisplay}</td>
            <td><span class="badge ${badgeClass}">${statusAtual}</span></td>
            <td>
                <div style="display: flex; gap: 5px;">
                    <button onclick="abrirRastreio(${realIndex})" class="btn-details">Detalhes</button>
                    <button onclick="prepararEdicao(${realIndex})" class="btn-details">Editar</button>
                    ${botaoExcluirHTML}
                </div>
            </td>
        </tr>`;
    }).join('');
}

/**
 * 3. Funções de CRUD e Lógica
 */
function salvarServico(e) {
    e.preventDefault();

    const statusNovo = document.getElementById('statusServico').value;
    const valorFinal = document.getElementById('valorFinalServico').value;
    const agora = new Date().toLocaleString('pt-BR');
    const nomeResponsavel = usuarioAtual ? (usuarioAtual.nome ? usuarioAtual.nome.split(' ')[0] : usuarioAtual.email.split('@')[0]) : 'Sistema';

    
    if (statusNovo === 'Nota Emitida' && !valorFinal) {
        abrirModalAlerta("Por favor, informe o Valor Final para emitir a nota.");
        return;
    }

    const valorTamanhoCorte = document.getElementById('tamanhoCorte') ? document.getElementById('tamanhoCorte').value : '';

    // Guarda as variáveis temporariamente na memória global
    dadosPendentesParaSalvar = {
        statusNovo, valorFinal, agora, nomeResponsavel, valorTamanhoCorte
    };

    // 2. Troca do "confirm" pelo Modal de Confirmação
    abrirModalConfirmacao(
        `Deseja confirmar a gravação da O.S. com o status: ${statusNovo}?`,
        executarSalvamentoOculto
    );
}


function executarSalvamentoOculto() {
    if (!dadosPendentesParaSalvar) return;

    // Resgata os dados guardados
    const { statusNovo, valorFinal, agora, nomeResponsavel, valorTamanhoCorte } = dadosPendentesParaSalvar;

    servicos = JSON.parse(localStorage.getItem('servicos_rj')) || [];
    let historicoLogs = [];

    if (indexEdicao !== null) {
        historicoLogs = servicos[indexEdicao].historico || [];
        const ultimoStatus = historicoLogs.length > 0 ? historicoLogs[historicoLogs.length - 1].status : null;
        if (statusNovo !== ultimoStatus) {
            historicoLogs.push({ status: statusNovo, dataHora: agora, responsavel: nomeResponsavel });
        }
        registrarLogAuditoria(`Editou a O.S. do cliente: ${servicos[indexEdicao].cliente}`);
    } else {
        historicoLogs.push({ status: statusNovo, dataHora: agora, responsavel: nomeResponsavel });
        registrarLogAuditoria(`Criou uma nova O.S. para o cliente: ${document.getElementById('clienteServico').value}`);
    }

    const novoServico = {
        id: indexEdicao !== null ? servicos[indexEdicao].id : Date.now(),
        dataExibicao: indexEdicao !== null ? servicos[indexEdicao].dataExibicao : agora.split(',')[0],
        cliente: document.getElementById('clienteServico').value,
        categoria: document.getElementById('categoriaServico').value,
        orcamento: document.getElementById('orcamentoServico').value,
        valorFinal: valorFinal || null,
        origemChapa: document.getElementById('origemChapa').value,
        tamanhoChapa: valorTamanhoCorte,
        chapaSelecionada: document.getElementById('origemChapa').value === 'Empresa' ? document.getElementById('chapaParaCortar').value : null,
        status: statusNovo,
        tempo: document.getElementById('tempoServico').value,
        descricao: document.getElementById('descServico').value,
        historico: historicoLogs
    };

    if (indexEdicao !== null) {
        servicos[indexEdicao] = novoServico;
    } else {
        servicos.push(novoServico);
    }

    localStorage.setItem('servicos_rj', JSON.stringify(servicos));
    
    // Limpeza após salvar
    dadosPendentesParaSalvar = null;
    fecharModalConfirmacao();
    fecharModalServico();

    setTimeout(() => {
        renderizarServicos(); 
    }, 50);
}

function abrirRastreio(index) {
    servicos = JSON.parse(localStorage.getItem('servicos_rj')) || [];
    const s = servicos[index];
    if (!s) return;
    
    const timeline = document.getElementById('timelineRastreio');
    
    timeline.innerHTML = (s.historico || []).slice().reverse().map((log, i) => `
        <div style="position: relative; margin-bottom: 25px;">
            <div style="position: absolute; left: -31px; top: 4px; width: 12px; height: 12px; background: ${i === 0 ? 'var(--azul-meia-noite)' : 'var(--prata-aluminio)'}; border-radius: 50%; border: 2px solid var(--branco-puro);"></div>
            <div style="font-weight: 700; color: var(--azul-petroleo); font-size: 14px; text-transform: uppercase;">${log.status}</div>
            <div style="font-size: 12px; color: var(--azul-meia-noite);">${log.dataHora}</div>
            <div style="font-size: 11px; color: var(--azul-petroleo);">Atualizado por: <strong style="text-transform: capitalize;">${log.responsavel}</strong></div>
        </div>
    `).join('');

    document.getElementById('modalRastreio').style.display = 'flex';
}

function fecharModalRastreio() { document.getElementById('modalRastreio').style.display = 'none'; }

function prepararEdicao(index) {
    servicos = JSON.parse(localStorage.getItem('servicos_rj')) || [];
    indexEdicao = index;
    const s = servicos[index];
    
    abrirModalServico();
    document.getElementById('clienteServico').value = s.cliente;
    document.getElementById('categoriaServico').value = s.categoria;
    document.getElementById('orcamentoServico').value = s.orcamento;
    document.getElementById('valorFinalServico').value = s.valorFinal || '';
    document.getElementById('origemChapa').value = s.origemChapa;
    
    toggleTamanhoChapa(); 
    if(s.origemChapa === 'Empresa') {
        document.getElementById('chapaParaCortar').value = s.chapaSelecionada || '';
        document.getElementById('tamanhoChapa').value = s.tamanhoChapa || '';
    }

    document.getElementById('statusServico').value = s.status;
    document.getElementById('tempoServico').value = s.tempo || '';
    document.getElementById('descServico').value = s.descricao;
    
    gerenciarCamposDinamicos();
    document.getElementById('tituloModalServ').innerText = "Editar O.S. #" + s.id.toString().slice(-4);
}

function gerenciarCamposDinamicos() {
    const status = document.getElementById('statusServico').value;
    const groupTempo = document.getElementById('groupTempoServico');
    groupTempo.style.display = ['Finalizado', 'Nota Emitida', 'Coletado'].includes(status) ? 'block' : 'none';

    const groupValor = document.getElementById('groupValorFinal');
    groupValor.style.display = ['Nota Emitida', 'Coletado'].includes(status) ? 'block' : 'none';
}

function toggleTamanhoChapa() {
    const origem = document.getElementById('origemChapa').value;
    
    const groupEmpresa = document.getElementById('groupDadosChapaEmpresa');
    const groupTamanho = document.getElementById('grupoTamanhoCorte');
    
    const inputTamanho = document.getElementById('tamanhoCorte');
    const inputChapa = document.getElementById('chapaParaCortar');

    if (origem === 'Empresa') {
        groupEmpresa.style.display = 'block';
        groupTamanho.style.display = 'block';
        
        inputTamanho.required = true;
        inputChapa.required = true;
    } else {
        groupEmpresa.style.display = 'none';
        groupTamanho.style.display = 'none';
        
        inputTamanho.required = false;
        inputTamanho.value = '';
        
        inputChapa.required = false;
        inputChapa.value = '';
    }
}

function filtrarPorCliente() {
    const termo = document.getElementById('buscaServicoCliente').value.toLowerCase();
    const filtrados = servicos.filter(s => s.cliente.toLowerCase().includes(termo));
    renderizarServicos(filtrados);
}

function abrirModalServico() {
    clientes = JSON.parse(localStorage.getItem('clientes_rj')) || [];
    const selectCliente = document.getElementById('clienteServico');
    
    
    if (clientes.length === 0) {
        abrirModalAlerta(
            "Cadastre clientes na base antes de gerar uma Ordem de Serviço.",
            () => { window.location.href = 'clientes.html'; } 
        );
        return; // Interrompe a função para não abrir o modal da O.S. por trás
    }

    // Se tiver cliente, o fluxo segue normalmente
    toggleTamanhoChapa();
    
    selectCliente.innerHTML = '<option value="" disabled selected>Selecione o cliente...</option>' + 
        clientes.map(c => `<option value="${c.nome}">${c.nome}</option>`).join('');
        
    document.getElementById('modalServico').style.display = 'flex';
}

function fecharModalServico() {
    document.getElementById('modalServico').style.display = 'none';
    document.getElementById('formServico').reset();
    document.getElementById('groupDadosChapaEmpresa').style.display = 'none';
    document.getElementById('groupTempoServico').style.display = 'none';
    document.getElementById('groupValorFinal').style.display = 'none';
    indexEdicao = null;
    document.getElementById('tituloModalServ').innerText = "Nova Ordem de Serviço";
}

// Variável global para "lembrar" qual serviço vai ser apagado enquanto o modal fica aberto
let idServicoParaExcluir = null;

// 1. Função chamada pelo botão vermelho da lixeira na tabela
function excluirServico(id) {
    idServicoParaExcluir = id;
    document.getElementById('textoModalExclusao').innerText = "Tem certeza que deseja excluir esta Ordem de Serviço? Esta ação não poderá ser desfeita.";
    document.getElementById('modalExclusaoServico').style.display = 'flex';
}

// 2. Função para fechar o modal caso o Admin desista
function fecharModalExclusao() {
    idServicoParaExcluir = null; // Limpa a memória
    document.getElementById('modalExclusaoServico').style.display = 'none';
}

// 3. Função que realmente apaga (acionada pelo botão "Sim, Excluir")
function executarExclusaoServico() {
    if (idServicoParaExcluir === null) return;

    let servicos = JSON.parse(localStorage.getItem('servicos_rj')) || [];
    
    // Como estamos recebendo a POSIÇÃO (index) da tabela, garantimos que é um número
    const index = Number(idServicoParaExcluir);

    // Pega o serviço exato daquela posição para salvar no Log
    const servicoDeletado = servicos[index];
    
    if (servicoDeletado && typeof registrarLogAuditoria === 'function') {
        registrarLogAuditoria(`Excluiu a O.S. do cliente: ${servicoDeletado.cliente}`);
    }

    // O comando splice vai na posição exata e remove 1 item dali
    if (index >= 0 && index < servicos.length) {
        servicos.splice(index, 1);
    }
    
    localStorage.setItem('servicos_rj', JSON.stringify(servicos));
    
    fecharModalExclusao(); 
    renderizarServicos(); 
}

function filtrarServicos(status) {
    filtroAtual = status;
    document.querySelectorAll('.btn-filter').forEach(btn => {
        btn.classList.remove('active');
        const texto = btn.innerText.trim();
        if (status === 'Todos' && texto === 'Todos' || texto === status + 's' || texto === status || (status === 'Nota Emitida' && texto === status)) {
            btn.classList.add('active');
        }
    });
    renderizarServicos();
}

// Variável global para segurar os dados enquanto o modal de confirmação está aberto
let dadosPendentesParaSalvar = null;

function abrirModalConfirmacao(mensagem, acaoAoConfirmar) {
    document.getElementById('textoModalConfirmacao').innerText = mensagem;
    const btnConfirmar = document.getElementById('btnConfirmarAcao');
    btnConfirmar.onclick = acaoAoConfirmar; 
    document.getElementById('modalConfirmacao').style.display = 'flex';
}

function fecharModalConfirmacao() {
    document.getElementById('modalConfirmacao').style.display = 'none';
}

let acaoAposAlerta = null;

function abrirModalAlerta(mensagem, acaoOpcional = null) {
    document.getElementById('textoModalAlerta').innerText = mensagem;
    acaoAposAlerta = acaoOpcional; // Guarda a instrução na memória
    document.getElementById('modalAlerta').style.display = 'flex';
}

function fecharModalAlerta() {
    document.getElementById('modalAlerta').style.display = 'none';
    
    // Se tiver alguma ação guardada (como redirecionar), executa agora!
    if (acaoAposAlerta) {
        acaoAposAlerta(); 
        acaoAposAlerta = null; // Limpa a memória
    }
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
        tela: 'Serviços'
    });
    
    localStorage.setItem('logs_rj', JSON.stringify(logs));
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    verificarAutenticacaoEPermissoes();
    renderizarServicos();
});