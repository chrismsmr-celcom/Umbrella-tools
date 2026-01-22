pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const fileInput = document.getElementById('fileInput');
const canvas = document.getElementById('pdfCanvas');
const ctx = canvas.getContext('2d');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const zoomInBtn = document.getElementById('zoomIn');
const zoomOutBtn = document.getElementById('zoomOut');
const pageInfo = document.getElementById('pageInfo');
const thumbnails = document.getElementById('thumbnails');
const status = document.getElementById('fileStatus');
const darkToggle = document.getElementById('darkToggle');
const convertBtn = document.querySelector('.convert-btn');
const dropArea = document.getElementById('drop-area');

let pdfDoc = null, pageNum = 1, scale = 1.2, currentFile = null;

function renderPage(num) {
  pdfDoc.getPage(num).then(page => {
    const viewport = page.getViewport({ scale });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    page.render({ canvasContext: ctx, viewport });
    pageInfo.textContent = `Page ${pageNum} / ${pdfDoc.numPages}`;
  });
}

function loadPDF(file) {
  currentFile = file;
  status.textContent = `📄 ${file.name}`;
  thumbnails.innerHTML = '';

  const reader = new FileReader();
  reader.onload = function () {
    pdfjsLib.getDocument(new Uint8Array(this.result)).promise.then(pdf => {
      pdfDoc = pdf; pageNum = 1; renderPage(pageNum);
      convertBtn.disabled = false;

      for (let i = 1; i <= pdf.numPages; i++) {
        pdf.getPage(i).then(page => {
          const viewport = page.getViewport({ scale: 0.22 });
          const thumbCanvas = document.createElement('canvas');
          const tctx = thumbCanvas.getContext('2d');
          thumbCanvas.width = viewport.width;
          thumbCanvas.height = viewport.height;
          page.render({ canvasContext: tctx, viewport });

          const thumbWrapper = document.createElement('div');
          thumbWrapper.className = 'thumb';
          thumbWrapper.onclick = () => { pageNum = i; renderPage(pageNum); };
          thumbWrapper.appendChild(thumbCanvas);
          thumbnails.appendChild(thumbWrapper);
        });
      }
    });
  };
  reader.readAsArrayBuffer(file);
}

fileInput.addEventListener('change', e => loadPDF(e.target.files[0]));

// Drag & Drop
dropArea.addEventListener('dragover', e => { e.preventDefault(); dropArea.classList.add('dragover'); });
dropArea.addEventListener('dragleave', e => { e.preventDefault(); dropArea.classList.remove('dragover'); });
dropArea.addEventListener('drop', e => { 
  e.preventDefault(); 
  dropArea.classList.remove('dragover');
  loadPDF(e.dataTransfer.files[0]);
});

// Navigation
prevBtn.onclick = () => { if (!pdfDoc || pageNum <= 1) return; pageNum--; renderPage(pageNum); };
nextBtn.onclick = () => { if (!pdfDoc || pageNum >= pdfDoc.numPages) return; pageNum++; renderPage(pageNum); };

// Zoom
zoomInBtn.onclick = () => { if (!pdfDoc) return; scale += 0.2; renderPage(pageNum); };
zoomOutBtn.onclick = () => { if (!pdfDoc || scale <= 0.6) return; scale -= 0.2; renderPage(pageNum); };

// Dark mode
darkToggle.onclick = () => document.body.classList.toggle('dark');

// Convert PDF -> Word
convertBtn.onclick = async () => {
  if (!currentFile) return;
  convertBtn.textContent = '⏳ Conversion en cours...'; convertBtn.disabled = true;

  const formData = new FormData();
  formData.append('file', currentFile);

  try {
    const response = await fetch('http://127.0.0.1:8000/convert/pdf-to-word', {
      method:'POST', body:formData
    });

    if (!response.ok) throw new Error('Erreur lors de la conversion');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.name.replace(/\.pdf$/i, '.docx');
    document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);

    convertBtn.textContent = 'PDF → Word';
  } catch(err) {
    alert(err.message); convertBtn.textContent = 'PDF → Word';
  } finally { convertBtn.disabled = false; }
};
