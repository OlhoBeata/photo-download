"use strict";

/* =========================================================
   CONFIGURAÇÃO
   ========================================================= */

const CONFIG = {
    cloudName: "lim5fdgq",

    instagramUrl: "https://www.instagram.com/by.iapmei/",

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
   ENDEREÇOS CLOUDINARY
   ========================================================= */

const encodedPhotoId = photoId
    .split("/")
    .map(part => encodeURIComponent(part))
    .join("/");

/*
 * Pré-visualização protegida:
 * 150 px, baixa qualidade e desfocada.
 */
const imageUrl =
    `https://res.cloudinary.com/${CONFIG.cloudName}` +
    `/image/upload/c_fill,w_220,q_40,f_auto/${encodedPhotoId}`;
/*
 * A fotografia original é utilizada apenas no download.
 */
const downloadUrl =
    `https://res.cloudinary.com/${CONFIG.cloudName}` +
    `/image/upload/fl_attachment/${encodedPhotoId}`;


/* =========================================================
   CARREGAR PRÉ-VISUALIZAÇÃO
   ========================================================= */

/* =========================================================
   CARREGAR PRÉ-VISUALIZAÇÃO
   ========================================================= */

photo.addEventListener("load", () => {
    if (loading) {
        loading.style.display = "none";
    }

    if (previewWrapper) {
        previewWrapper.classList.add("visible");
    }
});

photo.addEventListener("error", () => {
    if (loading) {
        loading.innerHTML = `
            <p>Não foi possível carregar a pré-visualização.</p>
        `;
    } else {
        console.error(
            "Não foi possível carregar a pré-visualização:",
            imageUrl
        );
    }

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
   REGISTAR DOWNLOAD
   ========================================================= */

async function registarDownload(email) {
    if (!CONFIG.workerUrl) {
        return null;
    }

    const payload = {
        eventCode: "STARTUP-VOUCHER-INNOVATE",
        eventName: "StartUP Voucher Innovate",
        email: email,
        photoId: photoId,
        imageConsent: imageConsent.checked,
        emailConsent: emailConsent.checked,
        downloadedAt: new Date().toISOString(),
        pageUrl: window.location.href,
        userAgent: navigator.userAgent
    };

    try {
        const response = await fetch(CONFIG.workerUrl, {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(
                `O Worker respondeu com o código ${response.status}`
            );
        }

        return await response.json();
    } catch (error) {
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
    link.download =
        `fotografia-${photoId.split("/").pop()}.jpg`;

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
    downloadButton.textContent =
        "A preparar o download...";

    try {
        await descarregarComBlob();
    } catch (error) {
        console.warn(
            "Download por Blob indisponível. A utilizar ligação direta.",
            error
        );

        descarregarDiretamente();
    }

    statusMessage.textContent =
        "Download iniciado com sucesso.";

    const resultado = await registarDownload(email);
    const downloadId = resultado?.downloadId || "";

    setTimeout(() => {
        const parametros = new URLSearchParams();

        parametros.set(
            "instagram",
            CONFIG.instagramUrl
        );

        if (downloadId) {
            parametros.set(
                "downloadId",
                downloadId
            );
        }

        window.location.href =
            `success.html?${parametros.toString()}`;
    }, 1400);
});
