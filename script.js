const cloudName = "lim5fdgq";

const params = new URLSearchParams(window.location.search);
const photoId = params.get("photo");

if (!photoId) {
    document.querySelector(".container").innerHTML = `
        <h2>Fotografia não encontrada</h2>
        <p>Não foi indicada nenhuma fotografia.</p>
    `;

    throw new Error("Falta o parâmetro da fotografia");
}

const imageUrl =
    `https://res.cloudinary.com/${cloudName}/image/upload/${photoId}`;

const downloadUrl =
    `https://res.cloudinary.com/${cloudName}/image/upload/fl_attachment/${photoId}`;

const photo = document.getElementById("photo");
const checkbox = document.getElementById("agree");
const button = document.getElementById("download");

photo.src = imageUrl;

/* O botão só fica ativo depois de aceitar os termos */
button.disabled = true;

checkbox.addEventListener("change", () => {
    button.disabled = !checkbox.checked;
});

button.addEventListener("click", async () => {
    if (!checkbox.checked) {
        alert(
            "Tem de aceitar a Política de Privacidade e os Termos e Condições."
        );
        return;
    }

    const email = prompt(
        "Introduza o seu email para descarregar a fotografia:"
    );

    if (!email) {
        alert("É necessário introduzir um email.");
        return;
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailValido.test(email)) {
        alert("Introduza um endereço de email válido.");
        return;
    }

    button.disabled = true;
    button.textContent = "A preparar download...";

    try {
        await emailjs.send(
            "service_87s5784",
            "template_34q2y45",
            {
                download_link: window.location.href,
                to_email: email,
                customer_email: email,
                photo_id: photoId
            }
        );

        const link = document.createElement("a");

        link.href = downloadUrl;
        link.download = `fotografia-${photoId}.jpg`;
        link.target = "_blank";

        document.body.appendChild(link);
        link.click();
        link.remove();

        alert(
            "Download iniciado. Foi também enviado um email com o link da fotografia."
        );
    } catch (error) {
        console.error("Erro:", error);

        alert(
            "Não foi possível enviar o email. Verifique a configuração do EmailJS."
        );
    } finally {
        button.disabled = !checkbox.checked;
        button.textContent = "Descarregar fotografia";
    }
});
