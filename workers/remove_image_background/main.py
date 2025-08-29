import time
import shutil
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from rembg import new_session, remove

# --- CONFIGURAÇÃO DE CAMINHOS ---

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent.parent
SERVER_DIR = PROJECT_ROOT / "server"
STORAGE_DIR = SERVER_DIR / "storage" / "images"
INPUT_DIR = STORAGE_DIR / "uploads"
OUTPUT_DIR = STORAGE_DIR / "nobg"
PROCESSED_DIR = STORAGE_DIR / "processed"

INPUT_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)
PROCESSED_DIR.mkdir(exist_ok=True)

print(f"✅ Pastas configuradas com sucesso.")
print(f"📂 Observando a pasta: {INPUT_DIR}")
print("---")

# --- Otimização: Crie a sessão do modelo uma única vez ---
# Isso evita carregar o modelo de IA da memória toda vez, melhorando muito o desempenho.
SESSION = new_session("isnet-general-use")

def process_image(image_path: Path):
    """
    Função principal que remove o fundo de uma imagem.
    """
    if not image_path.is_file():
        return

    print(f"⏳ Processando imagem: {image_path.name}")
    
    output_filename = f"{image_path.stem}.png"
    output_path = OUTPUT_DIR / output_filename
    
    input_bytes = None
    try:
        # Abre a imagem de entrada com o 'with' para garantir que seja fechada
        with open(image_path, "rb") as f_in:
            input_bytes = f_in.read()
        
        # Se o arquivo estiver vazio, pare aqui.
        if not input_bytes:
            print(f"⚠️ Arquivo '{image_path.name}' está vazio. Ignorando.")
            return

        # --- CORREÇÃO 3: Argumento 'model_name' removido ---
        # A sessão (SESSION) já contém o modelo.
        output_bytes = remove(
            input_bytes,
            session=SESSION, # Usa a sessão pré-carregada
            alpha_matting=True,
            alpha_matting_foreground_threshold=240,
            alpha_matting_background_threshold=10,
            alpha_matting_erode_size=5
        )
        
        with open(output_path, "wb") as f_out:
            f_out.write(output_bytes)
            
        print(f"✅ Sucesso! Imagem salva em: {output_path}")

    except Exception as e:
        print(f"❌ Erro ao processar {image_path.name}: {e}")
    
    finally:
        # --- CORREÇÃO 2: Garante que o arquivo seja movido ---
        # O bloco 'finally' executa sempre, mesmo se houver erro,
        # limpando a pasta de entrada.
        try:
            shutil.move(image_path, PROCESSED_DIR / image_path.name)
            if input_bytes: # Só imprima se o arquivo foi lido
                 print(f"📁 Imagem original movida para: {PROCESSED_DIR / image_path.name}")
        except FileNotFoundError:
             # O arquivo pode já ter sido movido por outra thread, apenas ignore.
             pass
        except Exception as e:
            print(f"🔥 Erro crítico ao mover {image_path.name}: {e}")

    print("---")


class ImageHandler(FileSystemEventHandler):
    """
    Handler que reage a eventos no sistema de arquivos.
    """
    def on_created(self, event):
        """
        Chamado quando um novo arquivo é criado na pasta 'input'.
        """
        if event.is_directory:
            return

        # --- CORREÇÃO 1: Adiciona espera e verificação ---
        # Espera um pouco para garantir que o arquivo terminou de ser escrito.
        time.sleep(1) 
        
        file_path = Path(event.src_path)
        try:
            # Verifica se o arquivo ainda existe e não está vazio
            if file_path.exists() and file_path.stat().st_size > 0:
                process_image(file_path)
        except FileNotFoundError:
            # O arquivo foi processado e movido tão rápido que não existe mais.
            # Isso é normal, não precisa fazer nada.
            pass


if __name__ == "__main__":
    event_handler = ImageHandler()
    observer = Observer()
    observer.schedule(event_handler, str(INPUT_DIR), recursive=False)
    
    print("🚀 Worker iniciado. Aguardando novas imagens... (Pressione Ctrl+C para parar)")
    observer.start()
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        print("\n🛑 Worker parado.")
    
    observer.join()