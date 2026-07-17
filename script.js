"use strict";

/* =========================================================
   CONFIGURAÇÃO
   ========================================================= */

const CONFIG = {
    cloudName: "lim5fdgq",

    /*
     * Coloca aqui o Instagram que deve abrir
     * depois do download.
     */
    instagramUrl: "https://www.instagram.com/olhodabeata/",

    /*
     * Mais tarde colocaremos aqui o Worker da base de dados.
     * Por agora fica vazio para não impedir o download.
     */
    workerUrl: ""
};


/* =========================================================
   ELEMENTOS
   ========================================================= */

const params = new URLSearchParams(window.location.search);
const photoId = params.get("photo");

const container = document.querySelector(".container");
const photo = document.getElementById("photo");
const loading = document.getElementById("loading");

const emailInput = document.getElementById("customerEmail");
const emailError = document.getElementById("emailError");

const imageConsent = document.getElementById("imageConsent");
const emailConsent = document.getElementById("emailConsent");
const agree = document.getElementById("agree");

const downloadButton = document.getElementById("download");
const statusMessage = document.getElementById("statusMessage");


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
   URLS CLOUDINARY
   ========================================================= */

const encodedPhotoId = photoId
    .split("/")
    .map(part => encodeURIComponent(part))
    .join("/");

const imageUrl =
    `https://res.cloudinary.com/${CONFIG.cloudName}/image/upload/f_auto,q_auto/${encodedPhotoId}`;

const downloadUrl =
    `https://res.cloudinary.com/${CONFIG.cloudName}/image/upload/fl_attachment/${encodedPhotoId}`;


/* =========================================================
   CARREGAR FOTOGRAFIA
   ========================================================= */

photo.addEventListener("load", () => {
    loading.style.display = "none";
    photo.classList.add("visible");
});

photo.addEventListener("error", () => {
    loading.innerHTML = `
        <p>
            Não foi possível carregar a fotografia.
            Confirme se o link está correto.
        </p>
    `;

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
    return emailInput.value.trim().toLowerCase();
}

emailInput.addEventListener("input", () => {
    emailError.textContent = "";
});


/* =========================================================
   ATIVAR BOTÃO
   ========================================================= */

agree.addEventListener("change", () => {
    downloadButton.disabled = !agree.checked;
});


/* =========================================================
   REGISTO FUTURO NA BASE DE DADOS
   ========================================================= */

async function registarDownload(email) {
    if (!CONFIG.workerUrl) {
        return;
    }

    const payload = {
        event: "StartUP Voucher Innovate",
        email: email,
        photoId: photoId,
        imageConsent: imageConsent.checked,
        emailConsent: emailConsent.checked,
        downloadedAt: new Date().toISOString(),
        pageUrl: window.location.href,
        userAgent: navigator.userAgent
    };

    try {
        await fetch(CONFIG.workerUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
    } catch (error) {
        /*
         * Um erro no registo nunca deve impedir
         * o cliente de descarregar a fotografia.
         */
        console.error(
            "Não foi possível registar o download:",
            error
        );
    }
}


/* =========================================================
   DOWNLOAD ATRAVÉS DE BLOB
   ========================================================= */

async function descarregarComBlob() {
    const response = await fetch(downloadUrl);

    if (!response.ok) {
        throw new Error(
            `Erro ao obter a fotografia: ${response.status}`
        );
    }

    const blob = await response.blob();
    const temporaryUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = temporaryUrl;
    link.download = `fotografia-${photoId
        .split("/")
        .pop()}.jpg`;

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
    const link = document.createElement("a");

    link.href = downloadUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    document.body.appendChild(link);
    link.click();
    link.remove();
}


/* =========================================================
   PROCESSAR DOWNLOAD
   ========================================================= */

downloadButton.addEventListener("click", async () => {
    const email = obterEmail();

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

    downloadButton.disabled = true;
    downloadButton.textContent = "A preparar o download...";

    let downloadIniciado = false;

    try {
        /*
         * Tentativa principal.
         */
        await descarregarComBlob();
        downloadIniciado = true;
    } catch (error) {
        console.warn(
            "Download por Blob indisponível. A utilizar ligação direta.",
            error
        );

        /*
         * Solução alternativa.
         */
        descarregarDiretamente();
        downloadIniciado = true;
    }

    if (downloadIniciado) {
        statusMessage.textContent =
            "Download iniciado com sucesso.";

        /*
         * Guardar apenas quem carregou efetivamente
         * no botão de download.
         */
        registarDownload(email);

        /*
         * Esperar um pouco antes de mostrar
         * a página de Instagram.
         */
        setTimeout(() => {
            const successUrl =
                `success.html?instagram=${encodeURIComponent(
                    CONFIG.instagramUrl
                )}`;

            window.location.href = successUrl;
        }, 1800);
    } else {
        statusMessage.textContent =
            "Não foi possível iniciar o download.";

        downloadButton.disabled = false;
        downloadButton.textContent =
            "Descarregar fotografia";
    }
});
