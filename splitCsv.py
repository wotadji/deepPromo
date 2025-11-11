import os
import math

def fast_split_csv(input_file, output_dir, lines_per_chunk=50000):
    """
    Division ultra-rapide sans utiliser pandas
    """
    
    os.makedirs(output_dir, exist_ok=True)
    
    # Compter les lignes
    print("🔢 Comptage des lignes...")
    with open(input_file, 'r', encoding='latin-1') as f:
        total_lines = sum(1 for _ in f)
    
    print(f"📊 Fichier: {total_lines:,} lignes")
    num_chunks = math.ceil((total_lines - 1) / lines_per_chunk)
    print(f"✂️  Division en {num_chunks} fichiers")
    
    # Lire et diviser
    with open(input_file, 'r', encoding='latin-1') as big_file:
        header = big_file.readline()
        
        for chunk_num in range(num_chunks):
            output_file = os.path.join(output_dir, f"part_{chunk_num+1:04d}.csv")
            
            with open(output_file, 'w', encoding='latin-1') as chunk_file:
                chunk_file.write(header)
                
                for _ in range(lines_per_chunk):
                    line = big_file.readline()
                    if not line:
                        break
                    chunk_file.write(line)
            
            print(f"✅ Part {chunk_num+1:04d} créée")
    
    print("🎉 Division terminée!")

# Utilisation rapide
fast_split_csv("datasets/Carrefour_lake1.csv", "fichiers_divises", 50000)