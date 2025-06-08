import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
import yolov5
import easyocr
import cv2
import warnings
warnings.filterwarnings("ignore", category=FutureWarning)
import numpy as np
from fastapi import  UploadFile
class LicensePlateRecognizer:
    def __init__(self):
        self.__model =  yolov5.load('keremberke/yolov5n-license-plate')
        self.__model.conf = 0.5
        self.__model.iou = 0.45
        self.__model.agnostic = False
        self.__model.multi_label = False
        self.__model.max_det = 1000
        self.__reader = easyocr.Reader(['en', 'fr'], gpu=False)

    #def load_image(self, img_path):
        #self.__img = cv2.imread(img_path)
        #if self.__img is None:
            #raise ValueError(f"Image not found or unreadable: {img_path}")
        #return self.__img

    async def load_image(self, file: UploadFile):
        image_bytes = await file.read()
        nparr = np.frombuffer(image_bytes, np.uint8)
        self.__img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if self.__img is None:
            raise ValueError("Impossible de décoder l'image.")
    
    def predict(self):
        self.__result = self.__model(self.__img, size=640)
        self.__predictions = self.__result.pred[0]
        self.__boxes = self.__predictions[:, :4]
        print(f"Nombre de plaques détectées : {len(self.__result.pred[0])}")
        return self.__boxes
    
    def text_extraction(self, confidence_threshold):
        self.__boxes = self.predict()
        self.__confidence_threshold = confidence_threshold
        self.__best_text = None
        self.__best_conf = 0
        for i, box in enumerate(self.__boxes):
            self.__x1, self.__y1, self.__x2, self.__y2 = box.int()
            self.__cropped_plate = self.__img[self.__y1:self.__y2, self.__x1:self.__x2]
            self.__text_extracted = self.__reader.readtext(self.__cropped_plate)
            for detection in self.__text_extracted:
                text = detection[1]
                confidence = detection[2]
                if confidence > self.__confidence_threshold and 5 <= len(text) <= 10:
                    if confidence > self.__best_conf:
                        self.__best_text = text
                        self.__best_conf = confidence
        return {"Text": self.__best_text, "Confiance": self.__best_conf}
