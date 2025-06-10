from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import uuid
import requests
import shutil
from model.recognizer import LicensePlateRecognizer

app = FastAPI()

# Configuration CORS pour React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # URLs React
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Path("images").mkdir(exist_ok=True)
extra = {}  # initialise la variable globale
latest_image_path = None  # Pour stocker le chemin de la dernière photo

# Configuration Arduino
ARDUINO_IP = "192.168.11.108"  # Remplace par l'IP de ton Arduino
ARDUINO_PORT = 80

# Servir les images statiques
app.mount("/images", StaticFiles(directory="images"), name="images")


@app.post("/upload")
async def upload_image(request: Request):
    client_ip = request.client.host
    print(f"Requête reçue depuis {client_ip}")
    global extra, latest_image_path

    data = await request.body()
    path = Path("images") / f"{uuid.uuid4()}.jpg"

    with path.open("wb") as f:
        f.write(data)

    # Copier comme "latest.jpg" pour React
    latest_path = Path("images") / "latest.jpg"
    shutil.copy2(path, latest_path)
    latest_image_path = str(latest_path)

    model = LicensePlateRecognizer()
    image = model.load_image(str(path))
    extra = model.text_extraction(0.2)
    print("Texte extrait:", extra)

    return {"status": "ok", "path": str(path), "latest_path": str(latest_path)}


@app.get("/extraction")
def getText():
    return extra


@app.post("/trigger-photo")
async def trigger_photo():
    """
    Endpoint pour déclencher la prise de photo sur l'Arduino
    """
    try:
        # Envoie une requête GET à l'Arduino pour déclencher la photo
        response = requests.get(f"http://{ARDUINO_IP}:{ARDUINO_PORT}/take-photo", timeout=10)

        if response.status_code == 200:
            return {"status": "success", "message": "Photo déclenchée avec succès"}
        else:
            raise HTTPException(status_code=500, detail=f"Erreur Arduino: {response.status_code}")

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Impossible de contacter l'Arduino: {str(e)}")


@app.get("/status")
def get_status():
    """
    Vérifie si l'Arduino est accessible
    """
    try:
        response = requests.get(f"http://{ARDUINO_IP}:{ARDUINO_PORT}/status", timeout=5)
        return {"arduino_status": "connected", "arduino_response": response.text}
    except:
        return {"arduino_status": "disconnected"}


@app.get("/latest-image")
def get_latest_image():
    """
    Retourne les informations de la dernière image
    """
    global latest_image_path
    if latest_image_path and Path(latest_image_path).exists():
        return {
            "path": latest_image_path,
            "url": f"/images/latest.jpg",
            "exists": True
        }
    return {"exists": False}


# Endpoint pour télécharger une image spécifique
@app.get("/download-image/{filename}")
async def download_image(filename: str):
    file_path = Path("images") / filename
    if file_path.exists():
        return FileResponse(file_path)
    raise HTTPException(status_code=404, detail="Image non trouvée")