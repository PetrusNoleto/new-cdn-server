import time
import shutil
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from rembg import remove

# --- CONFIGURAÇÃO DE CAMINHOS ---

# BASE_DIR é a pasta onde este script está localizado
# Ex: .../workers/remove_image_background/
BASE_DIR = Path(__file__).resolve().parent

# PROJECT_ROOT sobe dois níveis para chegar à raiz do projeto
# Ex: .../new-cdn-server/
PROJECT_ROOT = BASE_DIR.parent.parent

# Define a pasta do servidor Node.js
SERVER_DIR = PROJECT_ROOT / "server"

# --- Pastas de Armazenamento ---
# Aponte para a pasta de imagens dentro do servidor
STORAGE_DIR = SERVER_DIR / "storage" / "images"

# Agora, defina as pastas específicas para o processo do worker
# ⚠️ O worker vai OBSERVAR esta pasta.
INPUT_DIR = STORAGE_DIR / "uploads"

# O worker vai SALVAR os resultados nesta pasta.
OUTPUT_DIR = STORAGE_DIR / "nobg"

# O worker vai MOVER os arquivos originais para esta pasta.
PROCESSED_DIR = STORAGE_DIR / "processed"

# --- Garante que todas as pastas necessárias existam ---
INPUT_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)
PROCESSED_DIR.mkdir(exist_ok=True)

print(f"✅ Pastas configuradas com sucesso.")
print(f"📂 Observando a pasta: {INPUT_DIR}")
print("---")


def process_image(image_path: Path):
    """
    Função principal que remove o fundo de uma imagem.
    """
    if not image_path.is_file():
        return

    print(f"⏳ Processando imagem: {image_path.name}")
    
    # Define o nome do arquivo de saída (sempre como .png para suportar transparência)
    output_filename = f"{image_path.stem}.png"
    output_path = OUTPUT_DIR / output_filename
    
    try:
        # Abre a imagem de entrada
        with open(image_path, "rb") as f_in:
            input_bytes = f_in.read()
        
        # Remove o fundo usando rembg
        output_bytes = remove(input_bytes)
        
        # Salva o resultado
        with open(output_path, "wb") as f_out:
            f_out.write(output_bytes)
            
        print(f"✅ Sucesso! Imagem salva em: {output_path}")

        # Move o arquivo original para a pasta 'processed'
        shutil.move(image_path, PROCESSED_DIR / image_path.name)
        print(f"📁 Imagem original movida para: {PROCESSED_DIR / image_path.name}")

    except Exception as e:
        shutil.move(image_path, PROCESSED_DIR / image_path.name)
        print(f"❌ Erro ao processar {image_path.name}: {e}")
    
    print("---")


class ImageHandler(FileSystemEventHandler):
    """
    Handler que reage a eventos no sistema de arquivos.
    """
    def on_created(self, event):
        """
        Chamado quando um novo arquivo é criado na pasta 'input'.
        """
        if not event.is_directory:
            process_image(Path(event.src_path))


if __name__ == "__main__":
    # Configura e inicia o observador do watchdog
    event_handler = ImageHandler()
    observer = Observer()
    observer.schedule(event_handler, str(INPUT_DIR), recursive=False)
    
    print("🚀 Worker iniciado. Aguardando novas imagens... (Pressione Ctrl+C para parar)")
    observer.start()
    
    try:
        # Mantém o script rodando em loop
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        # Para o observador de forma limpa ao pressionar Ctrl+C
        observer.stop()
        print("\n🛑 Worker parado.")
    
    observer.join()