const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const convertBtn = document.getElementById('convert-btn');
const status = document.getElementById('status');
let files = [];
let currentTool = '';

document.querySelectorAll('.sidebar ul li').forEach(item => {
    item.addEventListener('click', () => {
        currentTool = item.dataset.tool;
        document.getElementById('title').innerText = item.innerText;
        files = [];
        convertBtn.disabled = true;
        status.innerText = '';
    });
});

dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.style.background='#eee'; });
dropZone.addEventListener('dragleave', e => { e.preventDefault(); dropZone.style.background='transparent'; });
dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.style.background='transparent';
    files = Array.from(e.dataTransfer.files);
    convertBtn.disabled = files.length===0;
    status.innerText = `${files.length} fichier(s) sélectionné(s)`;
});

fileInput.addEventListener('change', e => {
    files = Array.from(e.target.files);
    convertBtn.disabled = files.length===0;
    status.innerText = `${files.length} fichier(s) sélectionné(s)`;
});

convertBtn.addEventListener('click', async () => {
    if (!currentTool || files.length===0) return;
    const formData = new FormData();
    if (files.length>1) files.forEach(f => formData.append('files', f));
    else formData.append('file', files[0]);

    status.innerText = 'Conversion en cours...';
    convertBtn.disabled = true;

    try {
        const res = await fetch(`https://umbrella-tools.onrender.com/convert/${currentTool}`, {
            method:'POST',
            body: formData
        });
        if (!res.ok) throw new Error('Conversion échouée');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = files[0].name.replace(/\..+$/, '') + '.' + (currentTool.includes('word')?'docx':'pdf');
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        status.innerText = 'Conversion terminée!';
    } catch (err) {
        status.innerText = 'Erreur: '+err.message;
    } finally {
        convertBtn.disabled = false;
    }
});

