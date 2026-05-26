// 1. Lista padrão do sistema 
const equipePadrao = [
    { nome: "João Silva", email: "patrao@rj.com", senha: "123", cargo: "ADMIN" },
    { nome: "James Estoque", email: "estoque@rj.com", senha: "123", cargo: "ESTOQUISTA" },
    { nome: "Lucas Financeiro", email: "financeiro@rj.com", senha: "123", cargo: "FINANCEIRO" },
    { nome: "André Operador", email: "operador@rj.com", senha: "123", cargo: "OPERADOR" }
];

// Inicializa a base no localStorage se estiver vazia
let usuarios = JSON.parse(localStorage.getItem('usuarios_sistema')) || [];
if (usuarios.length === 0) {
    localStorage.setItem('usuarios_sistema', JSON.stringify(equipePadrao));
    usuarios = equipePadrao;
}

let indexEdicao = null;
let usuarioAtual = null;
let acaoExclusaoPendente = null; 

/**
 * 2. REGRA DE SEGURANÇA MÁXIMA
 */
function verificarAcessoAdministrativo() {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    if (!usuarioLogado) {
        window.location.href = 'index.html';
        return;
    }

    usuarioAtual = JSON.parse(usuarioLogado);

    if (usuarioAtual.cargo !== 'ADMIN') {
        alert("Acesso restrito! Apenas administradores podem gerenciar a equipe.");
        window.location.href = 'index.html';
        return;
    }

    const nomeExibicao = usuarioAtual.nome ? usuarioAtual.nome.split(' ')[0] : usuarioAtual.email.split('@')[0];
    document.getElementById('nomeUsuarioLogado').innerText = `${nomeExibicao} (${usuarioAtual.cargo})`;

    const menuContainer = document.getElementById('menuNavegacao');
    menuContainer.innerHTML = `
        <a href="relatorios.html" class="tab-item">📊 Relatórios</a>
        <a href="estoque.html" class="tab-item">📦 Estoque</a>
        <a href="movimentacoes.html" class="tab-item">📝 Movimentações</a>
        <a href="clientes.html" class="tab-item">👥 Clientes</a>
        <a href="servicos.html" class="tab-item">⚙️ Serviços</a>
        <a href="usuarios.html" class="tab-item active">👤 Usuários</a>
        <a href="logs.html" class="tab-item">🛡️ Logs</a>
    `;
}

/**
 * 3. Renderiza a tabela de equipe
 */
function renderizarUsuarios(dados = usuarios) {
    const corpo = document.getElementById('corpoUsuarios');
    if (!corpo) return;

    if (dados.length === 0) {
        corpo.innerHTML = '<tr><td colspan="4" style="text-align:center; color: var(--prata-aluminio);">Nenhum usuário cadastrado.</td></tr>';
        return;
    }

    corpo.innerHTML = dados.map((u, index) => {
        const realIndex = usuarios.findIndex(orig => orig.email === u.email);
        
        let botaoExcluirHTML = `<button onclick="excluirUsuario(${realIndex})" class="btn-delete">Excluir</button>`;
        if (u.email === usuarioAtual.email) {
            botaoExcluirHTML = `<span style="color:var(--prata-aluminio); font-size:11px; font-style:italic;">Você</span>`;
        }

        return `
        <tr>
            <td><strong>${u.nome}</strong></td>
            <td>${u.email}</td>
            <td><span style="font-weight:700; color:var(--azul-petroleo);">${u.cargo}</span></td>
            <td>
                <div style="display: flex; gap: 5px; align-items: center;">
                    <button onclick="prepararEdicaoUsuario(${realIndex})" class="btn-edit">Editar</button>
                    ${botaoExcluirHTML}
                </div>
            </td>
        </tr>`;
    }).join('');
}

// 4. Funções do Modal Padrão de Cadastro
function abrirModalUsuario() {
    document.getElementById('modalUsuario').style.display = 'flex';
}

function fecharModalUsuario() {
    document.getElementById('modalUsuario').style.display = 'none';
    document.getElementById('formUsuario').reset();
    indexEdicao = null;
    document.getElementById('tituloModalUsr').innerText = "Novo Usuário";
    document.getElementById('emailUsuario').disabled = false;
}

function salvarUsuario(e) {
    e.preventDefault();
    usuarios = JSON.parse(localStorage.getItem('usuarios_sistema')) || [];

    const dadosUsuario = {
        nome: document.getElementById('nomeUsuario').value,
        email: document.getElementById('emailUsuario').value,
        senha: document.getElementById('senhaUsuario').value,
        cargo: document.getElementById('cargoUsuario').value
    };

    if (indexEdicao !== null) {
        registrarLogAuditoria(`Alterou o perfil da equipe do colaborador: ${usuarios[indexEdicao].nome}`);
        usuarios[indexEdicao] = dadosUsuario;
    } else {
        const emailExiste = usuarios.some(u => u.email.toLowerCase() === dadosUsuario.email.toLowerCase());
        if (emailExiste) {
            alert("Erro: Este e-mail já está cadastrado na equipe.");
            return;
        }
        usuarios.push(dadosUsuario);
        registrarLogAuditoria(`Cadastrou um novo usuário no sistema: ${dadosUsuario.nome} (${dadosUsuario.cargo})`);
    }

    localStorage.setItem('usuarios_sistema', JSON.stringify(usuarios));
    fecharModalUsuario();
    renderizarUsuarios();
}

function prepararEdicaoUsuario(index) {
    indexEdicao = index;
    const u = usuarios[index];

    document.getElementById('nomeUsuario').value = u.nome;
    document.getElementById('emailUsuario').value = u.email;
    document.getElementById('emailUsuario').disabled = true; 
    document.getElementById('senhaUsuario').value = u.senha;
    document.getElementById('cargoUsuario').value = u.cargo;

    document.getElementById('tituloModalUsr').innerText = "Editar Usuário";
    abrirModalUsuario();
}

function buscarUsuarios() {
    const termo = document.getElementById('buscaUsuario').value.toLowerCase();
    const filtrados = usuarios.filter(u => 
        u.nome.toLowerCase().includes(termo) || 
        u.email.toLowerCase().includes(termo)
    );
    renderizarUsuarios(filtrados);
}

// --- 5.NOVO MODAL DE EXCLUSÃO  ---
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

function excluirUsuario(index) {
    const alvo = usuarios[index];
    
    document.getElementById('textoConfirmacao').innerText = `Deseja realmente remover o acesso de ${alvo.nome} do sistema?\nEsta ação não poderá ser desfeita.`;
    
    acaoExclusaoPendente = function() {
        registrarLogAuditoria(`Removeu as credenciais e excluiu da equipe o usuário: ${alvo.nome}`);
        usuarios.splice(index, 1);
        localStorage.setItem('usuarios_sistema', JSON.stringify(usuarios));
        renderizarUsuarios();
    };

    document.getElementById('modalConfirmacao').style.display = 'flex';
}

function registrarLogAuditoria(acao) {
    const logs = JSON.parse(localStorage.getItem('logs_rj')) || [];
    const dataAtual = new Date().toLocaleString('pt-BR');
    const autor = usuarioAtual ? usuarioAtual.email.split('@')[0] : 'Sistema';
    
    logs.unshift({
        dataHora: dataAtual,
        usuario: autor,
        acao: acao,
        tela: 'Usuários'
    });
    
    localStorage.setItem('logs_rj', JSON.stringify(logs));
}

// Inicializa a tela
document.addEventListener('DOMContentLoaded', () => {
    verificarAcessoAdministrativo();
    renderizarUsuarios();
});