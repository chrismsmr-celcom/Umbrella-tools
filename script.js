let currentTool = null;
let selectedFile = null;

const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const convertBtn = document.getElementById("convertBtn");
const statusText = document.getElementById("status");
const dropText = document.getElementById("dropText");
const toolTitle = document.getElementById("toolTitle");

function setTool(tool) {
  currentTool = tool;
  selectedFile = null;
  convertBtn.disabled = true;
  statusText.textContent = "";
  dropText.textContent = "Glissez votre fichier ici ou cliquez";
  toolTitle.textContent = tool.replaceAll("/", " ").toUpperCase();
}

/* CLICK */
fileInput.addEventListener("change", () => {
  if (!fileInput.files.length) return;
  selectedFile = fileInput.files[0];
  dropText.textContent = `Fichier sélectionné : ${selectedFile.name}`;
  convertBtn.disabled = false;
});

/* DRAG */
dropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropzone.classList.add("dragover");
});

dropzone.addEventListener("dragleave", () => {
  dropzone.classList.remove("dragover");
});

dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropzone.classList.remove("dragover");

  if (!e.dataTransfer.files.length) return;

  selectedFile = e.dataTransfer.files[0];
  fileInput.files = e.dataTransfer.files;
  dropText.textContent = `Fichier déposé : ${selectedFile.name}`;
  convertBtn.disabled = false;
});

/* CONVERT */
convertBtn.addEventListener("click", async () => {
  if (!selectedFile || !currentTool) return;

  statusText.textContent = "Conversion en cours…";

  const formData = new FormData();
  formData.append("file", selectedFile);

  try {
    const res = await fetch(
      `https://umbrella-tools.onrender.com/${currentTool}`,
      { method: "POST", body: formData }
    );

    if (!res.ok) throw new Error();

    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "umbrella-converted";
    a.click();

    statusText.textContent = "Conversion terminée ✔";
  } catch {
    statusText.textContent = "Erreur serveur ❌";
  }
});

