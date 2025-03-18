let generatedPdf = null;

async function convertFile() {
    const preview = document.getElementById('preview');
    preview.innerHTML = '';
    document.getElementById('downloadZipButton').style.display = 'none';
    document.getElementById('downloadPdfButton').style.display = 'none';

    const fileInput = document.getElementById('fileInput');
    if (!fileInput.files.length) return;

    const file = fileInput.files[0];
    if (file.type === "application/pdf") {
        convertPdfToJpeg(file);
    } else if (file.type.startsWith("image/")) {
        if (file.type === "image/jpeg" || file.type === "image/png") {
            convertImageToPdf(file);
        } else {
            alert("Unsupported format. Please select an image in JPEG or PNG format.");
        }
    }
}

async function convertPdfToJpeg(file) {
    const fileReader = new FileReader();
    fileReader.readAsArrayBuffer(file);
    fileReader.onload = async function () {
        const pdfData = new Uint8Array(this.result);
        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
        const zip = new JSZip();
        document.getElementById('downloadZipButton').style.display = 'block';

        for (let i = 0; i < pdf.numPages; i++) {
            const page = await pdf.getPage(i + 1);
            const scale = 2;
            const viewport = page.getViewport({ scale });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            await page.render({ canvasContext: context, viewport }).promise;

            const imgData = canvas.toDataURL('image/jpeg');
            zip.file(`page${i + 1}.jpg`, imgData.split(',')[1], { base64: true });

            const container = document.createElement('div');
            container.classList.add('image-container');

            const img = document.createElement('img');
            img.src = imgData;
            img.onclick = function () { openModal(img.src); };
            container.appendChild(img);

            const downloadButton = document.createElement('button');
            downloadButton.classList.add('download-button');
            downloadButton.innerText = `Page${i + 1} Download`;
            downloadButton.onclick = function () {
                const a = document.createElement('a');
                a.href = imgData;
                a.download = `page${i + 1}.jpg`;
                a.click();
            };
            container.appendChild(downloadButton);

            preview.appendChild(container);
        }
    };
}

function downloadJpegZip() {
    const images = document.querySelectorAll('#preview img');
    if (images.length === 0) return;
    const zip = new JSZip();
    images.forEach((img, index) => {
        zip.file(`image${index + 1}.jpg`, img.src.split(',')[1], { base64: true });
    });
    zip.generateAsync({ type: 'blob' }).then(content => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(content);
        a.download = 'images.zip';
        a.click();
    });
}

function convertImageToPdf(file) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    const fileReader = new FileReader();
    fileReader.onload = function (event) {
        const img = new Image();
        img.src = event.target.result;
        img.onload = function () {
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            let imgWidth = pageWidth;
            let imgHeight = (img.height / img.width) * imgWidth;

            if (imgHeight > pageHeight) {
                imgHeight = pageHeight;
                imgWidth = (img.width / img.height) * imgHeight;
            }

            const offsetX = (pageWidth - imgWidth) / 2;
            const offsetY = (pageHeight - imgHeight) / 2;

            pdf.addImage(img, 'JPEG', offsetX, offsetY, imgWidth, imgHeight);

            const container = document.createElement('div');
            container.classList.add('image-container');
            const previewImg = document.createElement('img');
            previewImg.src = event.target.result;
            previewImg.onclick = function () { openModal(previewImg.src); };
            container.appendChild(previewImg);
            preview.appendChild(container);

            document.getElementById('downloadPdfButton').style.display = 'block';
            generatedPdf = pdf;
        };
    };
    fileReader.readAsDataURL(file);
}

function openModal(src) {
    const modal = document.getElementById('myModal');
    const modalImg = document.getElementById('modalImg');
    modal.style.display = 'flex';
    modalImg.src = src;
}

function closeModal() {
    const modal = document.getElementById('myModal');
    modal.style.display = 'none';
}

function downloadPdf() {
    if (generatedPdf) {
        generatedPdf.save('generated.pdf');
    }
}