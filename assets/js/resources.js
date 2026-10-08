let catalogPromise;

export function loadCatalog() {
    catalogPromise ??= fetch(new URL('../files.json', import.meta.url)).then(response => {
        if (!response.ok) throw new Error('Unable to load the file index. Please reload.');
        return response.json();
    });
    return catalogPromise;
}

export function resourceURL(catalog, path) {
    return catalog.resourceBase + path.split('/').map(encodeURIComponent).join('/');
}

export function isImage(path) {
    return /\.(png|jpe?g|gif|webp|svg|avif|bmp|ico)$/i.test(path);
}

export async function downloadFile(url, name, button) {
    button.disabled = true;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Download failed (${response.status}).`);
        const blobURL = URL.createObjectURL(await response.blob());
        const link = document.createElement('a');
        link.href = blobURL;
        link.download = name;
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(blobURL), 60000);
    } finally {
        button.disabled = false;
    }
}