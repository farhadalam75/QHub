import { loadCatalog, resourceURL, isImage, downloadFile } from './resources.js';

const status = document.getElementById('status');
const content = document.getElementById('viewer-content');
const path = new URLSearchParams(location.search).get('file');
const download = document.getElementById('download');

async function showPDF(url) {
    const pdfjs = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
    const pdf = await pdfjs.getDocument(url).promise;
    const canvas = document.createElement('canvas');
    content.append(canvas);
    document.getElementById('pdf-controls').hidden = false;
    const pageInput = document.getElementById('page');
    const zoom = document.getElementById('zoom');
    const previous = document.getElementById('previous');
    const next = document.getElementById('next');
    pageInput.max = pdf.numPages;
    document.getElementById('page-count').textContent = `/ ${pdf.numPages}`;
    let pageNumber = 1;
    let rendering = Promise.resolve();
    function render() {
        rendering = rendering.then(async () => {
            status.textContent = 'Loading page...';
            const page = await pdf.getPage(pageNumber);
            const base = page.getViewport({ scale: 1 });
            const scale = Math.max(0.1, (content.clientWidth - 24) / base.width) * Number(zoom.value);
            const viewport = page.getViewport({ scale });
            const ratio = window.devicePixelRatio || 1;
            canvas.width = Math.floor(viewport.width * ratio);
            canvas.height = Math.floor(viewport.height * ratio);
            canvas.style.width = `${viewport.width}px`;
            canvas.style.height = `${viewport.height}px`;
            await page.render({ canvasContext: canvas.getContext('2d'), viewport,
                transform: ratio === 1 ? null : [ratio, 0, 0, ratio, 0, 0] }).promise;
            pageInput.value = pageNumber;
            previous.disabled = pageNumber === 1;
            next.disabled = pageNumber === pdf.numPages;
            status.textContent = '';
        }).catch(error => { status.textContent = `Unable to read PDF: ${error.message}`; });
        return rendering;
    }
    previous.onclick = () => { pageNumber = Math.max(1, pageNumber - 1); render(); };
    next.onclick = () => { pageNumber = Math.min(pdf.numPages, pageNumber + 1); render(); };
    pageInput.onchange = () => {
        pageNumber = Math.max(1, Math.min(pdf.numPages, Math.floor(Number(pageInput.value)) || 1));
        render();
    };
    zoom.onchange = render;
    window.addEventListener('resize', render);
    await render();
}

document.getElementById('fullscreen').onclick = async () => {
    try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await document.documentElement.requestFullscreen();
    } catch {
        status.textContent = 'Fullscreen is not available in this browser.';
    }
};

try {
    if (!path) throw new Error('No file specified. Return to the library.');
    const catalog = await loadCatalog();
    const folder = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '';
    const entry = catalog.folders[folder]?.find(item => item.type === 'file' && item.path === path);
    if (!entry) throw new Error('File not found in the library.');
    document.getElementById('file-name').textContent = entry.name;
    document.title = `${entry.name} - QHub`;
    document.getElementById('back').href = `browse.html?path=${encodeURIComponent(folder)}`;
    const url = resourceURL(catalog, path);
    document.getElementById('open-original').href = url;
    download.disabled = false;
    download.onclick = () => downloadFile(url, entry.name, download).catch(error => {
        status.textContent = error.message;
    });
    if (/\.pdf$/i.test(path)) {
        await showPDF(url);
    } else if (isImage(path)) {
        const image = document.createElement('img');
        image.alt = entry.name;
        image.onload = () => { status.textContent = ''; };
        image.onerror = () => { status.textContent = 'Unable to load image. Try Open original or Download.'; };
        image.src = url;
        content.append(image);
    } else if (/\.(txt|md|csv|json)$/i.test(path)) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Unable to read file (${response.status}).`);
        const text = document.createElement('pre');
        text.textContent = await response.text();
        content.append(text);
        status.textContent = '';
    } else {
        status.textContent = 'Preview is unavailable for this file type. Download the file to open it.';
    }
} catch (error) {
    status.textContent = `Unable to load document: ${error.message}. Try Open original or Download.`;
}