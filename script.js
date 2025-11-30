/* ========= VARIÁVEIS DO DOM ========= */
const calendarDays = document.getElementById("calendar-days");
const monthYear = document.getElementById("month-year");
const prevMonthBtn = document.getElementById("prev-month");
const nextMonthBtn = document.getElementById("next-month");

const tituloDia = document.getElementById("titulo-dia");
const lista = document.getElementById("lista");
const inputTarefa = document.getElementById("tarefa");
const addBtn = document.getElementById("add-btn");

// VARIÁVEIS DE AUTENTICAÇÃO E INTERFACE
const loginModal = document.getElementById("login-modal");
const emailInput = document.getElementById("email-input");
const passwordInput = document.getElementById("password-input");
const loginBtn = document.getElementById("login-btn");
const registerBtn = document.getElementById("register-btn");
const toggleAuth = document.getElementById("toggle-auth");
const authTitle = document.getElementById("auth-title");
const authError = document.getElementById("auth-error");

let dataAtual = new Date();
let diaSelecionado = formatarData(new Date());

let usuarioAtivo = null; // Armazena o UID (ID único) do usuário logado
let isLoginMode = true; // Controla se estamos em modo login ou registro


/* =======================================
   ==== AUTENTICAÇÃO E INICIALIZAÇÃO ====
   ======================================= */

/* ========= UTILS DE AUTENTICAÇÃO ========= */
function displayAuthError(message) {
    authError.textContent = message;
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    authTitle.textContent = isLoginMode ? "Acessar Agenda" : "Criar Nova Conta";
    loginBtn.style.display = isLoginMode ? 'block' : 'none';
    registerBtn.style.display = isLoginMode ? 'none' : 'block';
    toggleAuth.textContent = isLoginMode ? "Mudar para Registro" : "Mudar para Login";
    displayAuthError("");
}

toggleAuth.addEventListener('click', (e) => {
    e.preventDefault();
    toggleAuthMode();
});

/* ========= FUNÇÃO PRINCIPAL DE AUTENTICAÇÃO ========= */
function handleAuth() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    displayAuthError("");

    if (email === "" || password === "") {
        displayAuthError("Preencha email e senha.");
        return;
    }

    if (isLoginMode) {
        // MODO LOGIN
        auth.signInWithEmailAndPassword(email, password)
            .catch(error => {
                displayAuthError("Erro no login. Verifique email e senha.");
                console.error("Login Error:", error.code, error.message);
            });
    } else {
        // MODO REGISTRO
        auth.createUserWithEmailAndPassword(email, password)
            .then(() => {
                // A função onAuthStateChanged cuidará de logar e carregar a agenda
            })
            .catch(error => {
                let errorMessage = "Erro ao criar conta.";
                if (error.code === 'auth/weak-password') {
                    errorMessage = "A senha deve ter pelo menos 6 caracteres.";
                } else if (error.code === 'auth/email-already-in-use') {
                    errorMessage = "Este email já está em uso.";
                }
                displayAuthError(errorMessage);
                console.error("Registration Error:", error.code, error.message);
            });
    }
}

loginBtn.addEventListener("click", handleAuth);
registerBtn.addEventListener("click", handleAuth);


/* ========= MONITORAMENTO DO ESTADO DE AUTENTICAÇÃO ========= */

auth.onAuthStateChanged(user => {
    if (user) {
        // Usuário logado:
        usuarioAtivo = user.uid; // Usamos o UID como chave!
        loginModal.style.display = 'none'; // Esconde o modal
        
        // Inicializa a interface
        gerarCalendario();
        carregarTarefas(); 
    } else {
        // Usuário deslogado:
        usuarioAtivo = null;
        // Limpa a lista de tarefas, se necessário
        lista.innerHTML = "";
        tituloDia.textContent = "Faça Login para ver as tarefas";
        loginModal.style.display = 'flex'; // Mostra o modal
    }
});

// Inicializa o modo de interface do modal
toggleAuthMode();

/* =======================================
   ==== FUNÇÕES DE DATA E CALENDÁRIO ====
   ======================================= */

/* ========= FUNÇÃO PARA FORMATAR DATA ========= */
function formatarData(data) {
    let d = data.getDate().toString().padStart(2, "0");
    let m = (data.getMonth() + 1).toString().padStart(2, "0");
    let a = data.getFullYear();
    return `${a}-${m}-${d}`; 
}

/* ========= FUNÇÃO PARA GERAR CHAVE DE ARMAZENAMENTO ========= */
// ATUALIZADO: Inclui o UID do usuário na chave
function gerarChaveArmazenamento(data) {
    if (!usuarioAtivo) return data; 
    return `${usuarioAtivo}_${data}`; 
}


/* ========= GERAR CALENDÁRIO ========= */
function gerarCalendario() {
    if (!usuarioAtivo) return;

    calendarDays.innerHTML = "";

    const ano = dataAtual.getFullYear();
    const mes = dataAtual.getMonth();
    
    const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
    const ultimoDia = new Date(ano, mes + 1, 0).getDate();

    const meses = [
        "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
        "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
    ];

    monthYear.textContent = `${meses[mes]} ${ano}`;

    // espaços antes do dia 1
    for (let i = 0; i < primeiroDiaSemana; i++) {
        const vazio = document.createElement("div");
        vazio.classList.add("empty");
        calendarDays.appendChild(vazio);
    }

    // dias do mês
    for (let dia = 1; dia <= ultimoDia; dia++) {
        const element = document.createElement("div");
        element.textContent = dia;

        let dataString = `${ano}-${(mes+1).toString().padStart(2,"0")}-${dia.toString().padStart(2,"0")}`;

        // NOVO: VERIFICA SE O DIA TEM TAREFAS USANDO A NOVA CHAVE
        const tarefasDoDia = localStorage.getItem(gerarChaveArmazenamento(dataString));
        if (tarefasDoDia && JSON.parse(tarefasDoDia).length > 0) {
            element.classList.add("has-task");
        }
        
        // destaca o dia atual
        if (dataString === formatarData(new Date())) {
            element.classList.add("dia-atual");
        }

        // destaca o dia selecionado
        if (dataString === diaSelecionado) {
            // Remove a classe "dia-atual" se for o mesmo dia
            element.classList.remove("dia-atual"); 
            element.classList.add("dia-selecionado");
        }

        element.addEventListener("click", () => {
            diaSelecionado = dataString;
            gerarCalendario();
            carregarTarefas();
        });

        calendarDays.appendChild(element);
    }
}

/* ========= BOTÕES DE TROCA DE MÊS ========= */
prevMonthBtn.addEventListener("click", () => {
    dataAtual.setMonth(dataAtual.getMonth() - 1);
    gerarCalendario();
});

nextMonthBtn.addEventListener("click", () => {
    dataAtual.setMonth(dataAtual.getMonth() + 1);
    gerarCalendario();
});


/* =======================================
   ==== TAREFAS (AINDA USANDO LOCALSTORAGE) ====
   ======================================= */

/* ========= SALVAR TAREFAS (ATUALIZADA) ========= */
function salvarTarefas(data, tarefas) {
    // AQUI SERÁ A CHAMADA AO FIRESTORE NO PRÓXIMO PASSO
    localStorage.setItem(gerarChaveArmazenamento(data), JSON.stringify(tarefas));
    gerarCalendario(); // Atualiza o calendário para mostrar o has-task
}

/* ========= CARREGAR TAREFAS (ATUALIZADA) ========= */
function carregarTarefas() {
    if (!usuarioAtivo) return;

    lista.innerHTML = "";

    // AQUI SERÁ A CHAMADA AO FIRESTORE NO PRÓXIMO PASSO
    let tarefas = JSON.parse(localStorage.getItem(gerarChaveArmazenamento(diaSelecionado))) || [];

    // Exibe o dia selecionado e o UID para debug, depois podemos remover o UID
    tituloDia.textContent = `Tarefas de ${diaSelecionado}`; 

    tarefas.forEach((tarefa, index) => {
        criarCardTarefa(tarefa.texto, tarefa.feita, index);
    });

    if (tarefas.length === 0) {
        lista.innerHTML = `<p style="text-align: center; color: #888; margin-top: 20px;">Nenhuma tarefa para este dia.</p>`;
    }
}

/* ========= CRIAR CARD DE TAREFA ========= */
function criarCardTarefa(texto, feita, index) {
    const card = document.createElement("div");
    card.classList.add("task-card");
    if (feita) card.classList.add("task-done");

    const left = document.createElement("div");
    left.classList.add("task-left");

    const check = document.createElement("i");
    check.classList.add("fa-solid", "fa-circle-check", "task-check");
    
    check.addEventListener("click", () => marcarComoConcluida(index));

    const span = document.createElement("span");
    span.textContent = texto;

    left.appendChild(check);
    left.appendChild(span);

    const trash = document.createElement("i");
    trash.classList.add("fa-solid", "fa-trash", "task-delete");
    trash.addEventListener("click", () => removerTarefa(index));

    card.appendChild(left);
    card.appendChild(trash);

    lista.appendChild(card);
}

/* ========= ADICIONAR TAREFA ========= */
addBtn.addEventListener("click", () => {
    if (!usuarioAtivo) {
        displayAuthError("Faça login para adicionar tarefas.");
        return;
    }
    
    let texto = inputTarefa.value.trim();
    if (texto === "") return;

    let tarefas = JSON.parse(localStorage.getItem(gerarChaveArmazenamento(diaSelecionado))) || [];

    tarefas.push({ texto: texto, feita: false });
    salvarTarefas(diaSelecionado, tarefas);

    inputTarefa.value = "";
    carregarTarefas();
});

/* ========= MARCAR TAREFA COMO CONCLUÍDA ========= */
function marcarComoConcluida(index) {
    if (!usuarioAtivo) return;

    let tarefas = JSON.parse(localStorage.getItem(gerarChaveArmazenamento(diaSelecionado))) || [];
    tarefas[index].feita = !tarefas[index].feita;
    salvarTarefas(diaSelecionado, tarefas);
    carregarTarefas();
}

/* ========= REMOVER TAREFA ========= */
function removerTarefa(index) {
    if (!usuarioAtivo) return;
    
    let tarefas = JSON.parse(localStorage.getItem(gerarChaveArmazenamento(diaSelecionado))) || [];
    tarefas.splice(index, 1);
    salvarTarefas(diaSelecionado, tarefas);
    carregarTarefas();
}