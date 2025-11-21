import os
import pandas as pd
import psycopg2
from psycopg2 import sql
from tqdm import tqdm
import json
import logging
from datetime import datetime
import hashlib

# ==========================================================
# ⚙️ CONFIGURATION GLOBALE
# ==========================================================
HOST = "198.23.53.53"          # ou ton IP, ex: "91.173.64.129"
PORT = 5432                 # port par défaut PostgreSQL
DATABASE = "wotadji_deeppromo"
USERNAME = "wotadji_deeppromo"
PASSWORD = "Chniadma04@"
DATASETS_DIR = "datasets"
TABLE_NAME = "datasets_lake"
LOG_DIR = "logs_task"
STATE_FILE = "import_state.json"

# ==========================================================
# 📊 CONFIGURATION DU LOGGING
# ==========================================================
def setup_logging():
    os.makedirs(LOG_DIR, exist_ok=True)
    log_filename = f"import_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
    log_path = os.path.join(LOG_DIR, log_filename)
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_path, encoding='utf-8'),
            logging.StreamHandler()
        ]
    )
    logger = logging.getLogger(__name__)
    logger.info(f"🚀 Démarrage de l'import PostgreSQL - Log: {log_path}")
    return logger, log_path

# ==========================================================
# 💾 GESTION DE L'ÉTAT D'IMPORT
# ==========================================================
class ImportStateManager:
    def __init__(self, state_file):
        self.state_file = state_file
        self.state = self._load_state()
    
    def _load_state(self):
        if os.path.exists(self.state_file):
            try:
                with open(self.state_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                logging.warning(f"❌ Impossible de charger l'état: {e}")
        return {"last_import": None, "imported_files": {}, "total_files_imported": 0, "total_rows_imported": 0}
    
    def _save_state(self):
        try:
            with open(self.state_file, 'w', encoding='utf-8') as f:
                json.dump(self.state, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logging.error(f"❌ Impossible de sauvegarder l'état: {e}")
    
    def calculate_file_hash(self, file_path):
        try:
            hasher = hashlib.md5()
            with open(file_path, 'rb') as f:
                for chunk in iter(lambda: f.read(4096), b""):
                    hasher.update(chunk)
            return hasher.hexdigest()
        except Exception as e:
            logging.warning(f"⚠️ Impossible de calculer le hash pour {file_path}: {e}")
            return None
    
    def is_file_imported(self, file_path):
        file_name = os.path.basename(file_path)
        file_size = os.path.getsize(file_path)
        file_hash = self.calculate_file_hash(file_path)
        if file_name in self.state["imported_files"]:
            stored_info = self.state["imported_files"][file_name]
            if stored_info["size"] == file_size and stored_info.get("hash") == file_hash:
                return True
        return False
    
    def mark_file_as_imported(self, file_path, rows_imported):
        file_name = os.path.basename(file_path)
        file_size = os.path.getsize(file_path)
        file_hash = self.calculate_file_hash(file_path)
        self.state["imported_files"][file_name] = {
            "path": file_path,
            "size": file_size,
            "hash": file_hash,
            "import_date": datetime.now().isoformat(),
            "rows_imported": rows_imported
        }
        self.state["total_files_imported"] += 1
        self.state["total_rows_imported"] += rows_imported
        self.state["last_import"] = datetime.now().isoformat()
        self._save_state()
        logging.info(f"✅ Fichier marqué comme importé: {file_name} ({rows_imported} lignes)")

# ==========================================================
# 🧹 UTILITAIRES
# ==========================================================
def clean_column_name(column_name):
    cleaned = ''.join(c if c.isalnum() else '_' for c in str(column_name))
    return cleaned.strip('_').lower()

def detect_csv_delimiter(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            first_line = f.readline()
        for delimiter in [',', ';', '\t', '|']:
            if delimiter in first_line:
                return delimiter
        return ','
    except:
        return ';'

def setup_database_connection():
    return psycopg2.connect(
        host=HOST,
        port=PORT,
        dbname=DATABASE,
        user=USERNAME,
        password=PASSWORD
    )

# ==========================================================
# 🏗️ TABLE CREATION / MISE À JOUR
# ==========================================================
def create_table_if_not_exists(cursor, table_name):
    query = sql.SQL(f"""
    CREATE TABLE IF NOT EXISTS {table_name} (
        id SERIAL PRIMARY KEY,
        date DATE,
        country VARCHAR(100),
        region VARCHAR(100),
        department VARCHAR(100),
        city VARCHAR(100),
        store_id VARCHAR(50),
        product_id VARCHAR(50),
        product_description VARCHAR(255),
        purchase_price NUMERIC(10,2),
        selling_price NUMERIC(10,2),
        quantity INT,
        total_price NUMERIC(12,2),
        payment_type VARCHAR(50),
        customer_type VARCHAR(50),
        promotion_flag VARCHAR(10),
        created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    cursor.execute(query)

def add_missing_columns(cursor, table_name, df_columns):
    cursor.execute(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table_name}'")
    existing_cols = [row[0].lower() for row in cursor.fetchall()]
    for col in df_columns:
        if col not in existing_cols and col != "id":
            alter_query = sql.SQL("ALTER TABLE {} ADD COLUMN {} VARCHAR(255)").format(
                sql.Identifier(table_name), sql.Identifier(col)
            )
            try:
                cursor.execute(alter_query)
                logging.info(f"➕ Colonne ajoutée : {col}")
            except Exception as e:
                logging.error(f"❌ Erreur ajout colonne {col}: {e}")

# ==========================================================
# ⚡ INSERTION EN LOTS
# ==========================================================
def insert_dataframe_batches(df, conn, table_name, batch_size=2000, file_name="unknown"):
    if df.empty:
        logging.warning(f"⚠️ Aucune donnée à insérer pour {file_name}")
        return 0

    cursor = conn.cursor()
    add_missing_columns(cursor, table_name, df.columns)
    conn.commit()

    total_rows = len(df)
    inserted_rows = 0
    start_index = 0

    with tqdm(total=total_rows, desc=f"Insertion {os.path.basename(file_name)}") as pbar:
        while start_index < total_rows:
            end_index = min(start_index + batch_size, total_rows)
            batch = df.iloc[start_index:end_index].fillna("")
            cols = [c for c in df.columns]
            query = sql.SQL("INSERT INTO {} ({}) VALUES ({})").format(
                sql.Identifier(table_name),
                sql.SQL(', ').join(map(sql.Identifier, cols)),
                sql.SQL(', ').join(sql.Placeholder() * len(cols))
            )
            data = [tuple(row[col] for col in cols) for _, row in batch.iterrows()]
            try:
                cursor.executemany(query.as_string(conn), data)
                conn.commit()
                inserted_rows += len(batch)
                pbar.update(len(batch))
            except Exception as e:
                logging.error(f"❌ Erreur d'insertion : {e}")
                conn.rollback()
            start_index += batch_size

    logging.info(f"✅ {inserted_rows:,} lignes insérées depuis {os.path.basename(file_name)}")
    return inserted_rows

# ==========================================================
# 📄 TRAITEMENT D'UN FICHIER
# ==========================================================
def process_single_csv_file(file_path, conn, table_name, state_manager):
    try:
        file_name = os.path.basename(file_path)
        logging.info(f"📄 Traitement : {file_name}")
        delimiter = detect_csv_delimiter(file_path)
        df = pd.read_csv(file_path, delimiter=delimiter, encoding='utf-8', low_memory=False)
        df.columns = [clean_column_name(c) for c in df.columns]
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'], errors='coerce')
        inserted = insert_dataframe_batches(df, conn, table_name, file_name=file_name)
        if inserted > 0:
            state_manager.mark_file_as_imported(file_path, inserted)
        return inserted
    except Exception as e:
        logging.error(f"❌ Erreur fichier {file_path}: {e}")
        return 0

# ==========================================================
# 🚀 TRAITEMENT PRINCIPAL
# ==========================================================
def process_all_csv_files(force_reimport=False):
    logger, log_path = setup_logging()
    state_manager = ImportStateManager(STATE_FILE)
    if force_reimport:
        state_manager.reset_state()
    total_inserted = 0
    conn = None
    try:
        csv_files = [os.path.join(DATASETS_DIR, f) for f in os.listdir(DATASETS_DIR) if f.endswith(".csv")]
        if not csv_files:
            logger.info("Aucun fichier CSV trouvé.")
            return
        conn = setup_database_connection()
        cursor = conn.cursor()
        create_table_if_not_exists(cursor, TABLE_NAME)
        conn.commit()
        for file in csv_files:
            total_inserted += process_single_csv_file(file, conn, TABLE_NAME, state_manager)
        logger.info(f"🎯 Total inséré : {total_inserted:,} lignes")
    except Exception as e:
        logger.error(f"❌ Erreur générale : {e}")
    finally:
        if conn:
            conn.close()
            logger.info("🔌 Connexion PostgreSQL fermée")

# ==========================================================
# ▶️ MAIN
# ==========================================================
if __name__ == "__main__":
    process_all_csv_files(force_reimport=False)
