"use strict";

/* =========================================================
   CONFIGURAÇÃO
   ========================================================= */

const CONFIG = {
    cloudName: "lim5fdgq",

    eventCode: "STARTUP-VOUCHER-INNOVATE",
    eventName: "StartUP Voucher Innovate",

    instagramUrl:
        "https://www.instagram.com/by.iapmei/",

    workerUrl:
        "https://weathered-bonus-4ffaolhodabeata-api-v3.luis-santos-286.workers.dev/downloads"
};


/* =========================================================
   ELEMENTOS
   ========================================================= */

const params =
    new URLSearchParams(window.location.search);

const photoId =
    params.get("photo");

const container =
    document.querySelector(".container");

const photo =
    document.getElementById("photo");

const loading =
    document.getElementById("loading");

const previewWrapper =
    document.getElementById("previewWrapper");

const emailInput =
    document.getElementById("customerEmail");

const emailError =
    document.getElementById("emailError");

const imageConsent =
    document.getElementById("imageConsent");

const emailConsent =
    document.getElementById("emailConsent");

const agree =
    document.getElementById("agree");

const downloadButton =
    document.getElementById("download");

const statusMessage =
    document.getElementById("statusMessage");

let downloadEmCurso = false;


const openPhotoButton =
    document.getElementById("openPhotoButton");


/* =========================================================
   VALIDAR ELEMENTOS ESSENCIAIS
   ========================================================= */

if (
    !container ||
    !photo ||
    !emailInput ||
    !emailError ||
    !agree ||
    !downloadButton ||
    !statusMessage
) {
    throw new Error(
        "A página de download não contém todos os elementos necessários."
    );
}


/* =========================================================
   VALIDAR FOTOGRAFIA
   ========================================================= */

if (!photoId) {
    container.innerHTML = `
        <header class="header">
            <h1>Fotografia não encontrada</h1>

            <p class="intro">
                O endereço utilizado não contém uma fotografia válida.
            </p>
        </header>
    `;

    throw new Error(
        "Falta o parâmetro photo no endereço."
    );
}


/* =========================================================
   ENDEREÇOS CLOUDINARY
   ========================================================= */

const encodedPhotoId = photoId
    .split("/")
    .map(part => encodeURIComponent(part))
    .join("/");

/*
 * Pré-visualização pequena e com qualidade reduzida.
 * A marca de água é aplicada visualmente pelo HTML/CSS.
 */
const imageUrl =
    `https://res.cloudinary.com/${CONFIG.cloudName}` +
    `/image/upload/c_limit,w_220,q_45,f_auto/${encodedPhotoId}`;

/*
 * A fotografia original é utilizada apenas no download.
 */
const downloadUrl =
    `https://res.cloudinary.com/${CONFIG.cloudName}` +
    `/image/upload/fl_attachment/${encodedPhotoId}`;


/* =========================================================
   CARREGAR PRÉ-VISUALIZAÇÃO
   ========================================================= */

photo.addEventListener("load", () => {
    if (loading) {
        loading.style.display = "none";
    }

    photo.classList.add("visible");

    if (previewWrapper) {
        previewWrapper.classList.add("visible");
    }
});

photo.addEventListener("error", () => {
    if (loading) {
        loading.innerHTML = `
            <p>
                Não foi possível carregar a pré-visualização.
            </p>
        `;
    }

    console.error(
        "Não foi possível carregar a pré-visualização:",
        imageUrl
    );

    downloadButton.disabled = true;
});

photo.src = imageUrl;


/* =========================================================
   VALIDAR EMAIL
   ========================================================= */

function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function obterEmail() {
    return emailInput
        .value
        .trim()
        .toLowerCase();
}


/* =========================================================
   ATUALIZAR ESTADO DO BOTÃO
   ========================================================= */

function atualizarBotaoDownload() {
    const emailValido =
        validarEmail(obterEmail());

    downloadButton.disabled =
        downloadEmCurso ||
        !agree.checked ||
        !emailValido;
}

emailInput.addEventListener("input", () => {
    emailError.textContent = "";
    atualizarBotaoDownload();
});

agree.addEventListener("change", () => {
    atualizarBotaoDownload();
});

atualizarBotaoDownload();


/* =========================================================
   REGISTAR DOWNLOAD
   ========================================================= */

async function registarDownload(email) {
    if (!CONFIG.workerUrl) {
        return null;
    }

    const payload = {
        eventCode: CONFIG.eventCode,
        eventName: CONFIG.eventName,
        email: email,
        photoId: photoId,

        imageConsent:
            Boolean(imageConsent?.checked),

        emailConsent:
            Boolean(emailConsent?.checked),

        downloadedAt:
            new Date().toISOString(),

        pageUrl:
            window.location.href,

        userAgent:
            navigator.userAgent
    };

    try {
        const response =
            await fetch(
                CONFIG.workerUrl,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(payload)
                }
            );

        if (!response.ok) {
            const responseText =
                await response.text();

            throw new Error(
                `Worker ${response.status}: ${responseText}`
            );
        }

        return await response.json();
    } catch (error) {
        /*
         * Um erro de registo nunca deve impedir
         * o cliente de receber a fotografia.
         */
        console.error(
            "Não foi possível registar o download:",
            error
        );

        return null;
    }
}


/* =========================================================
   DOWNLOAD ATRAVÉS DE BLOB
   ========================================================= */

async function descarregarComBlob() {
    const response =
        await fetch(downloadUrl);

    if (!response.ok) {
        throw new Error(
            `Erro ao obter a fotografia: ${response.status}`
        );
    }

    const blob =
        await response.blob();

    if (!blob.size) {
        throw new Error(
            "O ficheiro descarregado está vazio."
        );
    }

    const temporaryUrl =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    const filenameId =
        photoId
            .split("/")
            .pop()
            .replace(
                /[^a-zA-Z0-9_-]/g,
                ""
            );

    link.href =
        temporaryUrl;

    link.download =
        `fotografia-${filenameId}.jpg`;

    document.body.appendChild(link);

    link.click();
    link.remove();

    setTimeout(() => {
        URL.revokeObjectURL(temporaryUrl);
    }, 5000);
}


/* =========================================================
   DOWNLOAD ALTERNATIVO
   ========================================================= */

function descarregarDiretamente() {
    const link =
        document.createElement("a");

    link.href =
        downloadUrl;

    link.target =
        "_blank";

    link.rel =
        "noopener noreferrer";

    document.body.appendChild(link);

    link.click();
    link.remove();
}


/* =========================================================
   PROCESSAR DOWNLOAD
   ========================================================= */

downloadButton.addEventListener(
    "click",
    async () => {
        if (downloadEmCurso) {
            return;
        }

        const email =
            obterEmail();

        emailError.textContent = "";
               statusMessage.textContent =
            "Download iniciado com sucesso.";

        await registarDownload(email);

        setTimeout(() => {
            statusMessage.textContent =
            "Download iniciado com sucesso.";

        /*
         * Registar o download na base D1.
         * Se o registo falhar, não interfere
         * com a fotografia já descarregada.
         */
        await registarDownload(email);

        setTimeout(() => {
            statusMessage.textContent =
                "Download concluído. Obrigado pela sua participação.";

            downloadButton.textContent =
                "Fotografia descarregada";
        }, 1200);
    }
);
