import os
from PyPDF2 import PdfReader

def is_pdf_valid(filepath):
    try:
        with open(filepath, 'rb') as f:
            PdfReader(f)
        return True
    except Exception as e:
        return False

def check_pdfs_in_directory(directory):
    invalid_files = []
    for root, _, files in os.walk(directory):
        for file in files:
            if file.lower().endswith('.pdf'):
                path = os.path.join(root, file)
                if not is_pdf_valid(path):
                    invalid_files.append(path)
    return invalid_files

if __name__ == "__main__":
    # Change this path to the root directory you want to check
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    invalids = check_pdfs_in_directory(root_dir)
    if invalids:
        print("Invalid PDF files found:")
        for f in invalids:
            print(f)
    else:
        print("All PDF files are valid.")
