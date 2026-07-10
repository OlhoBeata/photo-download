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

checkbox.addEventListener("change", () => {
    button.disabled = !checkbox.checked;
});

button.addEventListener("click", () => {
    // Force download
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = "";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});
