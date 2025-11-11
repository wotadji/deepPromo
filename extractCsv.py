import os
import pandas as pd
import pyodbc
from tqdm import tqdm
# import platform
# import glob
import json
import logging
from datetime import datetime
import hashlib

# ==========================================================
# ⚙️ CONFIGURATION GLOBALE
# ==========================================================
SERVER = "localhost"
DATABASE = "master"
USERNAME = "sa"
PASSWORD = "Chniadma04@"
DATASETS_DIR = "datasets"
TABLE_NAME = "produits_lake"
LOG_DIR = "logs_task"
STATE_FILE = "import_state.json"

# ==========================================================
# 📊 CONFIGURATION DU LOGGING
# ==========================================================
def setup_logging():
    """Configure le système de logging"""
    os.makedirs(LOG_DIR, exist_ok=True)
    
    # Nom du fichier de log avec timestamp
    log_filename = f"import_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
    log_path = os.path.join(LOG_DIR, log_filename)
    
    # Configuration du logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_path, encoding='utf-8'),
            logging.StreamHandler()  # Affiche aussi dans la console
        ]
    )
    
    logger = logging.getLogger(__name__)
    logger.info(f"🚀 Démarrage de l'import - Log: {log_path}")
    return logger, log_path

# ==========================================================
# 💾 GESTION DE L'ÉTAT D'IMPORT
# ==========================================================
class ImportStateManager:
    """Gère l'état des fichiers déjà importés"""
    
    def __init__(self, state_file):
        self.state_file = state_file
        self.state = self._load_state()
    
    def _load_state(self):
        """Charge l'état depuis le fichier JSON"""
        if os.path.exists(self.state_file):
            try:
                with open(self.state_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                logging.warning(f"❌ Impossible de charger l'état: {e}, création d'un nouvel état")
        return {
            "last_import": None,
            "imported_files": {},
            "total_files_imported": 0,
            "total_rows_imported": 0
        }
    
    def _save_state(self):
        """Sauvegarde l'état dans le fichier JSON"""
        try:
            with open(self.state_file, 'w', encoding='utf-8') as f:
                json.dump(self.state, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logging.error(f"❌ Impossible de sauvegarder l'état: {e}")
    
    def calculate_file_hash(self, file_path):
        """Calcule le hash MD5 d'un fichier pour détecter les modifications"""
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
        """Vérifie si un fichier a déjà été importé"""
        file_name = os.path.basename(file_path)
        file_size = os.path.getsize(file_path)
        file_hash = self.calculate_file_hash(file_path)
        
        if file_name in self.state["imported_files"]:
            stored_info = self.state["imported_files"][file_name]
            # Vérifier si le fichier a été modifié (taille ou hash différent)
            if (stored_info["size"] == file_size and 
                stored_info.get("hash") == file_hash):
                return True
        return False
    
    def mark_file_as_imported(self, file_path, rows_imported):
        """Marque un fichier comme importé"""
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
    
    def get_import_statistics(self):
        """Retourne les statistiques d'import"""
        return self.state
    
    def reset_state(self):
        """Réinitialise l'état d'import (pour forcer un réimport complet)"""
        self.state = {
            "last_import": None,
            "imported_files": {},
            "total_files_imported": 0,
            "total_rows_imported": 0
        }
        self._save_state()
        logging.info("🔄 État d'import réinitialisé")

# ==========================================================
# 🧹 UTILITAIRES
# ==========================================================
def clean_column_name(column_name):
    """Nettoie les noms de colonnes pour SQL Server"""
    cleaned = ''.join(c if c.isalnum() else '_' for c in str(column_name))
    return cleaned.strip('_').lower()

def detect_csv_delimiter(file_path):
    """Détecte automatiquement le délimiteur"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            first_line = f.readline()
        for delimiter in [',', ';', '\t', '|']:
            if delimiter in first_line:
                return delimiter
        return ','
    except:
        return ';'

def setup_database_connection(server, database, username, password):
    """Connexion à SQL Server"""
    connection_string = (
        f"DRIVER={{ODBC Driver 17 for SQL Server}};"
        f"SERVER={server};DATABASE={database};UID={username};PWD={password}"
    )
    return pyodbc.connect(connection_string)

# ==========================================================
# 🗂️ GESTION DES FICHIERS
# ==========================================================
def find_csv_files(datasets_dir):
    """Trouve tous les fichiers CSV dans le dossier datasets"""
    csv_files = []
    
    for root, dirs, files in os.walk(datasets_dir):
        for file in files:
            if file.endswith('.csv'):
                full_path = os.path.join(root, file)
                csv_files.append(full_path)
    
    csv_files.sort()
    return csv_files

def filter_new_files(csv_files, state_manager):
    """Filtre seulement les nouveaux fichiers non importés"""
    new_files = []
    skipped_files = []
    
    for file_path in csv_files:
        if state_manager.is_file_imported(file_path):
            skipped_files.append(file_path)
            logging.info(f"⏭️  Fichier déjà importé: {os.path.basename(file_path)}")
        else:
            new_files.append(file_path)
    
    logging.info(f"📁 Fichiers trouvés: {len(csv_files)} total, {len(new_files)} nouveaux, {len(skipped_files)} déjà importés")
    
    return new_files, skipped_files

# ==========================================================
# 🏗️ CREATION DE TABLE
# ==========================================================
def create_table_if_not_exists(cursor, table_name):
    """Crée la table selon la structure réelle du CSV"""
    create_table_query = f"""
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='{table_name}' AND xtype='U')
    CREATE TABLE {table_name} (
        id INT IDENTITY(1,1) PRIMARY KEY,
        date DATE,
        country NVARCHAR(100),
        region NVARCHAR(100),
        department NVARCHAR(100),
        city NVARCHAR(100),
        store_id NVARCHAR(50),
        product_id NVARCHAR(50),
        department_product NVARCHAR(100),
        product_category NVARCHAR(100),
        product_description NVARCHAR(255),
        purchase_price DECIMAL(10,2),
        selling_price DECIMAL(10,2),
        quantity INT,
        total_price DECIMAL(12,2),
        payment_type NVARCHAR(50),
        customer_type NVARCHAR(50),
        promotion_flag NVARCHAR(10),
        created_date DATETIME DEFAULT GETDATE()
    )
    """
    cursor.execute(create_table_query)

# ==========================================================
# ⚡ INSERTION EN LOTS
# ==========================================================
def insert_dataframe_batches(df, conn, table_name, batch_size=2000, file_name="unknown"):
    """Insère un DataFrame par lots avec gestion d'erreurs"""
    if df.empty:
        logging.warning(f"⚠️  Aucune donnée à insérer pour {file_name}")
        return 0
    
    total_rows = len(df)
    inserted_rows = 0
    batch_count = 0
    
    logging.info(f"⚙️  Insertion de {total_rows:,} lignes depuis {file_name}")
    
    start_index = 0
    
    with tqdm(total=total_rows, desc=f"Insertion {os.path.basename(file_name)}") as pbar:
        while start_index < total_rows:
            end_index = min(start_index + batch_size, total_rows)
            batch = df.iloc[start_index:end_index].fillna("")
            
            try:
                cursor = conn.cursor()
                
                # Récupérer les colonnes SQL (hors id)
                cursor.execute(f"""
                    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_NAME = '{table_name}' AND COLUMN_NAME <> 'id'
                """)
                sql_columns = [row[0] for row in cursor.fetchall()]
                common_cols = [col for col in df.columns if col in sql_columns]
                
                if not common_cols:
                    logging.error(f"❌ Aucune colonne commune trouvée pour {file_name}")
                    break
                
                placeholders = ", ".join(["?" for _ in common_cols])
                insert_query = f"INSERT INTO {table_name} ({', '.join(common_cols)}) VALUES ({placeholders})"
                
                cursor.fast_executemany = True
                data = [tuple(row[col] for col in common_cols) for _, row in batch.iterrows()]
                cursor.executemany(insert_query, data)
                conn.commit()
                
                batch_count += 1
                inserted_rows += len(batch)
                pbar.update(len(batch))
                
            except Exception as e:
                logging.error(f"❌ Erreur sur le batch {batch_count+1} de {file_name} : {e}")
                conn.rollback()
                
            start_index += batch_size
    
    logging.info(f"✅ {inserted_rows:,} lignes insérées depuis {os.path.basename(file_name)}")
    return inserted_rows

# ==========================================================
# 📄 TRAITEMENT D'UN FICHIER CSV
# ==========================================================
def process_single_csv_file(file_path, conn, table_name, state_manager):
    """Traite et insère un seul fichier CSV"""
    try:
        file_name = os.path.basename(file_path)
        logging.info(f"📄 Début du traitement: {file_name}")
        
        # Vérifier si le fichier existe
        if not os.path.exists(file_path):
            logging.error(f"❌ Fichier introuvable: {file_path}")
            return 0
        
        # Détecter le délimiteur
        delimiter = detect_csv_delimiter(file_path)
        logging.info(f"🔧 Délimiteur détecté: '{delimiter}' pour {file_name}")
        
        # Essayer différents encodages
        encodings = ['utf-8', 'latin-1', 'iso-8859-1', 'windows-1252']
        df = None
        
        for encoding in encodings:
            try:
                df = pd.read_csv(file_path, delimiter=delimiter, encoding=encoding, low_memory=False)
                logging.info(f"✅ Fichier {file_name} lu avec encodage: {encoding}")
                break
            except UnicodeDecodeError:
                continue
            except Exception as e:
                logging.warning(f"⚠️  Erreur avec {encoding} pour {file_name}: {e}")
                continue
        
        if df is None:
            try:
                df = pd.read_csv(file_path, delimiter=delimiter, encoding='utf-8', errors='ignore', low_memory=False)
                logging.info(f"✅ Fichier {file_name} lu avec gestion d'erreurs")
            except Exception as e:
                logging.error(f"❌ Impossible de lire le fichier {file_name}: {e}")
                return 0
        
        logging.info(f"📊 {file_name}: {len(df):,} lignes, {len(df.columns)} colonnes")
        
        # Nettoyer les noms de colonnes
        df.columns = [clean_column_name(c) for c in df.columns]
        
        # Nettoyer et convertir les valeurs
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'], errors='coerce')
        
        numeric_columns = ['purchase_price', 'selling_price', 'total_price', 'quantity']
        for col in numeric_columns:
            if col in df.columns:
                if col == 'quantity':
                    df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0).astype(int)
                else:
                    df[col] = pd.to_numeric(
                        df[col].astype(str).str.replace(',', '.'),
                        errors='coerce'
                    ).fillna(0.0)
        
        # Insérer les données
        inserted = insert_dataframe_batches(df, conn, table_name, batch_size=2000, file_name=file_name)
        
        if inserted > 0:
            # Marquer le fichier comme importé
            state_manager.mark_file_as_imported(file_path, inserted)
        
        return inserted
        
    except Exception as e:
        logging.error(f"❌ Erreur lors du traitement de {file_path}: {e}")
        return 0

# ==========================================================
# 🚀 TRAITEMENT PRINCIPAL
# ==========================================================
def process_all_csv_files(force_reimport=False):
    """Traite tous les fichiers CSV du dossier datasets"""
    
    # Configuration du logging
    logger, log_path = setup_logging()
    state_manager = ImportStateManager(STATE_FILE)
    
    # Réinitialiser si demandé
    if force_reimport:
        state_manager.reset_state()
        logger.info("🔄 Réimport forcé activé")
    
    total_inserted = 0
    conn = None
    
    try:
        # 1. Trouver tous les fichiers CSV
        logger.info("🔍 Recherche des fichiers CSV...")
        all_csv_files = find_csv_files(DATASETS_DIR)
        
        if not all_csv_files:
            logger.error("❌ Aucun fichier CSV trouvé dans le dossier datasets/")
            return
        
        # 2. Filtrer les nouveaux fichiers
        new_files, skipped_files = filter_new_files(all_csv_files, state_manager)
        
        if not new_files:
            logger.info("🎉 Aucun nouveau fichier à importer!")
            
            # Afficher les statistiques
            stats = state_manager.get_import_statistics()
            logger.info(f"📈 Statistiques actuelles: {stats['total_files_imported']} fichiers, {stats['total_rows_imported']:,} lignes")
            return
        
        # 3. Connexion SQL Server
        logger.info("🔌 Connexion à la base de données...")
        conn = setup_database_connection(SERVER, DATABASE, USERNAME, PASSWORD)
        cursor = conn.cursor()
        
        # 4. Créer la table si besoin
        create_table_if_not_exists(cursor, TABLE_NAME)
        conn.commit()
        
        # 5. Traiter chaque nouveau fichier
        logger.info(f"🚀 Début de l'insertion de {len(new_files)} nouveaux fichiers...")
        
        for i, csv_file in enumerate(new_files, 1):
            logger.info(f"\n{'='*60}")
            logger.info(f"📦 Fichier {i}/{len(new_files)}: {os.path.basename(csv_file)}")
            logger.info(f"{'='*60}")
            
            inserted = process_single_csv_file(csv_file, conn, TABLE_NAME, state_manager)
            total_inserted += inserted
            
            # Pause périodique
            if i % 5 == 0 and i < len(new_files):
                logger.info("💤 Pause de 2 secondes...")
                import time
                time.sleep(2)
        
        # 6. Afficher le résumé final
        logger.info(f"\n{'='*60}")
        logger.info(f"🎉 TRAITEMENT TERMINÉ!")
        logger.info(f"{'='*60}")
        logger.info(f"📊 Nouveaux fichiers traités: {len(new_files)}")
        logger.info(f"📈 Nouvelles lignes insérées: {total_inserted:,}")
        logger.info(f"⏭️  Fichiers ignorés (déjà importés): {len(skipped_files)}")
        logger.info(f"💾 Table cible: {TABLE_NAME}")
        logger.info(f"📄 Fichier de log: {log_path}")
        
        # 7. Vérifier le total dans la base
        try:
            cursor = conn.cursor()
            cursor.execute(f"SELECT COUNT(*) FROM {TABLE_NAME}")
            total_in_db = cursor.fetchone()[0]
            logger.info(f"🔢 Total dans la base de données: {total_in_db:,} lignes")
        except Exception as e:
            logger.error(f"⚠️  Impossible de compter les lignes dans la table: {e}")
        
        # 8. Sauvegarder les statistiques finales
        stats = state_manager.get_import_statistics()
        logger.info(f"📈 Statistiques globales: {stats['total_files_imported']} fichiers, {stats['total_rows_imported']:,} lignes")
        
    except Exception as e:
        logger.error(f"❌ Erreur générale: {e}")
    finally:
        if conn:
            conn.close()
            logger.info("🔌 Connexion fermée")

# ==========================================================
# ▶️ POINT D'ENTRÉE
# ==========================================================
if __name__ == "__main__":
    import argparse
    
    # Gestion des arguments en ligne de commande
    parser = argparse.ArgumentParser(description="Import de fichiers CSV vers SQL Server")
    parser.add_argument('--force', action='store_true', help='Forcer le réimport de tous les fichiers')
    parser.add_argument('--reset', action='store_true', help='Réinitialiser l état d import')
    
    args = parser.parse_args()
    
    print("🚀 DÉMARRAGE DE L'IMPORT MASSIF AVEC CONTRÔLE")
    print("📁 Dossier source: datasets/")
    print(f"🗃️  Table destination: {TABLE_NAME}")
    print("📊 Système de logging et contrôle d'état activé")
    print("=" * 60)
    
    if args.reset:
        state_manager = ImportStateManager(STATE_FILE)
        state_manager.reset_state()
        print("✅ État d'import réinitialisé")
    
    process_all_csv_files(force_reimport=args.force)