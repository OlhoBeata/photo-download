const cloudName = "lim5fdgq";

const params = new URLSearchParams(window.location.search);
const photoId = params.get("photo");

if (!photoId) {
    document.querySelector(".container").innerHTML = `
        <h2>Photo not found</h2>
        <p>No photo was specified.</p>
    `;
    throw new Error("Missing photo parameter");
}

const imageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${photoId}`;

const photo = document.getElementById("photo");
photo.src = imageUrl;

const checkbox = document.getElementById("agree");
const button = document.getElementById("download");

// Enable download button only when checkbox is ticked
checkbox.addEventListener("change", () => {
    button.disabled = !checkbox.checked;
});

button.addEventListener("click", async () => {

    let customerEmail = "";

    while (true) {

        customerEmail = prompt("Por favor confirme o seu email:");

        if (customerEmail === null) {
            alert("É necessário fornecer um email para descarregar a fotografia.");
            return;
        }

        customerEmail = customerEmail.trim();

        if (customerEmail === "") {
            alert("Por favor introduza o seu email.");
            continue;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(customerEmail)) {
            alert("Por favor introduza um email válido.");
            continue;
        }

        break;
    }

    // Send notification
    fetch("https://mute-haze-9698.luis-santos-286.workers.dev", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            photoId: photoId,
            customerEmail: customerEmail
        })
    }).catch(error => {
        console.log("Notification error:", error);
    });

    // Download photo
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = "";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

});
