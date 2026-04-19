#include <esp_now.h>
#include <WiFi.h>
#include <HardwareSerial.h>

// Initialize Hardware Serial Port 1 for the UM980
HardwareSerial GNSS_Serial(1); 
#define RX_PIN 16
#define TX_PIN 17
#define GNSS_BAUD 115200

// --- THE FIX: NEW ESP-NOW RECEIVE CALLBACK SIGNATURE ---
// Notice the first parameter is now "const esp_now_recv_info_t *info"
void OnDataRecv(const esp_now_recv_info_t *info, const uint8_t *incomingData, int len) {
  
  // Push the raw RTCM binary data straight into the UM980's RX pin.
  Serial.write(incomingData, len);
  
}

void setup() {
  Serial.begin(115200);
  
  // Start the UART connection to UM980 #2
  GNSS_Serial.begin(GNSS_BAUD, SERIAL_8N1, RX_PIN, TX_PIN);
  
  // Initialize Wi-Fi in Station mode (required for ESP-NOW)
  WiFi.mode(WIFI_STA);

  // Initialize ESP-NOW
  if (esp_now_init() != ESP_OK) {
    Serial.println("Error initializing ESP-NOW");
    return;
  }
  
  // Register the receive callback function
  esp_now_register_recv_cb(OnDataRecv);
  
  Serial.println("Rover ESP32 Initialized. Listening for Base Station RTCM...");
}

void loop() {
  // Check if the UM980 has sent any NMEA text back to the ESP32
  if (GNSS_Serial.available()) {
    
    // Read the character
    char incomingChar = GNSS_Serial.read();
    
    // Print it to your computer's Serial Monitor
    Serial.write(incomingChar);
    
    // (In the final step, instead of printing to the screen, 
    // we will feed this character into TinyGPS++ to extract 
    // the X/Y coordinates for your Kalman filter)
  }
}