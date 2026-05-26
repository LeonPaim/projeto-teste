// 1. Lista padrão (garante que os primeiros usuários sempre existam)
const equipePadrao = [
    { nome: "João Silva", email: "patrao@rj.com", senha: "123", cargo: "ADMIN" },
    { nome: "James Estoque", email: "estoque@rj.com", senha: "123", cargo: "ESTOQUISTA" },
    { nome: "Lucas Financeiro", email: "financeiro@rj.com", senha: "123", cargo: "FINANCEIRO" },
    { nome: "André Operador", email: "operador@rj.com", senha: "123", cargo: "OPERADOR" }
];

// Garante que o banco de dados de usuários exista logo na tela de login
let usuariosDoSistema = JSON.parse(localStorage.getItem('usuarios_sistema')) || [];
if (usuariosDoSistema.length === 0) {
    localStorage.setItem('usuarios_sistema', JSON.stringify(equipePadrao));
    usuariosDoSistema = equipePadrao;
}

// 2. A função que o formulário chama ao clicar em "Entrar"
function validarLogin(event) {
    event.preventDefault();

    const emailInput = document.getElementById('email').value;
    const senhaInput = document.getElementById('senha').value;

    // Atualiza a lista lendo do localStorage para pegar quem acabou de ser cadastrado pelo Admin
    usuariosDoSistema = JSON.parse(localStorage.getItem('usuarios_sistema')) || [];

    // Busca o usuário na lista atualizada
    const usuario = usuariosDoSistema.find(u => u.email === emailInput && u.senha === senhaInput);

    if (usuario) {
        // Salva quem logou
        localStorage.setItem('usuarioLogado', JSON.stringify(usuario));

        // Mapeamento das rotas
        const rotas = {
            'ADMIN': 'relatorios.html',
            'ESTOQUISTA': 'estoque.html',
            'FINANCEIRO': 'clientes.html',
            'OPERADOR': 'servicos.html'
        };

        // Redireciona
        window.location.href = rotas[usuario.cargo];
    } else {
        alert("E-mail ou senha incorretos! Verifique com o administrador.");
    }
}