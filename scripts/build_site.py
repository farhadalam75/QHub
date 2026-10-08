import argparse
import json
import os
from pathlib import Path
import shutil


ROOT = Path(__file__).resolve().parents[1]
RESOURCE_FOLDERS = ('Arabic', 'Dua', 'Hadith', 'Others', 'Quran', 'Sirat')


def build(output):
    folders = {'': []}
    for category in RESOURCE_FOLDERS:
        for path in sorted((ROOT / category).rglob('*')):
            if not path.is_file() or path.is_symlink():
                continue
            relative = path.relative_to(ROOT)
            parent = relative.parent.as_posix()
            folders.setdefault(parent, []).append({
                'name': path.name, 'path': relative.as_posix(),
                'type': 'file', 'size': path.stat().st_size,
            })
            for directory in relative.parents:
                if directory == Path('.'):
                    continue
                directory_name = directory.as_posix()
                if directory_name not in folders:
                    folders[directory_name] = []
                ancestor = directory.parent.as_posix()
                ancestor = '' if ancestor == '.' else ancestor
                entries = folders.setdefault(ancestor, [])
                if not any(entry['path'] == directory_name for entry in entries):
                    entries.append({'name': directory.name, 'path': directory_name, 'type': 'folder'})
    for entries in folders.values():
        entries.sort(key=lambda entry: (entry['type'] != 'folder', entry['name'].casefold()))

    repository = os.environ.get('GITHUB_REPOSITORY', 'farhadalam75/QHub')
    revision = os.environ.get('GITHUB_SHA', 'main')
    catalog = {'resourceBase': f'https://raw.githubusercontent.com/{repository}/{revision}/',
               'folders': folders}
    manifest = ROOT / 'assets' / 'files.json'
    manifest.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    output.mkdir(parents=True, exist_ok=True)
    for filename in ('index.html', 'browse.html', 'viewer.html'):
        shutil.copy2(ROOT / filename, output / filename)
    shutil.copytree(ROOT / 'assets', output / 'assets', dirs_exist_ok=True)
    (output / '.nojekyll').touch()
    count = sum(entry['type'] == 'file' for entries in folders.values() for entry in entries)
    print(f'Indexed {count} files in {len(folders) - 1} folders. Site: {output}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path, default=ROOT / '_site')
    build(parser.parse_args().output)