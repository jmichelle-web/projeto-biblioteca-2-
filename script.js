// ========================================
// CONFIGURAÇÃO FIREBASE
// ========================================

import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    setDoc,
    doc,
    deleteDoc,
    onSnapshot
} from
"https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";


// ========================================
// COLEÇÕES
// ========================================

const alunosRef =
    collection(db, "alunos");

const livrosRef =
    collection(db, "livros");

const emprestimosRef =
    collection(db, "emprestimos");


// ========================================
// DADOS
// ========================================

let alunos = [];

let livros = [];

let emprestimos = [];


// ========================================
// MULTAS
// ========================================

const DIAS_TOLERANCIA = 15;

const MULTA_INICIAL = 2;

const MULTA_SEMANAL = 4;


// ========================================
// DATA
// ========================================

function converterData(data) {

    if (!data) return null;

    const partes = data.split("-");

    return new Date(
        Number(partes[0]),
        Number(partes[1]) - 1,
        Number(partes[2])
    );
}


// ========================================
// DIAS DE ATRASO
// ========================================

function calcularDiasAtraso(
    previsao,
    dataFinal
) {

    const prevista =
        converterData(previsao);

    const final =
        converterData(dataFinal);

    if (!prevista || !final) {
        return 0;
    }

    const diferenca =
        final - prevista;

    const dias =
        Math.floor(
            diferenca /
            (1000 * 60 * 60 * 24)
        );

    return Math.max(0, dias);
}


// ========================================
// MULTA
// ========================================

function calcularMulta(
    previsao,
    dataFinal
) {

    const atraso =
        calcularDiasAtraso(
            previsao,
            dataFinal
        );

    if (
        atraso <=
        DIAS_TOLERANCIA
    ) {

        return 0;

    }

    const depois =
        atraso -
        DIAS_TOLERANCIA;

    let multa =
        MULTA_INICIAL;

    const semanas =
        Math.floor(
            (depois - 1) / 7
        );

    multa +=
        semanas *
        MULTA_SEMANAL;

    return multa;
}


// ========================================
// ID
// ========================================

function gerarId(lista) {

    if (lista.length === 0) {
        return 1;
    }

    return Math.max(
        ...lista.map(
            item => Number(item.id)
        )
    ) + 1;
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
// DATA DE HOJE
// ========================================

function hoje() {

    return new Date()
        .toISOString()
        .split("T")[0];

}


// ========================================
// SALVAR ALUNO
// ========================================

async function salvarAluno(aluno) {

    await setDoc(
        doc(
            db,
            "alunos",
            String(aluno.id)
        ),
        aluno
    );

}


// ========================================
// SALVAR LIVRO
// ========================================

async function salvarLivro(livro) {

    await setDoc(
        doc(
            db,
            "livros",
            String(livro.id)
        ),
        livro
    );

}


// ========================================
// SALVAR EMPRÉSTIMO
// ========================================

async function salvarEmprestimo(
    emprestimo
) {

    await setDoc(
        doc(
            db,
            "emprestimos",
            String(emprestimo.id)
        ),
        emprestimo
    );

}


// ========================================
// CADASTRAR LIVRO
// ========================================

document
.getElementById("formLivro")
.addEventListener(
    "submit",
    async function(event) {

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


        try {

            await salvarLivro(livro);

            this.reset();

            alert(
                "📚 Livro cadastrado!"
            );

        } catch (erro) {

            console.error(erro);

            alert(
                "Erro ao cadastrar livro."
            );

        }

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

    if (!tabela) return;

    tabela.innerHTML = "";


    livros.forEach(livro => {

        const tr =
            document.createElement("tr");


        const status =
            livro.status ===
            "Disponível";


        tr.innerHTML = `

            <td>
                ${livro.id}
            </td>

            <td>
                <strong>
                    ${livro.titulo}
                </strong>
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

                <span class="
                    status
                    ${status
                        ? "disponivel"
                        : "indisponivel"}
                ">

                    ${
                        status
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

        tabela.appendChild(tr);

    });

}
// ========================================
// CONTROLE DE DEVOLUÇÕES
// ========================================

function atualizarControleDevolucoes() {

    const tabelaDevolvidos =
        document.getElementById(
            "tabelaDevolvidos"
        );

    const tabelaNaoDevolvidos =
        document.getElementById(
            "tabelaNaoDevolvidos"
        );


    if (!tabelaDevolvidos ||
        !tabelaNaoDevolvidos) {

        return;

    }


    tabelaDevolvidos.innerHTML = "";

    tabelaNaoDevolvidos.innerHTML = "";


    let totalMultas = 0;

    let devolvidos = 0;

    let naoDevolvidos = 0;


    // ====================================
    // PERCORRER EMPRÉSTIMOS
    // ====================================

    emprestimos.forEach(
        emprestimo => {

            const aluno =
                alunos.find(
                    a =>
                    Number(a.id) ===
                    Number(
                        emprestimo.alunoId
                    )
                );


            const livro =
                livros.find(
                    l =>
                    Number(l.id) ===
                    Number(
                        emprestimo.livroId
                    )
                );


            if (!aluno || !livro) {
                return;
            }


            // =================================
            // DEVOLVIDO
            // =================================

            if (
                emprestimo.status ===
                "Devolvido"
            ) {

                devolvidos++;


                const multa =
                    Number(
                        emprestimo.multa
                    ) || 0;


                totalMultas +=
                    multa;


                const tr =
                    document
                    .createElement("tr");


                tr.innerHTML = `

                    <td>
                        ${aluno.nome}
                    </td>

                    <td>
                        ${livro.titulo}
                    </td>

                    <td>
                        ${formatarData(
                            emprestimo
                            .dataEmprestimo
                        )}
                    </td>

                    <td>
                        ${formatarData(
                            emprestimo
                            .previsaoEntrega
                        )}
                    </td>

                    <td>
                        ${formatarData(
                            emprestimo
                            .dataDevolucao
                        )}
                    </td>

                    <td>

                        ${
                            multa > 0

                            ? `
                                🔴 R$
                                ${multa
                                .toFixed(2)
                                .replace(".", ",")}
                              `

                            : `
                                🟢 Sem multa
                              `
                        }

                    </td>

                    <td>

                        <span class="status devolvido">

                            🟢 Devolvido

                        </span>

                    </td>

                `;


                tabelaDevolvidos
                    .appendChild(tr);

            }


            // =================================
            // NÃO DEVOLVIDO
            // =================================

            else {

                naoDevolvidos++;


                const diasAtraso =
                    calcularDiasAtraso(
                        emprestimo
                        .previsaoEntrega,
                        hoje()
                    );


                const multa =
                    calcularMulta(
                        emprestimo
                        .previsaoEntrega,
                        hoje()
                    );


                totalMultas +=
                    multa;


                const tr =
                    document
                    .createElement("tr");


                tr.innerHTML = `

                    <td>

                        <strong>
                            ${aluno.nome}
                        </strong>

                    </td>


                    <td>

                        ${livro.titulo}

                    </td>


                    <td>

                        ${formatarData(
                            emprestimo
                            .dataEmprestimo
                        )}

                    </td>


                    <td>

                        ${formatarData(
                            emprestimo
                            .previsaoEntrega
                        )}

                    </td>


                    <td>

                        ${
                            diasAtraso > 0

                            ? `
                                🔴
                                ${diasAtraso}
                                dias
                              `

                            : `
                                🟢 No prazo
                              `
                        }

                    </td>


                    <td>

                        ${
                            multa > 0

                            ? `
                                <strong
                                    style="
                                    color:#d32f2f">

                                    R$
                                    ${multa
                                    .toFixed(2)
                                    .replace(
                                        ".",
                                        ","
                                    )}

                                </strong>
                              `

                            : `
                                <span
                                    style="
                                    color:#2e7d32">

                                    R$ 0,00

                                </span>
                              `
                        }

                    </td>


                    <td>

                        ${
                            multa > 0

                            ? `
                                🔴 Atrasado
                              `

                            : `
                                🟡 Emprestado
                              `
                        }

                    </td>

                `;


                tabelaNaoDevolvidos
                    .appendChild(tr);

            }

        }
    );


    // ====================================
    // RESUMO
    // ====================================

    const total =
        livros.length;


    const disponiveis =
        livros.filter(
            livro =>
            livro.status ===
            "Disponível"
        ).length;


    const emprestados =
        livros.filter(
            livro =>
            livro.status ===
            "Emprestado"
        ).length;


    const totalLivros =
        document.getElementById(
            "totalLivros"
        );


    const livrosDisponiveis =
        document.getElementById(
            "livrosDisponiveis"
        );


    const livrosEmprestados =
        document.getElementById(
            "livrosEmprestados"
        );


    const totalMultasElemento =
        document.getElementById(
            "totalMultas"
        );


    if (totalLivros) {

        totalLivros.textContent =
            total;

    }


    if (livrosDisponiveis) {

        livrosDisponiveis.textContent =
            disponiveis;

    }


    if (livrosEmprestados) {

        livrosEmprestados.textContent =
            emprestados;

    }


    if (totalMultasElemento) {

        totalMultasElemento.textContent =
            `R$ ${totalMultas
                .toFixed(2)
                .replace(".", ",")}`;

    }

}
// ========================================
// REGISTRAR EMPRÉSTIMO
// ========================================

document
.getElementById("formEmprestimo")
.addEventListener(
    "submit",
    async function(event) {

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


        const livro =
            livros.find(
                l =>
                Number(l.id) ===
                Number(livroId)
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
                "🔴 Este livro já está emprestado."
            );

            return;

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

                "",

            multa:

                0,

            status:

                "Emprestado"

        };


        try {

            await salvarEmprestimo(
                emprestimo
            );


            // livro passa para emprestado

            livro.status =
                "Emprestado";


            await salvarLivro(
                livro
            );


            this.reset();


            alert(
                "📚 Empréstimo registrado!"
            );


        } catch (erro) {

            console.error(erro);

            alert(
                "Erro ao registrar empréstimo."
            );

        }

    }
);
// ========================================
// DEVOLVER LIVRO
// ========================================

async function devolverLivro(id) {

    const emprestimo =
        emprestimos.find(
            e =>
            Number(e.id) ===
            Number(id)
        );


    if (!emprestimo) {
        return;
    }


    const livro =
        livros.find(
            l =>
            Number(l.id) ===
            Number(
                emprestimo.livroId
            )
        );


    const dataDevolucao =
        hoje();


    const multa =
        calcularMulta(
            emprestimo
            .previsaoEntrega,
            dataDevolucao
        );


    emprestimo
        .dataDevolucao =
        dataDevolucao;


    emprestimo.multa =
        multa;


    emprestimo.status =
        "Devolvido";


    if (livro) {

        livro.status =
            "Disponível";

    }


    try {

        await salvarEmprestimo(
            emprestimo
        );


        if (livro) {

            await salvarLivro(
                livro
            );

        }


        if (multa > 0) {

            alert(
                `⚠️ Livro devolvido com atraso!\n\n` +
                `Multa: R$ ${multa
                    .toFixed(2)
                    .replace(".", ",")}`
            );

        } else {

            alert(
                "🟢 Livro devolvido sem multa!"
            );

        }

    } catch (erro) {

        console.error(erro);

        alert(
            "Erro ao registrar devolução."
        );

    }

}


window.devolverLivro =
    devolverLivro;
// ========================================
// FIREBASE EM TEMPO REAL
// ========================================

function iniciarFirebase() {


    // ====================================
    // ALUNOS
    // ====================================

    onSnapshot(
        alunosRef,
        snapshot => {

            alunos =
                snapshot.docs.map(
                    doc => ({

                        id:
                            Number(
                                doc.id
                            ),

                        ...doc.data()

                    })
                );


            listarAlunos();

            carregarAlunos();

            atualizarControleDevolucoes();

        }
    );


    // ====================================
    // LIVROS
    // ====================================

    onSnapshot(
        livrosRef,
        snapshot => {

            livros =
                snapshot.docs.map(
                    doc => ({

                        id:
                            Number(
                                doc.id
                            ),

                        ...doc.data()

                    })
                );


            listarLivros();

            listarCatalogo();

            carregarLivros();

            atualizarControleDevolucoes();

        }
    );


    // ====================================
    // EMPRÉSTIMOS
    // ====================================

    onSnapshot(
        emprestimosRef,
        snapshot => {

            emprestimos =
                snapshot.docs.map(
                    doc => ({

                        id:
                            Number(
                                doc.id
                            ),

                        ...doc.data()

                    })
                );


            listarEmprestimos();

            atualizarControleDevolucoes();

        }
    );

}
// ========================================
// INICIAR SISTEMA
// ========================================

iniciarFirebase();


// Atualiza multas a cada minuto

setInterval(
    atualizarControleDevolucoes,
    60000
);

const livrosIniciais = [

    {
        id: 1,
        titulo: "Harry Potter e a Pedra Filosofal",
        autor: "J. K. Rowling",
        isbn: "9788532530783",
        categoria: "Fantasia",
        tipo: "Livro",
        ano: "1997",
        status: "Disponível"
    },

    {
        id: 2,
        titulo: "O Pequeno Príncipe",
        autor: "Antoine de Saint-Exupéry",
        isbn: "9788522031442",
        categoria: "Infantil",
        tipo: "Livro",
        ano: "1943",
        status: "Disponível"
    },

    {
        id: 3,
        titulo: "Dom Casmurro",
        autor: "Machado de Assis",
        isbn: "9788535910663",
        categoria: "Romance",
        tipo: "Livro",
        ano: "1899",
        status: "Disponível"
    },

    {
        id: 4,
        titulo: "Percy Jackson e o Ladrão de Raios",
        autor: "Rick Riordan",
        isbn: "9788598078355",
        categoria: "Aventura",
        tipo: "Livro",
        ano: "2005",
        status: "Disponível"
    },

    {
        id: 5,
        titulo: "Naruto",
        autor: "Masashi Kishimoto",
        isbn: "9788577870154",
        categoria: "História em Quadrinhos",
        tipo: "Mangá",
        ano: "1999",
        status: "Disponível"
    },

    {
        id: 6,
        titulo: "Turma da Mônica",
        autor: "Mauricio de Sousa",
        isbn: "9788539412345",
        categoria: "Infantil",
        tipo: "Gibi",
        ano: "2020",
        status: "Disponível"
    },

    {
        id: 7,
        titulo: "O Hobbit",
        autor: "J. R. R. Tolkien",
        isbn: "9788595084748",
        categoria: "Fantasia",
        tipo: "Livro",
        ano: "1937",
        status: "Disponível"
    },

    {
        id: 8,
        titulo: "Sherlock Holmes",
        autor: "Arthur Conan Doyle",
        isbn: "9788525059986",
        categoria: "Mistério",
        tipo: "Livro",
        ano: "1887",
        status: "Disponível"
    },

    {
        id: 9,
        titulo: "It: A Coisa",
        autor: "Stephen King",
        isbn: "9788560280948",
        categoria: "Terror",
        tipo: "Livro",
        ano: "1986",
        status: "Disponível"
    },

    {
        id: 10,
        titulo: "1984",
        autor: "George Orwell",
        isbn: "9788535914849",
        categoria: "Ficção",
        tipo: "Livro",
        ano: "1949",
        status: "Disponível"
    }

];
