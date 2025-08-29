import requests
import time
from pathlib import Path
from datetime import datetime
import logging
from rembg import remove
from PIL import Image
import io
import os

# --- Configuração ---
# URL base da sua API. Altere se o endereço ou a porta forem diferentes.
API_BASE_URL = "http://localhost:4500" # Exemplo, ajuste para a sua URL correta
# Endpoint para buscar imagens na fila.
API_QUEUE_ENDPOINT = "/api/v1/images/quenq/remove/bg"
# Endpoint para atualizar a imagem (será complementado com o ID).
API_UPDATE_ENDPOINT = "/api/v1/images/"

# Diretório base onde o worker irá armazenar os arquivos.
STORAGE_DIR = Path(__file__).parent.resolve()

# Diretório para salvar as imagens baixadas.
INPUT_DIR = STORAGE_DIR / "downloads"
# Diretório para salvar as imagens com fundo removido.
PROCESSED_DIR = STORAGE_DIR / "processed"

# Frequência (em segundos) que o worker irá verificar a API.
# 3600 segundos = 1 hora
POLL_INTERVAL = 3600

# Configuração básica de logging para acompanhar o que o worker está fazendo.
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Funções do Worker ---

def setup_directories():
    """Cria os diretórios de entrada e de processados se eles não existirem."""
    try:
        INPUT_DIR.mkdir(parents=True, exist_ok=True)
        PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
        logging.info(f"Diretório de downloads: {INPUT_DIR}")
        logging.info(f"Diretório de processados: {PROCESSED_DIR}")
    except OSError as e:
        logging.error(f"Erro ao criar diretórios: {e}")
        exit()

def fetch_images_from_queue() -> list:
    """Busca a lista de imagens a serem processadas na API."""
    try:
        url = f"{API_BASE_URL.rstrip('/')}{API_QUEUE_ENDPOINT}"
        logging.info(f"Buscando imagens na fila: {url}")
        response = requests.get(url)
        response.raise_for_status()
        # MODIFICAÇÃO AQUI: Acessa a chave "data" do JSON.
        return response.json().get("data", [])
    except requests.exceptions.RequestException as e:
        logging.error(f"Erro ao conectar com a API para buscar a fila: {e}")
        return []

def download_image(image_url: str, image_id: str) -> Path | None:
    """Baixa a imagem da URL fornecida e a salva no diretório de entrada."""
    try:
        if not image_url.startswith(('http://', 'https://')):
            image_url = f"http://{image_url.lstrip('/')}"
            
        logging.info(f"Baixando imagem: {image_url}")
        response = requests.get(image_url, stream=True)
        response.raise_for_status()
        
        file_extension = Path(image_url.split('?')[0]).suffix or '.jpg'
        file_path = INPUT_DIR / f"{image_id}{file_extension}"
        
        with open(file_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        logging.info(f"Imagem salva em: {file_path}")
        return file_path
    except requests.exceptions.RequestException as e:
        logging.error(f"Falha ao baixar a imagem {image_url}: {e}")
        return None

def remove_background(input_path: Path, image_id: str) -> Path | None:
    """Remove o fundo da imagem e a salva no diretório de processados."""
    try:
        logging.info(f"Processando remoção de fundo para: {input_path.name}")
        
        with open(input_path, 'rb') as i:
            input_data = i.read()
            output_data = remove(input_data)
            output_image = Image.open(io.BytesIO(output_data))
            
            output_path = PROCESSED_DIR / f"{image_id}.png"
            output_image.save(output_path, 'PNG')
            
            logging.info(f"Imagem com fundo removido salva em: {output_path}")
            return output_path
            
    except Exception as e:
        logging.error(f"Erro ao remover o fundo da imagem {input_path.name}: {e}")
        return None

def update_image_status(image_id: str, processed_image_path: Path) -> bool:
    """Envia a imagem processada (PUT) para a API e retorna True em caso de sucesso."""
    try:
        update_url = f"{API_BASE_URL.rstrip('/')}{API_UPDATE_ENDPOINT.rstrip('/')}/{image_id}"
        background_removed_url = f"/static/processed/{processed_image_path.name}"
        
        payload = {
            "processed": True,
            "backgroundRemovedIn": datetime.utcnow().isoformat() + "Z",
            "backgroundRemovedUrl": background_removed_url
        }

        with open(processed_image_path, 'rb') as f:
            files = {'file': (processed_image_path.name, f, 'image/png')}
            
            logging.info(f"Enviando imagem processada e atualizando status para o ID: {image_id}")
            response = requests.put(update_url, data=payload, files=files)
            
            response.raise_for_status()
            logging.info(f"Status da imagem {image_id} atualizado com sucesso!")
            return True

    except requests.exceptions.RequestException as e:
        logging.error(f"Erro ao atualizar o status da imagem {image_id}: {e}")
        return False
    except IOError as e:
        logging.error(f"Erro ao ler o arquivo de imagem processado {processed_image_path}: {e}")
        return False

def cleanup_files(image_id: str):
    """Remove os arquivos de imagem das pastas de downloads e processados."""
    logging.info(f"Limpando arquivos para o ID: {image_id}")
    
    # Procura e remove o arquivo da pasta de processados
    try:
        processed_file = PROCESSED_DIR / f"{image_id}.png"
        if processed_file.exists():
            processed_file.unlink()
            logging.info(f"Removido: {processed_file}")
    except OSError as e:
        logging.error(f"Erro ao remover arquivo processado: {e}")

    # Procura e remove o arquivo da pasta de downloads (pode ter qualquer extensão)
    try:
        # Usa glob para encontrar o arquivo de entrada, já que a extensão pode variar
        input_files = list(INPUT_DIR.glob(f"{image_id}.*"))
        if input_files:
            input_files[0].unlink()
            logging.info(f"Removido: {input_files[0]}")
    except OSError as e:
        logging.error(f"Erro ao remover arquivo de download: {e}")

# --- Loop Principal do Worker ---

def main():
    """Função principal que executa o loop do worker."""
    logging.info("Iniciando o worker...")
    setup_directories()
    
    while True:
        images_to_process = fetch_images_from_queue()
        
        if not images_to_process:
            logging.info(f"Nenhuma imagem na fila. Próxima verificação em 1 hora.")
        
        for image_data in images_to_process:
            image_id = image_data.get("id")
            image_url = image_data.get("url")
            
            if not image_id or not image_url:
                logging.warning(f"Item da fila inválido, faltando 'id' ou 'url': {image_data}")
                continue

            logging.info(f"--- Verificando Imagem ID: {image_id} ---")
            
            processed_path = PROCESSED_DIR / f"{image_id}.png"
            
            # Procura pelo arquivo de entrada correspondente ao ID
            input_path_list = list(INPUT_DIR.glob(f"{image_id}.*"))
            input_path = input_path_list[0] if input_path_list else None

            # LÓGICA DE DECISÃO
            # 1. Se a imagem já foi processada, apenas tente enviar o update.
            if processed_path.exists():
                logging.info(f"Imagem já processada encontrada para ID {image_id}. Tentando reenviar o status.")
                if update_image_status(image_id, processed_path):
                    cleanup_files(image_id)
                continue

            # 2. Se a imagem foi baixada mas não processada, processe-a.
            elif input_path and input_path.exists():
                logging.info(f"Imagem já baixada encontrada para ID {image_id}. Iniciando processamento.")
                current_processed_path = remove_background(input_path, image_id)
                if current_processed_path:
                    if update_image_status(image_id, current_processed_path):
                        cleanup_files(image_id)
                continue

            # 3. Se a imagem não existe localmente, faça o processo completo.
            else:
                logging.info(f"Nova imagem ID {image_id}. Iniciando processo completo.")
                downloaded_path = download_image(image_url, image_id)
                if downloaded_path:
                    current_processed_path = remove_background(downloaded_path, image_id)
                    if current_processed_path:
                        if update_image_status(image_id, current_processed_path):
                            cleanup_files(image_id)
                continue

        time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logging.info("Worker interrompido pelo usuário.")