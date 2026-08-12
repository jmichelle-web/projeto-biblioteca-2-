// ========================================
// DADOS
// ========================================

let alunos =
    JSON.parse(localStorage.getItem("alunos")) || [];

let livros =
    JSON.parse(localStorage.getItem("livros")) || [];

let emprestimos =
    JSON.parse(localStorage.getItem("emprestimos")) || [];


// ========================================
// CONFIGURAÇÃO DAS MULTAS
// ========================================

// 15 dias de tolerância depois do vencimento
const DIAS_TOLERANCIA = 15;

// Primeira multa
const MULTA_INICIAL = 2;

// A cada 7 dias depois da multa inicial
const MULTA_SEMANAL = 4;


// ========================================
// LIVROS DE EXEMPLO
// ========================================

if (livros.length === 0) {

    livros = [

        {
            id: 1,
            titulo: "Dom Casmurro",
            autor: "Machado de Assis",
            isbn: "978000000001",
            categoria: "Romance",
            tipo: "Livro",
            ano: 1899,
            status: "Disponível"
        },

        {
            id: 2,
            titulo: "O Pequeno Príncipe",
            autor: "Antoine de Saint-Exupéry",
            isbn: "978000000002",
            categoria: "Infantil",
            tipo: "Livro",
            ano: 1943,
            status: "Disponível"
        },

        {
            id: 3,
            titulo: "O Hobbit",
            autor: "J. R. R. Tolkien",
            isbn: "978000000003",
            categoria: "Fantasia",
            tipo: "Livro",
            ano: 1937,
            status: "Emprestado"
        },

        {
            id: 4,
            titulo: "1984",
            autor: "George Orwell",
            isbn: "978000000004",
            categoria: "Ficção",
            tipo: "Livro",
            ano: 1949,
            status: "Disponível"
        },

        {
            id: 5,
            titulo: "Turma da Mônica",
            autor: "Mauricio de Sousa",
            isbn: "978000000005",
            categoria: "História em Quadrinhos",
            tipo: "Gibi",
            ano: 2020,
            status: "Disponível"
        },

        {
            id: 6,
            titulo: "Homem-Aranha",
            autor: "Marvel",
            isbn: "978000000006",
            categoria: "Aventura",
            tipo: "História em Quadrinhos",
            ano: 2022,
            status: "Emprestado"
        },

        {
            id: 7,
            titulo: "Naruto",
            autor: "Masashi Kishimoto",
            isbn: "978000000007",
            categoria: "Aventura",
            tipo: "Mangá",
            ano: 1999,
            status: "Disponível"
        },

        {
            id: 8,
            titulo: "Percy Jackson",
            autor: "Rick Riordan",
            isbn: "978000000008",
            categoria: "Fantasia",
            tipo: "Livro",
            ano: 2005,
            status: "Disponível"
        },

        {
            id: 9,
            titulo: "O Código Da Vinci",
            autor: "Dan Brown",
            isbn: "978000000009",
            categoria: "Mistério",
            tipo: "Livro",
            ano: 2003,
            status: "Emprestado"
        },

        {
            id: 10,
            titulo: "Uma Breve História do Tempo",
            autor: "Stephen Hawking",
            isbn: "978000000010",
            categoria: "Ciências",
            tipo: "Livro",
            ano: 1988,
            status: "Disponível"
        }

    ];

    salvarDados();
}


// ========================================
// SALVAR
// ========================================

function salvarDados() {

    localStorage.setItem(
        "alunos",
        JSON.stringify(alunos)
    );

    localStorage.setItem(
        "livros",
        JSON.stringify(livros)
    );

    localStorage.setItem(
        "emprestimos",
        JSON.stringify(emprestimos)
    );
}


// ========================================
// GERAR ID
// ========================================

function gerarId(lista) {

    if (lista.length === 0) {
        return 1;
    }

    return Math.max(
        ...lista.map(item => item.id)
    ) + 1;
}


// ========================================
// CONVERTER DATA
// ========================================

function converterData(data) {

    if (!data) {
        return null;
    }

    const partes = data.split("-");

    return new Date(
        Number(partes[0]),
        Number(partes[1]) - 1,
        Number(partes[2])
    );
}


// ========================================
// CALCULAR DIAS DE ATRASO
// ========================================

function calcularDiasAtraso(
    previsaoEntrega,
    dataFinal
) {

    const dataPrevista =
        converterData(previsaoEntrega);

    const dataAtual =
        converterData(dataFinal);

    if (!dataPrevista || !dataAtual) {
        return 0;
    }

    const diferenca =
        dataAtual - dataPrevista;

    const dias =
        Math.floor(
            diferenca /
            (1000 * 60 * 60 * 24)
        );

    return Math.max(0, dias);
}


// ========================================
// CALCULAR MULTA
// ========================================

function calcularMulta(
    previsaoEntrega,
    dataFinal
) {

    const diasAtraso =
        calcularDiasAtraso(
            previsaoEntrega,
            dataFinal
        );


    // Ainda está dentro dos 15 dias
    // de tolerância
    if (
        diasAtraso <= DIAS_TOLERANCIA
    ) {

        return 0;
    }


    // Quantos dias passaram
    // depois dos 15 dias?
    const diasDepoisTolerancia =
        diasAtraso -
        DIAS_TOLERANCIA;


    // Primeira multa de R$ 2,00
    let multa =
        MULTA_INICIAL;


    // A cada 7 dias adicionais
    // soma R$ 4,00
    const semanasExtras =
        Math.floor(
            (diasDepoisTolerancia - 1) / 7
        );


    multa +=
        semanasExtras *
        MULTA_SEMANAL;


    return multa;
}


// ========================================
// STATUS DA DEVOLUÇÃO
// ========================================

function obterStatusDevolucao(
    emprestimo,
    dataFinal
) {

    const diasAtraso =
        calcularDiasAtraso(
            emprestimo.previsaoEntrega,
            dataFinal
        );


    if (diasAtraso === 0) {

        return {
            texto: "🟢 Devolvido no prazo",
            classe: "no-prazo"
        };

    }


    if (
        diasAtraso <=
        DIAS_TOLERANCIA
    ) {

        return {
            texto:
                "🟡 Dentro do prazo de tolerância",
            classe: "tolerancia"
        };

    }


    const multa =
        calcularMulta(
            emprestimo.previsaoEntrega,
            dataFinal
        );


    return {
        texto:
            `🔴 Precisou pagar multa: R$ ${multa.toFixed(2).replace(".", ",")}`,
        classe: "com-multa"
    };
}


// ========================================
// CADASTRAR ALUNO
// ========================================

document
    .getElementById("formAluno")
    .addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            const aluno = {

                id:
                    gerarId(alunos),

                nome:
                    document
                        .getElementById(
                            "nomeAluno"
                        )
                        .value
                        .trim(),

                matricula:
                    document
                        .getElementById(
                            "matricula"
                        )
                        .value
                        .trim(),

                turma:
                    document
                        .getElementById(
                            "turma"
                        )
                        .value
                        .trim(),

                email:
                    document
                        .getElementById(
                            "email"
                        )
                        .value
                        .trim(),

                telefone:
                    document
                        .getElementById(
                            "telefone"
                        )
                        .value
                        .trim()

            };


            alunos.push(aluno);

            salvarDados();

            this.reset();

            listarAlunos();

            carregarAlunos();

            alert(
                "Aluno cadastrado com sucesso!"
            );

        }
    );


// ========================================
// LISTAR ALUNOS
// ========================================

function listarAlunos() {

    const tabela =
        document.getElementById(
            "tabelaAlunos"
        );

    tabela.innerHTML = "";


    alunos.forEach(aluno => {

        const linha =
            document.createElement("tr");


        linha.innerHTML = `

            <td>
                ${aluno.id}
            </td>

            <td>
                ${aluno.nome}
            </td>

            <td>
                ${aluno.matricula}
            </td>

            <td>
                ${aluno.turma}
            </td>

            <td>
                ${aluno.email || "-"}
            </td>

            <td>
                ${aluno.telefone || "-"}
            </td>

            <td>

                <button
                    class="btn-delete"
                    onclick="excluirAluno(${aluno.id})">

                    Excluir

                </button>

            </td>

        `;


        tabela.appendChild(linha);

    });

}


// ========================================
// EXCLUIR ALUNO
// ========================================

function excluirAluno(id) {

    alunos =
        alunos.filter(
            aluno =>
                aluno.id !== id
        );

    salvarDados();

    listarAlunos();

    carregarAlunos();

}


// ========================================
// CADASTRAR LIVRO
// ========================================

document
    .getElementById("formLivro")
    .addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            const livro = {

                id:
                    gerarId(livros),

                titulo:
                    document
                        .getElementById(
                            "tituloLivro"
                        )
                        .value
                        .trim(),

                autor:
                    document
                        .getElementById(
                            "autor"
                        )
                        .value
                        .trim(),

                isbn:
                    document
                        .getElementById(
                            "isbn"
                        )
                        .value
                        .trim(),

                categoria:
                    document
                        .getElementById(
                            "categoria"
                        )
                        .value,

                tipo:
                    document
                        .getElementById(
                            "tipoLivro"
                        )
                        .value,

                ano:
                    document
                        .getElementById(
                            "ano"
                        )
                        .value,

                status:
                    "Disponível"

            };


            livros.push(livro);

            salvarDados();

            this.reset();

            listarLivros();

            listarCatalogo();

            carregarLivros();

            alert(
                "Livro cadastrado com sucesso!"
            );

        }
    );


// ========================================
// LISTAR LIVROS
// ========================================

function listarLivros() {

    const tabela =
        document.getElementById(
            "tabelaLivros"
        );

    tabela.innerHTML = "";


    livros.forEach(livro => {

        const linha =
            document.createElement("tr");


        linha.innerHTML = `

            <td>
                ${livro.id}
            </td>

            <td>
                ${livro.titulo}
            </td>

            <td>
                ${livro.autor}
            </td>

            <td>
                ${livro.categoria}
            </td>

            <td>
                ${livro.tipo}
            </td>

            <td>
                ${livro.ano}
            </td>

            <td>

                <span class="status
                    ${
                        livro.status ===
                        "Disponível"
                            ? "disponivel"
                            : "indisponivel"
                    }">

                    ${
                        livro.status ===
                        "Disponível"
                            ? "🟢 Disponível"
                            : "🔴 Emprestado"
                    }

                </span>

            </td>

            <td>

                <button
                    class="btn-delete"
                    onclick="excluirLivro(${livro.id})">

                    Excluir

                </button>

            </td>

        `;


        tabela.appendChild(linha);

    });

}


// ========================================
// EXCLUIR LIVRO
// ========================================

function excluirLivro(id) {

    const livro =
        livros.find(
            item =>
                item.id === id
        );


    if (
        livro &&
        livro.status ===
        "Emprestado"
    ) {

        alert(
            "Este livro está emprestado."
        );

        return;
    }


    livros =
        livros.filter(
            item =>
                item.id !== id
        );


    salvarDados();

    listarLivros();

    listarCatalogo();

    carregarLivros();

}


// ========================================
// CARREGAR ALUNOS
// ========================================

function carregarAlunos() {

    const select =
        document.getElementById(
            "alunoEmprestimo"
        );


    select.innerHTML = `

        <option value="">
            Selecione o aluno
        </option>

    `;


    alunos.forEach(aluno => {

        select.innerHTML += `

            <option value="${aluno.id}">

                ${aluno.nome}
                -
                ${aluno.matricula}

            </option>

        `;

    });

}


// ========================================
// CARREGAR LIVROS DISPONÍVEIS
// ========================================

function carregarLivros() {

    const select =
        document.getElementById(
            "livroEmprestimo"
        );


    select.innerHTML = `

        <option value="">
            Selecione o livro
        </option>

    `;


    livros
        .filter(
            livro =>
                livro.status ===
                "Disponível"
        )
        .forEach(livro => {

            select.innerHTML += `

                <option value="${livro.id}">

                    ${livro.titulo}

                </option>

            `;

        });

}


// ========================================
// EMPRÉSTIMO
// ========================================

document
    .getElementById("formEmprestimo")
    .addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            const alunoId =
                Number(
                    document
                        .getElementById(
                            "alunoEmprestimo"
                        )
                        .value
                );


            const livroId =
                Number(
                    document
                        .getElementById(
                            "livroEmprestimo"
                        )
                        .value
                );


            const dataEmprestimo =
                document
                    .getElementById(
                        "dataEmprestimo"
                    )
                    .value;


            const previsaoEntrega =
                document
                    .getElementById(
                        "previsaoEntrega"
                    )
                    .value;


            const dataDevolucao =
                document
                    .getElementById(
                        "dataDevolucao"
                    )
                    .value;


            if (
                !alunoId ||
                !livroId
            ) {

                alert(
                    "Selecione o aluno e o livro."
                );

                return;
            }


            const livro =
                livros.find(
                    item =>
                        item.id ===
                        livroId
                );


            if (!livro) {

                alert(
                    "Livro não encontrado."
                );

                return;
            }


            if (
                livro.status !==
                "Disponível"
            ) {

                alert(
                    "Este livro não está disponível."
                );

                return;
            }


            let multa = 0;

            let statusDevolucao =
                "Emprestado";


            if (dataDevolucao) {

                multa =
                    calcularMulta(
                        previsaoEntrega,
                        dataDevolucao
                    );

                statusDevolucao =
                    "Devolvido";

            }


            const emprestimo = {

                id:
                    gerarId(
                        emprestimos
                    ),

                alunoId:
                    alunoId,

                livroId:
                    livroId,

                dataEmprestimo:
                    dataEmprestimo,

                previsaoEntrega:
                    previsaoEntrega,

                dataDevolucao:
                    dataDevolucao,

                multa:
                    multa,

                status:
                    statusDevolucao

            };


            emprestimos.push(
                emprestimo
            );


            livro.status =
                dataDevolucao
                    ? "Disponível"
                    : "Emprestado";


            salvarDados();

            this.reset();

            listarEmprestimos();

            listarLivros();

            listarCatalogo();

            carregarLivros();


            alert(
                "Empréstimo registrado com sucesso!"
            );

        }
    );


// ========================================
// LISTAR EMPRÉSTIMOS
// ========================================

function listarEmprestimos() {

    const tabela =
        document.getElementById(
            "tabelaEmprestimos"
        );


    tabela.innerHTML = "";


    emprestimos.forEach(
        emprestimo => {

            const aluno =
                alunos.find(
                    item =>
                        item.id ===
                        emprestimo.alunoId
                );


            const livro =
                livros.find(
                    item =>
                        item.id ===
                        emprestimo.livroId
                );


            if (
                !aluno ||
                !livro
            ) {
                return;
            }


            const linha =
                document.createElement(
                    "tr"
                );


            // =================================
            // CALCULAR SITUAÇÃO ATUAL
            // =================================

            let statusAtual =
                "Emprestado";

            let multaAtual =
                0;


            if (
                emprestimo.status ===
                "Devolvido"
            ) {

                statusAtual =
                    "Devolvido";

                multaAtual =
                    Number(
                        emprestimo.multa
                    ) || 0;

            } else {

                const hoje =
                    new Date()
                        .toISOString()
                        .split("T")[0];


                const diasAtraso =
                    calcularDiasAtraso(
                        emprestimo.previsaoEntrega,
                        hoje
                    );


                multaAtual =
                    calcularMulta(
                        emprestimo.previsaoEntrega,
                        hoje
                    );


                if (
                    diasAtraso === 0
                ) {

                    statusAtual =
                        "🟢 No prazo";

                } else if (
                    diasAtraso <=
                    DIAS_TOLERANCIA
                ) {

                    statusAtual =
                        "🟡 Tolerância";

                } else {

                    statusAtual =
                        "🔴 Com multa";

                }

            }


            // =================================
            // TEXTO AO LADO DO NOME
            // =================================

            let situacaoAluno = "";


            if (
                emprestimo.status ===
                "Devolvido"
            ) {

                const status =
                    obterStatusDevolucao(
                        emprestimo,
                        emprestimo.dataDevolucao
                    );


                situacaoAluno = `

                    <div class="${status.classe}">
                        ${status.texto}
                    </div>

                `;

            } else {

                const hoje =
                    new Date()
                        .toISOString()
                        .split("T")[0];


                const status =
                    obterStatusDevolucao(
                        emprestimo,
                        hoje
                    );


                situacaoAluno = `

                    <div class="${status.classe}">
                        ${status.texto}
                    </div>

                `;

            }


            linha.innerHTML = `

                <td>

                    <strong>
                        ${aluno.nome}
                    </strong>

                    ${situacaoAluno}

                </td>


                <td>
                    ${livro.titulo}
                </td>


                <td>
                    ${formatarData(
                        emprestimo.dataEmprestimo
                    )}
                </td>


                <td>
                    ${formatarData(
                        emprestimo.previsaoEntrega
                    )}
                </td>


                <td>

                    ${
                        emprestimo.dataDevolucao
                            ? formatarData(
                                emprestimo.dataDevolucao
                            )
                            : "-"
                    }

                </td>


                <td>

                    ${
                        multaAtual > 0
                            ? `
                                <strong
                                    style="color:#d32f2f">

                                    R$
                                    ${multaAtual
                                        .toFixed(2)
                                        .replace(".", ",")}

                                </strong>
                            `
                            : `
                                <span
                                    style="color:#2e7d32">

                                    R$ 0,00

                                </span>
                            `
                    }

                </td>


                <td>

                    <span class="status">

                        ${statusAtual}

                    </span>

                </td>


                <td>

                    ${
                        emprestimo.status ===
                        "Emprestado"

                        ? `

                            <button
                                class="btn-success"
                                onclick="devolverLivro(
                                    ${emprestimo.id}
                                )">

                                Devolver

                            </button>

                        `

                        : "-"

                    }

                </td>

            `;


            tabela.appendChild(
                linha
            );

        }
    );

}


// ========================================
// DEVOLVER LIVRO
// ========================================

function devolverLivro(id) {

    const emprestimo =
        emprestimos.find(
            item =>
                item.id === id
        );


    if (!emprestimo) {
        return;
    }


    const livro =
        livros.find(
            item =>
                item.id ===
                emprestimo.livroId
        );


    const hoje =
        new Date()
            .toISOString()
            .split("T")[0];


    // =================================
    // CALCULAR MULTA
    // =================================

    const multa =
        calcularMulta(
            emprestimo.previsaoEntrega,
            hoje
        );


    emprestimo.dataDevolucao =
        hoje;


    emprestimo.multa =
        multa;


    emprestimo.status =
        "Devolvido";


    if (livro) {

        livro.status =
            "Disponível";

    }


    salvarDados();

    listarEmprestimos();

    listarLivros();

    listarCatalogo();

    carregarLivros();


    // =================================
    // MENSAGEM PARA O USUÁRIO
    // =================================

    if (multa > 0) {

        alert(

            "Livro devolvido com sucesso!\n\n" +

            "⚠️ O aluno precisará pagar uma multa de " +

            "R$ " +
            multa
                .toFixed(2)
                .replace(".", ",") +

            "."

        );

    } else {

        alert(

            "Livro devolvido com sucesso!\n\n" +

            "🟢 O livro foi devolvido sem multa."

        );

    }

}


// ========================================
// CATÁLOGO
// ========================================

let filtroAtual = "todos";


function listarCatalogo() {

    const tabela =
        document.getElementById(
            "tabelaCatalogo"
        );


    tabela.innerHTML = "";


    const pesquisa =
        document
            .getElementById(
                "pesquisaLivro"
            )
            .value
            .toLowerCase();


    livros.forEach(livro => {

        if (
            filtroAtual !==
            "todos" &&

            livro.status !==
            filtroAtual &&

            livro.tipo !==
            filtroAtual
        ) {

            return;

        }


        const texto = `

            ${livro.titulo}
            ${livro.autor}
            ${livro.categoria}
            ${livro.tipo}

        `.toLowerCase();


        if (
            pesquisa &&
            !texto.includes(
                pesquisa
            )
        ) {

            return;

        }


        const linha =
            document.createElement(
                "tr"
            );


        linha.innerHTML = `

            <td>

                <strong>
                    ${livro.titulo}
                </strong>

                <br>

                <small>

                    ISBN:
                    ${livro.isbn ||
                    "Não informado"}

                </small>

            </td>


            <td>
                ${livro.autor}
            </td>


            <td>
                ${livro.categoria}
            </td>


            <td>
                ${livro.tipo}
            </td>


            <td>
                ${livro.ano || "-"}
            </td>


            <td>

                <span class="status
                    ${
                        livro.status ===
                        "Disponível"
                            ? "disponivel"
                            : "indisponivel"
                    }">

                    ${
                        livro.status ===
                        "Disponível"

                            ? "🟢 Disponível"

                            : "🔴 Emprestado"
                    }

                </span>

            </td>

        `;


        tabela.appendChild(
            linha
        );

    });


    if (
        tabela.children.length ===
        0
    ) {

        tabela.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="sem-livros">

                    📚 Nenhum livro encontrado.

                </td>

            </tr>

        `;

    }

}


// ========================================
// FILTRO
// ========================================

function filtrarLivros(
    filtro,
    botao
) {

    filtroAtual =
        filtro;


    document
        .querySelectorAll(
            ".filtro"
        )
        .forEach(
            button => {

                button.classList.remove(
                    "ativo"
                );

            }
        );


    botao.classList.add(
        "ativo"
    );


    listarCatalogo();

}


// ========================================
// PESQUISA
// ========================================

function pesquisarLivros() {

    listarCatalogo();

}


// ========================================
// FORMATAR DATA
// ========================================

function formatarData(data) {

    if (!data) {
        return "-";
    }


    const partes =
        data.split("-");


    return `${partes[2]}/${partes[1]}/${partes[0]}`;

}


// ========================================
// INICIALIZAÇÃO
// ========================================

listarAlunos();

listarLivros();

carregarAlunos();

carregarLivros();

listarCatalogo();

listarEmprestimos();


// ========================================
// ATUALIZAR MULTAS AUTOMATICAMENTE
// ========================================

// Atualiza a tabela periodicamente,
// caso um empréstimo fique atrasado.

setInterval(
    listarEmprestimos,
    60000
);