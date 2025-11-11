import pandas as pd
import os

def test_csv_file():
    """Tester la lecture du fichier CSV"""
    FILE_PATH = "../../Downloads/dataset/Carrefour_lake1.csv"
    
    if not os.path.exists(FILE_PATH):
        print("Fichier non trouvé. Fichiers CSV disponibles:")
        for file in os.listdir('.'):
            if '.csv' in file.lower():
                print(f" - {file}")
        return
    
    # Essayer différents délimiteurs et encodages
    delimiters = [';', ',', '\t']
    encodings = ['utf-8', 'latin-1', 'iso-8859-1']
    
    for delimiter in delimiters:
        for encoding in encodings:
            try:
                print(f"Essai avec délimiteur '{delimiter}' et encodage {encoding}")
                df = pd.read_csv(FILE_PATH, delimiter=delimiter, encoding=encoding, nrows=5)
                print("✓ SUCCÈS!")
                print("Colonnes:", df.columns.tolist())
                print("Aperçu:")
                print(df)
                print("\n" + "="*50 + "\n")
                break
            except Exception as e:
                print(f"✗ Échec: {e}")
    
    # Afficher les premières lignes brutes
    print("\nPremières lignes brutes du fichier:")
    with open(FILE_PATH, 'r', encoding='latin-1') as f:
        for i, line in enumerate(f):
            if i < 5:
                print(f"Ligne {i}: {line.strip()}")
            else:
                break

if __name__ == "__main__":
    test_csv_file()