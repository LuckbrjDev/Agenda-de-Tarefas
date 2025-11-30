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

let usuarioAtivo = null; 
let isLoginMode = true; 
let diasComTarefas = {}; 


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

/* ========= FUNÇÃO PRINCIPAL DE AUTENTICAÇÃO (FIREBASE AUTH) ========= */
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
                // Se sucesso, o onAuthStateChanged loga o usuário
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
        usuarioAtivo = user.uid; 
        loginModal.style.display = 'none';
        
        // Inicializa a interface com os dados do usuário
        gerarCalendario();
        carregarTarefas(); 
    } else {
        // Usuário deslogado:
        usuarioAtivo = null;
        lista.innerHTML = "";
        tituloDia.textContent = "Faça Login para ver as tarefas";
        loginModal.style.display = 'flex';
    }
});

toggleAuthMode();


/* ========================================================
   ==== FUNÇÕES DE PERSISTÊNCIA (FIRESTORE DATABASE) ====
   ======================================================== */

/**
 * Salva a lista de tarefas para o dia no Firestore.
 */
async function salvarTarefas(data, tarefas) {
    if (!usuarioAtivo) return;

    try {
        // users/{UID}/tasks/{YYYY-MM-DD}
        const docRef = db.collection('users').doc(usuarioAtivo).collection('tasks').doc(data);
        
        await docRef.set({ tarefas: tarefas });

        carregarIndicadoresTarefas(); 
    } catch (error) {
        console.error("Erro ao salvar tarefas no Firestore:", error);
        alert("Erro ao salvar. Verifique sua conexão ou regras do Firebase.");
    }
}

/**
 * Carrega a lista de tarefas do Firestore.
 */
async function carregarTarefas() {
    if (!usuarioAtivo) return;

    lista.innerHTML = "";
    tituloDia.textContent = `Tarefas de ${diaSelecionado}`;

    try {
        const docRef = db.collection('users').doc(usuarioAtivo).collection('tasks').doc(diaSelecionado);
        const doc = await docRef.get();

        let tarefas = [];
        if (doc.exists) {
            tarefas = doc.data().tarefas || []; 
        }

        tarefas.forEach((tarefa, index) => {
            criarCardTarefa(tarefa.texto, tarefa.feita, index);
        });

        if (tarefas.length === 0) {
            lista.innerHTML = `<p style="text-align: center; color: #888; margin-top: 20px;">Nenhuma tarefa para este dia.</p>`;
        }
    } catch (error) {
        console.error("Erro ao carregar tarefas do Firestore:", error);
        lista.innerHTML = `<p style="text-align: center; color: red; margin-top: 20px;">Erro ao carregar tarefas.</p>`;
    }
}

/**
 * Consulta o Firestore para saber quais dias do mês atual têm tarefas.
 */
async function carregarIndicadoresTarefas() {
    if (!usuarioAtivo) return;

    diasComTarefas = {}; 
    const ano = dataAtual.getFullYear();
    const mes = dataAtual.getMonth();

    try {
        const tasksCollectionRef = db.collection('users').doc(usuarioAtivo).collection('tasks');
        const snapshot = await tasksCollectionRef.get();

        snapshot.forEach(doc => {
            const dataKey = doc.id; 
            const [docAno, docMes] = dataKey.split('-');
            
            // Verifica se pertence ao mês/ano atual E se tem tarefas
            if (parseInt(docAno) === ano && parseInt(docMes) - 1 === mes && doc.data().tarefas?.length > 0) {
                diasComTarefas[dataKey] = true;
            }
        });
        
        // Renderiza o calendário com os novos indicadores
        gerarCalendario(false); 
    } catch (error) {
        console.error("Erro ao carregar indicadores:", error);
    }
}


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


/* ========= GERAR CALENDÁRIO (ATUALIZADA) ========= */
function gerarCalendario(shouldLoadIndicators = true) {
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

        // VERIFICA INDICADORES DO FIRESTORE
        if (diasComTarefas[dataString]) {
            element.classList.add("has-task");
        }
        
        // destaca o dia atual
        if (dataString === formatarData(new Date())) {
            element.classList.add("dia-atual");
        }

        // destaca o dia selecionado
        if (dataString === diaSelecionado) {
            element.classList.remove("dia-atual"); 
            element.classList.add("dia-selecionado");
        }

        element.addEventListener("click", () => {
            diaSelecionado = dataString;
            gerarCalendario(false); 
            carregarTarefas(); 
        });

        calendarDays.appendChild(element);
    }
    
    // Chama o Firebase para atualizar os indicadores
    if(shouldLoadIndicators) {
        carregarIndicadoresTarefas();
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
   ==== MANIPULAÇÃO DE TAREFAS (AÇÕES) ====
   ======================================= */

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

/* ========= ADICIONAR TAREFA (ASYNC) ========= */
addBtn.addEventListener("click", async () => {
    if (!usuarioAtivo) {
        displayAuthError("Faça login para adicionar tarefas.");
        return;
    }
    
    let texto = inputTarefa.value.trim();
    if (texto === "") return;

    // 1. Carrega as tarefas existentes do Firestore
    let tarefas = [];
    try {
        const docRef = db.collection('users').doc(usuarioAtivo).collection('tasks').doc(diaSelecionado);
        const doc = await docRef.get();
        if (doc.exists) {
            tarefas = doc.data().tarefas || [];
        }
    } catch (e) {
        console.error("Erro ao carregar tarefas para adicionar:", e);
        return;
    }

    // 2. Adiciona a nova tarefa
    tarefas.push({ texto: texto, feita: false });
    
    // 3. Salva a lista completa de volta no Firestore
    await salvarTarefas(diaSelecionado, tarefas); 

    inputTarefa.value = "";
    carregarTarefas();
});

/* ========= MARCAR TAREFA COMO CONCLUÍDA (ASYNC) ========= */
async function marcarComoConcluida(index) {
    if (!usuarioAtivo) return;

    let tarefas = [];
    try {
        const docRef = db.collection('users').doc(usuarioAtivo).collection('tasks').doc(diaSelecionado);
        const doc = await docRef.get();
        if (doc.exists) {
            tarefas = doc.data().tarefas || [];
        }
    } catch (e) {
        console.error("Erro ao carregar tarefas para modificar:", e);
        return;
    }

    if (tarefas[index]) {
        tarefas[index].feita = !tarefas[index].feita;
        await salvarTarefas(diaSelecionado, tarefas);
        carregarTarefas();
    }
}

/* ========= REMOVER TAREFA (ASYNC) ========= */
async function removerTarefa(index) {
    if (!usuarioAtivo) return;
    
    let tarefas = [];
    try {
        const docRef = db.collection('users').doc(usuarioAtivo).collection('tasks').doc(diaSelecionado);
        const doc = await docRef.get();
        if (doc.exists) {
            tarefas = doc.data().tarefas || [];
        }
    } catch (e) {
        console.error("Erro ao carregar tarefas para remover:", e);
        return;
    }
    
    tarefas.splice(index, 1);
    await salvarTarefas(diaSelecionado, tarefas);
    carregarTarefas();
}