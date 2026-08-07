"use strict";

/* =========================================================
   CONFIGURAÇÃO
   ========================================================= */

const CONFIG = {
    cloudName: "lim5fdgq",

    eventCode: "STARTUP-VOUCHER-INNOVATE",
    eventName: "StartUP Voucher Innovate",

    workerUrl:
        "https://weathered-bonus-4ffaolhodabeata-api-v3.luis-santos-286.workers.dev/downloads"
};


/* =========================================================
   ELEMENTOS
   ========================================================= */

const params = new URLSearchParams(window.location.search);
const photoId = params.get("photo");

const container = document.querySelector(".container");
const photo = document.getElementById("photo");
const loading = document.getElementById("loading");
const previewWrapper = document.getElementById("previewWrapper");

const emailInput = document.getElementById("customerEmail");
const emailError = document.getElementById("emailError");

const imageConsent = document.getElementById("imageConsent");
const emailConsent = document.getElementById("emailConsent");
const agree = document.getElementById("agree");

const downloadButton = document.getElementById("download");
const statusMessage = document.getElementById("statusMessage");

let downloadEmCurso = false;


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

    throw new Error("Falta o parâmetro photo no endereço.");
}


/* =========================================================
   CLOUDINARY
   ========================================================= */

const encodedPhotoId = photoId
    .split("/")
    .map(part => encodeURIComponent(part))
    .join("/");


/*
 * Imagem pequena para pré-visualização.
 */
const imageUrl =
    `https://res.cloudinary.com/${CONFIG.cloudName}` +
    `/image/upload/c_limit,w_220,q_45,f_auto/${encodedPhotoId}`;


/*
 * Fotografia original para download.
 */
const downloadUrl =
    `https://res.cloudinary.com/${CONFIG.cloudName}` +
    `/image/upload/fl_attachment/${encodedPhotoId}`;


/* =========================================================
   PRÉ-VISUALIZAÇÃO
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
        loading.innerHTML =
            "<p>Não foi possível carregar a pré-visualização.</p>";
    }

    console.error(
        "Erro ao carregar pré-visualização:",
        imageUrl
    );
});


photo.src = imageUrl;


/* =========================================================
   EMAIL
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
   BOTÃO
   ========================================================= */

function atualizarBotaoDownload() {

    const emailValido =
        validarEmail(obterEmail());

    downloadButton.disabled =
        downloadEmCurso ||
        !emailValido ||
        !agree.checked;
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
   REGISTAR DOWNLOAD NA D1
   ========================================================= */

async function registarDownload(email) {

    const payload = {

        eventCode:
            CONFIG.eventCode,

        eventName:
            CONFIG.eventName,

        email:
            email,

        photoId:
            photoId,

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
                        JSON.stringify(payload),

                    keepalive: true
                }
            );


        if (!response.ok) {

            console.error(
                "Worker respondeu:",
                response.status
            );

            return null;
        }


        return await response.json();

    } catch (error) {

        console.error(
            "Erro ao registar download:",
            error
        );

        return null;
    }
}


/* =========================================================
   DOWNLOAD
   ========================================================= */

function iniciarDownload() {

    const link =
        document.createElement("a");

    link.href =
        downloadUrl;

    /*
     * Não usamos target="_blank".
     * Nos telemóveis isso pode ser bloqueado.
     */
    link.rel =
        "noopener";

    document.body.appendChild(link);

    link.click();

    link.remove();
}


/* =========================================================
   PROCESSAR DOWNLOAD
   ========================================================= */

downloadButton.addEventListener(
    "click",
    () => {

        if (downloadEmCurso) {
            return;
        }


        const email =
            obterEmail();


        emailError.textContent = "";
        statusMessage.textContent = "";


        if (!email) {

            emailError.textContent =
                "Introduza o seu endereço de email.";

            emailInput.focus();

            return;
        }


        if (!validarEmail(email)) {

            emailError.textContent =
                "Introduza um endereço de email válido.";

            emailInput.focus();

            return;
        }


        if (!agree.checked) {

            statusMessage.textContent =
                "Confirme que leu a informação apresentada.";

            return;
        }


        /*
         * Impedir duplo clique.
         */
        downloadEmCurso = true;

        atualizarBotaoDownload();


        downloadButton.textContent =
            "A iniciar download...";


        /*
         * IMPORTANTE:
         * o download é iniciado imediatamente durante
         * o clique do utilizador.
         *
         * Isto é mais fiável em iPhone e Android.
         */
        iniciarDownload();


        statusMessage.textContent =
            "Download iniciado. A fotografia será guardada nas transferências do seu dispositivo.";


        /*
         * O registo na D1 acontece separadamente.
         * Não bloqueia o download.
         */
        registarDownload(email);


        setTimeout(() => {

            downloadButton.textContent =
                "Fotografia descarregada";

            statusMessage.textContent =
                "Download concluído. Obrigado pela sua participação.";

        }, 1500);
    }
);
