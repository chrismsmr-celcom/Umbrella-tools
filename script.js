// Tabs
const tabs = document.querySelectorAll(".sidebar nav button");
const contents = document.querySelectorAll(".tab-content");
tabs.forEach((tab,index)=>{
    tab.addEventListener("click",()=>{
        tabs.forEach(t=>t.classList.remove("active"));
        contents.forEach(c=>c.classList.remove("active"));
        tab.classList.add("active");
        contents[index].classList.add("active");
    });
});

// Elements
const imagesUpload = document.getElementById("imagesUpload");
const convertImagesBtn = document.getElementById("convertImagesBtn");
const downloadImagesPdf = document.getElementById("downloadImagesPdf");
const imagesPreview = document.getElementById("imagesPreview");

const pdfUpload = document.getElementById("pdfUpload");
const convertPdfBtn = document.getElementById("convertPdfBtn");
const imagesResult = document.getElementById("imagesResult");

const API_URL = "https://umbrella-tools.onrender.com";

// Image Preview before PDF
imagesUpload.addEventListener("change", ()=>{
    imagesPreview.innerHTML = "";
    Array.from(imagesUpload.files).forEach(file=>{
        const reader = new FileReader();
        reader.onload = e=>{
            const img = document.createElement("img");
            img.src = e.target.result;
            imagesPreview.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
});

// Images → PDF
convertImagesBtn.addEventListener("click", async ()=>{
    if(!imagesUpload.files.length){alert("Sélectionnez des images."); return;}
    const formData = new FormData();
    for(const file of imagesUpload.files) formData.append("files", file);
    convertImagesBtn.disabled=true; convertImagesBtn.textContent="Conversion...";
    try{
        const res = await fetch(`${API_URL}/convert/images-to-pdf`,{method:"POST",body:formData});
        if(!res.ok) throw new Error("Erreur serveur");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        downloadImagesPdf.href=url; downloadImagesPdf.style.display="inline-block";
    }catch(e){alert(e);}finally{convertImagesBtn.disabled=false;convertImagesBtn.textContent="Convertir en PDF";}
});

// PDF → Images
convertPdfBtn.addEventListener("click", async ()=>{
    if(!pdfUpload.files.length){alert("Sélectionnez un PDF."); return;}
    const formData = new FormData(); formData.append("file",pdfUpload.files[0]);
    convertPdfBtn.disabled=true; convertPdfBtn.textContent="Conversion...";
    try{
        const res = await fetch(`${API_URL}/convert/pdf-to-images`,{method:"POST",body:formData});
        if(!res.ok) throw new Error("Erreur serveur");
        const data = await res.json();
        imagesResult.innerHTML="";
        data.images.forEach(img=>{
            const imageEl=document.createElement("img");
            imageEl.src=`${API_URL}/${img.replaceAll("\\","/")}`;
            imagesResult.appendChild(imageEl);
        });
    }catch(e){alert(e);}finally{convertPdfBtn.disabled=false; convertPdfBtn.textContent="Convertir en Images";}
});

