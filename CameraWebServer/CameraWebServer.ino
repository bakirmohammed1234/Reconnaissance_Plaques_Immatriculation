#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <WebServer.h>

// WiFi config
const char* ssid = "La_Fibre_dOrange_8D58";
const char* password = "DFCY4DY9GHH7A6Z2HK";

// FastAPI URL
const char* serverUrl = "http://192.168.11.104:8000/upload";

// Serveur web sur port 80
WebServer server(80);

void startCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = 5;
  config.pin_d1 = 18;
  config.pin_d2 = 19;
  config.pin_d3 = 21;
  config.pin_d4 = 36;
  config.pin_d5 = 39;
  config.pin_d6 = 34;
  config.pin_d7 = 35;
  config.pin_xclk = 0;
  config.pin_pclk = 22;
  config.pin_vsync = 25;
  config.pin_href = 23;
  config.pin_sscb_sda = 26;
  config.pin_sscb_scl = 27;
  config.pin_pwdn = 32;
  config.pin_reset = -1;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.frame_size = FRAMESIZE_QVGA;
  config.jpeg_quality = 12;
  config.fb_count = 1;

  esp_camera_init(&config);
}

void takePhoto() {
  Serial.println("Déclenchement de la prise de photo...");
  
  if (WiFi.status() == WL_CONNECTED) {
    camera_fb_t * fb = esp_camera_fb_get();
    if (fb) {
      HTTPClient http;
      http.begin(serverUrl);
      http.addHeader("Content-Type", "image/jpeg");

      int httpResponseCode = http.POST(fb->buf, fb->len);
      Serial.print("Code HTTP : ");
      Serial.println(httpResponseCode);

      http.end();
      esp_camera_fb_return(fb);
      
      if (httpResponseCode == 200) {
        Serial.println("Photo envoyée avec succès !");
      } else {
        Serial.println("Erreur lors de l'envoi de la photo");
      }
    } else {
      Serial.println("Erreur: Impossible de capturer l'image");
    }
  } else {
    Serial.println("Erreur: WiFi non connecté");
  }
}

void handleTakePhoto() {
  Serial.println("Requête reçue pour prendre une photo");
  takePhoto();
  server.send(200, "text/plain", "Photo prise et envoyée");
}

void handleStatus() {
  server.send(200, "text/plain", "Arduino OK - Camera prête");
}

void handleRoot() {
  String html = "<html><body>";
  html += "<h1>ESP32-CAM Control</h1>";
  html += "<p><a href='/take-photo'><button style='font-size:20px;padding:10px;'>Prendre une photo</button></a></p>";
  html += "<p><a href='/status'><button>Status</button></a></p>";
  html += "</body></html>";
  server.send(200, "text/html", html);
}

void setup() {
  Serial.begin(115200);
  
  // Connexion WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("WiFi connecté");
  Serial.print("Adresse IP: ");
  Serial.println(WiFi.localIP());

  // Initialiser la caméra
  startCamera();

  // Configuration des routes du serveur web
  server.on("/", handleRoot);
  server.on("/take-photo", handleTakePhoto);
  server.on("/status", handleStatus);
  
  // Démarrer le serveur
  server.begin();
  Serial.println("Serveur web démarré sur le port 80");
  Serial.println("Utilisez /take-photo pour déclencher une photo");
  
  delay(2000);  // Attendre que la caméra soit prête
}

void loop() {
  server.handleClient();  // Gérer les requêtes web
  delay(10);
}