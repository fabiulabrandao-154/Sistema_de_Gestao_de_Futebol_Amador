import os
from pymongo import MongoClient

# Use a variável de ambiente para segurança (aquela que apareceu no seu terminal)
# Se preferir testar direto, substitua pelo link com a senha:
uri = "mongodbmongodb+srv://fabiulabrandao15_db_user:futgestao2026@cluster0.cislst7.mongodb.net/?appName=Cluster0"

def get_database():
    try:
        client = MongoClient(uri)
        # O ping serve para testar se a conexão está ativa
        client.admin.command('ping')
        print("✅ Conectado ao MongoDB com sucesso!")
        
        # Retorna o banco de dados que você vai usar (ex: fut_gestao)
        return client['fut_gestao']
    except Exception as e:
        print(f"❌ Erro ao conectar: {e}")

# Para usar nos seus outros arquivos:
db = get_database()