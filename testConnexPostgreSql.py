import psycopg2
from psycopg2 import OperationalError

def test_postgres_connection(host, port, database, user, password):
    """
    Teste la connexion à une base PostgreSQL et affiche le statut.
    """
    print("🔄 Tentative de connexion à PostgreSQL...")
    try:
        conn = psycopg2.connect(
            host=host,
            port=port,
            dbname=database,
            user=user,
            password=password
        )
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        print(f"✅ Connexion réussie à PostgreSQL !\n   Version : {version[0]}")
        cursor.close()
        conn.close()
        print("🔒 Connexion fermée proprement.")
        return True
    except OperationalError as e:
        print("❌ Erreur de connexion à PostgreSQL :")
        print(e)
        return False


# ================================
# 🔧 Paramètres de connexion
# ================================
HOST = "198.23.53.53"          # ton serveur PostgreSQL
PORT = 5432                    # port (par défaut 5432)
DATABASE = "wotadji_deeppromo"
USER = "wotadji_deeppromo"
PASSWORD = "Chniadma04@"   # ⚠️ à sécuriser (ex : variables d’environnement)

# ================================
# 🧪 Test de connexion
# ================================
if __name__ == "__main__":
    success = test_postgres_connection(HOST, PORT, DATABASE, USER, PASSWORD)
    if success:
        print("✅ Test terminé avec succès.")
    else:
        print("⚠️ Impossible d’établir la connexion.")
