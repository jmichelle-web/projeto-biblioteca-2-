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
