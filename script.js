/* ========= VARIÁVEIS ========= */
const calendarDays = document.getElementById("calendar-days");
const monthYear = document.getElementById("month-year");
const prevMonthBtn = document.getElementById("prev-month");
const nextMonthBtn = document.getElementById("next-month");

const tituloDia = document.getElementById("titulo-dia");
const lista = document.getElementById("lista");
const inputTarefa = document.getElementById("tarefa");
const addBtn = document.getElementById("add-btn");

let dataAtual = new Date();
let diaSelecionado = formatarData(new Date());

/* ========= FUNÇÃO PARA FORMATAR DATA ========= */
function formatarData(data) {
    let d = data.getDate().toString().padStart(2, "0");
    let m = (data.getMonth() + 1).toString().padStart(2, "0");
    let a = data.getFullYear();
    return `${a}-${m}-${d}`; 
}

/* ========= GERAR CALENDÁRIO ========= */
function gerarCalendario() {
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

        // destaca o dia atual
        if (dataString === formatarData(new Date())) {
            element.classList.add("dia-atual");
        }

        // destaca o dia selecionado
        if (dataString === diaSelecionado) {
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

/* ========= SALVAR TAREFAS ========= */
function salvarTarefas(data, tarefas) {
    localStorage.setItem(data, JSON.stringify(tarefas));
}

/* ========= CARREGAR TAREFAS ========= */
function carregarTarefas() {
    lista.innerHTML = "";

    let tarefas = JSON.parse(localStorage.getItem(diaSelecionado)) || [];

    tituloDia.textContent = `Tarefas de ${diaSelecionado}`;

    tarefas.forEach((tarefa, index) => {
        criarCardTarefa(tarefa.texto, tarefa.feita, index);
    });
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
    check.style.color = feita ? "#4caf50" : "#555";

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
    let texto = inputTarefa.value.trim();
    if (texto === "") return;

    let tarefas = JSON.parse(localStorage.getItem(diaSelecionado)) || [];

    tarefas.push({ texto: texto, feita: false });
    salvarTarefas(diaSelecionado, tarefas);

    inputTarefa.value = "";
    carregarTarefas();
});

/* ========= MARCAR TAREFA COMO CONCLUÍDA ========= */
function marcarComoConcluida(index) {
    let tarefas = JSON.parse(localStorage.getItem(diaSelecionado)) || [];
    tarefas[index].feita = !tarefas[index].feita;
    salvarTarefas(diaSelecionado, tarefas);
    carregarTarefas();
}

/* ========= REMOVER TAREFA ========= */
function removerTarefa(index) {
    let tarefas = JSON.parse(localStorage.getItem(diaSelecionado)) || [];
    tarefas.splice(index, 1);
    salvarTarefas(diaSelecionado, tarefas);
    carregarTarefas();
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


/* ========= INICIALIZAÇÃO ========= */
gerarCalendario();
carregarTarefas();
