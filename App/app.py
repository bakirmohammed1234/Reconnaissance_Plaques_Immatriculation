from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse

app = FastAPI()

@app.post("/upload-image/")
async def upload_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        return JSONResponse(status_code=400, content={"error": "Le fichier doit être une image."})

    contents = await file.read()  # lis le contenu binaire de l'image
    filename = file.filename

    # Sauvegarder l'image sur le disque si besoin
    with open(f"uploaded_{filename}", "wb") as f:
        f.write(contents)

    return {"filename": filename, "type": file.content_type, "size": len(contents)}
