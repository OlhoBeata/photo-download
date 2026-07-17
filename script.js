"use strict";

/* ==========================================================
   OLHO DA BEATA — PÁGINA DE DOWNLOAD
   Versão 2.0
   ========================================================== */


/* ==========================================================
   1. CONFIGURAÇÃO
   ========================================================== */

const CONFIG = {
    cloudinary: {
        cloudName: "lim5fdgq"
    },

    emailJS: {
        ativo: true,

        // Dados que já estávamos a utilizar
        serviceId: "service_87s5784",
        templateId: "template_34q2y45",

        // Coloca aqui a Public Key da conta EmailJS
        publicKey: "COLOCA_AQUI_A_PUBLIC_KEY"
    },

    cloudflareWorker: {
        ativo: false,

        // Coloca aqui o endereço completo do teu Worker
        url: "COLOCA_AQUI_O_ENDERECO_DO_WORKER"
    },

    site: {
        nome: "Olho da Beata",
        dominioDownload: "https://download.olhodabeata.com"
    }
};


/* ==========================================================
   2. ELEMENTOS DA PÁGINA
   ========================================================== */

const container = document.querySelector(".container");
const photo = document.getElementById("photo");
const checkbox = document.getElementById("agree");
const downloadButton = document.getElementById("download");


/* ==========================================================
   3. OBTER IDENTIFICADOR DA FOTOGRAFIA
   ========================================================== */

const params = new URLSearchParams(window.location.search);
const photoId = params.get("photo");


/* ==========================================================
   4. FUNÇÕES AUXILIARES
   ========================================================== */

/**
 * Codifica corretamente um Public ID do Cloudinary.
 * Mantém as barras quando existem pastas.
 */
function encodeCloudinaryPublicId(publicId) {
    return publicId
        .split("/")
        .map(segment => encodeURIComponent(segment))
        .join("/");
}


/**
 * Cria o endereço de visualização da fotografia.
 */
function criarUrlVisualizacao(publicId) {
    const encodedId = encodeCloudinaryPublicId(publicId);

    return `https://res.cloudinary.com/${CONFIG.cloudinary.cloudName}/image/upload/f_auto,q_auto/${encodedId}`;
}


/**
 * Cria o endereço utilizado para descarregar a fotografia.
 */
function criarUrlDownload(publicId) {
    const encodedId = encodeCloudinaryPublicId(publicId);

    return `https://res.cloudinary.com/${CONFIG.cloudinary.cloudName}/image/upload/fl_attachment/${encodedId}`;
}


/**
 * Mostra uma mensagem de erro na página.
 */
function mostrarErro(titulo, mensagem) {
    if (!container) {
        alert(`${titulo}\n\n${mensagem}`);
        return;
    }

    container.innerHTML = `
        <div class="error-message">
            <h2>${escapeHtml(titulo)}</h2>
            <p>${escapeHtml(mensagem)}</p>
        </div>
    `;
}


/**
 * Mostra uma mensagem temporária junto ao botão.
 */
function mostrarMensagem(mensagem, tipo = "sucesso") {
    const mensagemAnterior = document.getElementById("status-message");

    if (mensagemAnterior) {
        mensagemAnterior.remove();
    }

    const elemento = document.createElement("p");

    elemento.id = "status-message";
    elemento.className = `status-message status-${tipo}`;
    elemento.textContent = mensagem;

    downloadButton.insertAdjacentElement("afterend", elemento);

    setTimeout(() => {
        elemento.remove();
    }, 6000);
}


/**
 * Altera o estado visual e funcional do botão.
 */
function definirEstadoBotao(emProcessamento, texto = "") {
    if (!downloadButton) {
        return;
    }

    if (emProcessamento) {
        downloadButton.disabled = true;
        downloadButton.dataset.originalText =
            downloadButton.textContent || "Descarregar fotografia";

        downloadButton.textContent = texto || "A preparar o download...";
        downloadButton.classList.add("loading");
    } else {
        downloadButton.disabled = !checkbox?.checked;

        downloadButton.textContent =
            downloadButton.dataset.originalText ||
            "Descarregar fotografia";

        downloadButton.classList.remove("loading");
    }
}


/**
 * Verifica se o email introduzido tem um formato válido.
 */
function validarEmail(email) {
    const formatoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

    return formatoEmail.test(email);
}


/**
 * Remove espaços e normaliza o email.
 */
function normalizarEmail(email) {
    return email.trim().toLowerCase();
}


/**
 * Proteção básica para texto introduzido no HTML.
 */
function escapeHtml(texto) {
    const elemento = document.createElement("div");
    elemento.textContent = texto;
    return elemento.innerHTML;
}


/**
 * Pede o email ao utilizador.
 */
function pedirEmail() {
    const emailIntroduzido = window.prompt(
        "Introduza o seu endereço de email para continuar com o download:"
    );

    if (emailIntroduzido === null) {
        return null;
    }

    const email = normalizarEmail(emailIntroduzido);

    if (!email) {
        alert("É necessário introduzir um endereço de email.");
        return null;
    }

    if (!validarEmail(email)) {
        alert(
            "O endereço de email introduzido não é válido. Verifique e tente novamente."
        );

        return null;
    }

    return email;
}


/**
 * Obtém o nome de ficheiro para o download.
 */
function criarNomeFicheiro(publicId) {
    const partes = publicId.split("/");
    const ultimoElemento = partes[partes.length - 1];

    const nomeLimpo = ultimoElemento
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9_-]/g, "-");

    return `Olho-da-Beata-${nomeLimpo || "fotografia"}.jpg`;
}


/* ==========================================================
   5. EMAILJS
   ========================================================== */

/**
 * Inicializa o EmailJS quando estiver configurado.
 */
function inicializarEmailJS() {
    if (!CONFIG.emailJS.ativo) {
        return false;
    }

    if (
        !CONFIG.emailJS.publicKey ||
        CONFIG.emailJS.publicKey === "COLOCA_AQUI_A_PUBLIC_KEY"
    ) {
        console.warn(
            "EmailJS não iniciado: falta configurar a Public Key."
        );

        return false;
    }

    if (typeof window.emailjs === "undefined") {
        console.warn(
            "EmailJS não está disponível. Confirma se a biblioteca foi adicionada ao index.html."
        );

        return false;
    }

    try {
        window.emailjs.init({
            publicKey: CONFIG.emailJS.publicKey
        });

        return true;
    } catch (erro) {
        console.error("Erro ao iniciar o EmailJS:", erro);
        return false;
    }
}


/**
 * Envia ao cliente o email com o link da fotografia.
 */
async function enviarEmailCliente(email, linkDownload) {
    if (!CONFIG.emailJS.ativo) {
        return {
            enviado: false,
            motivo: "EmailJS desativado"
        };
    }

    if (typeof window.emailjs === "undefined") {
        return {
            enviado: false,
            motivo: "Biblioteca EmailJS indisponível"
        };
    }

    if (
        !CONFIG.emailJS.publicKey ||
        CONFIG.emailJS.publicKey === "COLOCA_AQUI_A_PUBLIC_KEY"
    ) {
        return {
            enviado: false,
            motivo: "Public Key do EmailJS não configurada"
        };
    }

    const templateParams = {
        to_email: email,
        customer_email: email,
        download_link: linkDownload,
        photo_id: photoId,
        site_name: CONFIG.site.nome,
        download_date: new Date().toLocaleString("pt-PT", {
            dateStyle: "long",
            timeStyle: "short"
        })
    };

    try {
        await window.emailjs.send(
            CONFIG.emailJS.serviceId,
            CONFIG.emailJS.templateId,
            templateParams
        );

        return {
            enviado: true
        };
    } catch (erro) {
        console.error("Erro ao enviar o email através do EmailJS:", erro);

        return {
            enviado: false,
            motivo: erro?.text || erro?.message || "Erro desconhecido"
        };
    }
}


/* ==========================================================
   6. CLOUDFLARE WORKER + RESEND
   ========================================================== */

/**
 * Envia para o Worker a informação do download.
 *
 * O Worker poderá:
 * - registar o email;
 * - guardar a fotografia descarregada;
 * - enviar uma notificação interna pelo Resend;
 * - guardar data, hora e outros dados.
 */
async function notificarDownload(email) {
    if (!CONFIG.cloudflareWorker.ativo) {
        return {
            enviado: false,
            motivo: "Worker desativado"
        };
    }

    if (
        !CONFIG.cloudflareWorker.url ||
        CONFIG.cloudflareWorker.url ===
            "COLOCA_AQUI_O_ENDERECO_DO_WORKER"
    ) {
        return {
            enviado: false,
            motivo: "Endereço do Worker não configurado"
        };
    }

    const dados = {
        photoId: photoId,
        customerEmail: email,
        downloadPage: window.location.href,
        imageUrl: criarUrlVisualizacao(photoId),
        date: new Date().toISOString(),
        language: navigator.language || "",
        userAgent: navigator.userAgent || "",
        referrer: document.referrer || ""
    };

    try {
        const resposta = await fetch(CONFIG.cloudflareWorker.url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dados)
        });

        if (!resposta.ok) {
            throw new Error(
                `O Worker respondeu com o estado ${resposta.status}.`
            );
        }

        let resultado = null;

        try {
            resultado = await resposta.json();
        } catch {
            resultado = null;
        }

        return {
            enviado: true,
            resultado
        };
    } catch (erro) {
        console.error(
            "Não foi possível enviar a notificação para o Worker:",
            erro
        );

        return {
            enviado: false,
            motivo: erro.message
        };
    }
}


/* ==========================================================
   7. DOWNLOAD DA FOTOGRAFIA
   ========================================================== */

/**
 * Descarrega a fotografia através de um Blob.
 */
async function descarregarFotografia() {
    const urlDownload = criarUrlDownload(photoId);

    const resposta = await fetch(urlDownload, {
        method: "GET",
        mode: "cors",
        cache: "no-store"
    });

    if (!resposta.ok) {
        throw new Error(
            `Não foi possível obter a fotografia. Código ${resposta.status}.`
        );
    }

    const ficheiro = await resposta.blob();

    if (!ficheiro.size) {
        throw new Error("O ficheiro recebido está vazio.");
    }

    const urlTemporaria = URL.createObjectURL(ficheiro);
    const link = document.createElement("a");

    link.href = urlTemporaria;
    link.download = criarNomeFicheiro(photoId);
    link.style.display = "none";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => {
        URL.revokeObjectURL(urlTemporaria);
    }, 5000);
}


/**
 * Método alternativo, caso o navegador bloqueie o Blob.
 */
function abrirDownloadDireto() {
    const urlDownload = criarUrlDownload(photoId);
    const link = document.createElement("a");

    link.href = urlDownload;
    link.download = criarNomeFicheiro(photoId);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.style.display = "none";

    document.body.appendChild(link);
    link.click();
    link.remove();
}


/* ==========================================================
   8. PROCESSAR PEDIDO DE DOWNLOAD
   ========================================================== */

async function processarDownload() {
    if (!checkbox?.checked) {
        alert(
            "Para continuar, deverá aceitar a Política de Privacidade e os Termos e Condições."
        );

        return;
    }

    const email = pedirEmail();

    if (!email) {
        return;
    }

    definirEstadoBotao(true, "A preparar a fotografia...");

    const linkPagina =
        `${CONFIG.site.dominioDownload}/?photo=` +
        encodeURIComponent(photoId);

    let downloadConcluido = false;

    try {
        /*
         * Primeiro fazemos o download.
         * Assim, mesmo que o EmailJS ou o Worker estejam temporariamente
         * indisponíveis, o cliente não perde a fotografia.
         */
        try {
            await descarregarFotografia();
            downloadConcluido = true;
        } catch (erroDownload) {
            console.warn(
                "O download por Blob falhou. A utilizar o download direto.",
                erroDownload
            );

            abrirDownloadDireto();
            downloadConcluido = true;
        }

        /*
         * O email e a notificação são processados em paralelo.
         */
        const [resultadoEmail, resultadoWorker] =
            await Promise.allSettled([
                enviarEmailCliente(email, linkPagina),
                notificarDownload(email)
            ]);

        if (resultadoEmail.status === "fulfilled") {
            if (!resultadoEmail.value.enviado) {
                console.warn(
                    "O email não foi enviado:",
                    resultadoEmail.value.motivo
                );
            }
        } else {
            console.error(
                "Erro inesperado no envio do email:",
                resultadoEmail.reason
            );
        }

        if (resultadoWorker.status === "fulfilled") {
            if (!resultadoWorker.value.enviado) {
                console.warn(
                    "A notificação não foi enviada:",
                    resultadoWorker.value.motivo
                );
            }
        } else {
            console.error(
                "Erro inesperado no Worker:",
                resultadoWorker.reason
            );
        }

        if (downloadConcluido) {
            mostrarMensagem(
                "A fotografia foi preparada para download. Verifique também a pasta de transferências do seu dispositivo.",
                "sucesso"
            );
        }
    } catch (erro) {
        console.error("Erro durante o processo de download:", erro);

        mostrarMensagem(
            "Não foi possível concluir o download. Atualize a página e tente novamente.",
            "erro"
        );
    } finally {
        definirEstadoBotao(false);
    }
}


/* ==========================================================
   9. CARREGAMENTO DA PÁGINA
   ========================================================== */

function iniciarPagina() {
    if (!container || !photo || !checkbox || !downloadButton) {
        console.error(
            "Faltam elementos obrigatórios no HTML. São necessários: .container, #photo, #agree e #download."
        );

        return;
    }

    if (!photoId || !photoId.trim()) {
        mostrarErro(
            "Fotografia não encontrada",
            "Não foi indicada nenhuma fotografia neste endereço. Confirme se recebeu o link completo."
        );

        return;
    }

    const urlImagem = criarUrlVisualizacao(photoId);

    /*
     * O botão começa desativado até os termos serem aceites.
     */
    downloadButton.disabled = true;

    /*
     * Mensagem apresentada enquanto a fotografia carrega.
     */
    photo.alt = "Fotografia Olho da Beata";
    photo.setAttribute("aria-busy", "true");

    /*
     * Só mostramos a fotografia depois de estar carregada.
     */
    photo.addEventListener(
        "load",
        () => {
            photo.setAttribute("aria-busy", "false");
            photo.classList.add("loaded");
        },
        {
            once: true
        }
    );

    /*
     * Erro se o Public ID não existir no Cloudinary.
     */
    photo.addEventListener(
        "error",
        () => {
            mostrarErro(
                "Fotografia indisponível",
                "Não foi possível encontrar ou carregar esta fotografia. O link poderá estar incompleto ou ter expirado."
            );
        },
        {
            once: true
        }
    );

    photo.src = urlImagem;

    /*
     * Ativar/desativar botão ao aceitar os termos.
     */
    checkbox.addEventListener("change", () => {
        downloadButton.disabled = !checkbox.checked;
    });

    /*
     * Processar download.
     */
    downloadButton.addEventListener("click", processarDownload);

    /*
     * Permitir utilizar Enter quando o botão está selecionado.
     */
    downloadButton.addEventListener("keydown", evento => {
        if (evento.key === "Enter" || evento.key === " ") {
            evento.preventDefault();
            processarDownload();
        }
    });

    /*
     * Inicializar o EmailJS.
     */
    inicializarEmailJS();
}


/* ==========================================================
   10. INICIAR
   ========================================================== */

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarPagina);
} else {
    iniciarPagina();
}
