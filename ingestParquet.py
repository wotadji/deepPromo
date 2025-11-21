import pandas as pd
from sqlalchemy import create_engine
import urllib.parse
from tqdm import tqdm  # barre de progression

# -------------------------------
# Paramètres de connexion
# -------------------------------
HOST = "198.23.53.53"
PORT = 5432
DATABASE = "wotadji_deeppromo"
USERNAME = "wotadji_deeppromo"
PASSWORD = "Chniadma04@"

PASSWORD = urllib.parse.quote_plus(PASSWORD)

connection_string = f"postgresql://{USERNAME}:{PASSWORD}@{HOST}:{PORT}/{DATABASE}"

# Créer l'engine SQLAlchemy
engine = create_engine(connection_string)

# -------------------------------
# Lecture du fichier parquet
# -------------------------------
df = pd.read_parquet("commercial_finance_data.parquet", engine="pyarrow")

print(f"Fichier parquet chargé avec {len(df)} lignes et {len(df.columns)} colonnes")

# -------------------------------
# Ingestion avec barre de progression
# -------------------------------
table_name = "dp_lake_parquet"
chunksize = 10000

# Calcul du nombre de chunks
num_chunks = (len(df) // chunksize) + 1

# Ingestion chunk par chunk avec tqdm
with tqdm(total=len(df), desc="Ingestion en cours", unit="lignes") as pbar:
    for i in range(num_chunks):
        start = i * chunksize
        end = min((i + 1) * chunksize, len(df))
        chunk = df.iloc[start:end]
        if_exists = "replace" if i == 0 else "append"
        chunk.to_sql(table_name, engine, if_exists=if_exists, index=False)
        pbar.update(len(chunk))

print(f"Ingestion terminée dans la table {table_name} ({len(df)} lignes)")

