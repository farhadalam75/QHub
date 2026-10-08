import { loadCatalog, resourceURL, isImage, downloadFile } from './resources.js';

const path = new URLSearchParams(location.search).get('path') || '';
const status = document.getElementById('status');
const list = document.getElementById('file-list');
const breadcrumb = document.getElementById('breadcrumb');

function addCrumb(name, folder) {
    const link = document.createElement('a');
    link.textContent = name;
    link.href = `browse.html?path=${encodeURIComponent(folder)}`;
    if (breadcrumb.children.length) breadcrumb.append(' / ');
    breadcrumb.append(link);
}

addCrumb('All folders', '');
path.split('/').filter(Boolean).forEach((part, index, parts) => {
    addCrumb(part, parts.slice(0, index + 1).join('/'));
});

try {
    const catalog = await loadCatalog();
    const entries = catalog.folders[path];
    if (!entries) throw new Error('Folder not found. Return to All folders.');
    function render(query = '') {
        list.replaceChildren();
        const visible = entries.filter(entry => entry.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
        status.textContent = `${visible.length} items`;
        for (const entry of visible) {
            const row = document.createElement('li');
            row.className = 'file-item';
            const icon = document.createElement('span');
            icon.className = 'file-icon';
            const link = document.createElement('a');
            link.className = 'file-link';
            link.textContent = entry.name;
            if (entry.type === 'folder') {
                icon.innerHTML = '<i class="fas fa-folder" aria-hidden="true"></i>';
                link.href = `browse.html?path=${encodeURIComponent(entry.path)}`;
            } else {
                const url = resourceURL(catalog, entry.path);
                link.href = `viewer.html?file=${encodeURIComponent(entry.path)}`;
                if (isImage(entry.path)) {
                    const image = document.createElement('img');
                    image.src = url;
                    image.alt = '';
                    image.loading = 'lazy';
                    icon.append(image);
                } else {
                    icon.innerHTML = '<i class="fas fa-file" aria-hidden="true"></i>';
                }
                const size = document.createElement('span');
                size.className = 'file-size';
                size.textContent = `${(entry.size / 1048576).toFixed(1)} MB`;
                const download = document.createElement('button');
                download.className = 'icon-button';
                download.title = `Download ${entry.name}`;
                download.setAttribute('aria-label', download.title);
                download.innerHTML = '<i class="fas fa-download" aria-hidden="true"></i>';
                download.onclick = () => downloadFile(url, entry.name, download).catch(error => {
                    status.textContent = error.message;
                });
                row.append(size, download);
            }
            row.prepend(icon, link);
            list.append(row);
        }
    }
    render();
    document.getElementById('search').addEventListener('input', event => render(event.target.value));
} catch (error) {
    status.textContent = error.message;
}