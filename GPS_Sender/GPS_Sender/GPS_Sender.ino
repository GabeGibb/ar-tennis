#include <HardwareSerial.h>
#include <esp_now.h>
#include <WiFi.h>

// Explicitly call upon Hardware Serial Port 1 to avoid IDE conflicts
HardwareSerial GNSS_Serial(1);

// FIX 1: Added [] and replaced colons with commas
uint8_t receiverAddress[] = { 0x34, 0x98, 0x7A, 0x73, 0x75, 0xB8 };

esp_now_peer_info_t peerInfo;

// The UART pins on the ESP32 connected to your UM980
#define RX_PIN 16
#define TX_PIN 17
#define GNSS_BAUD 115200  // The default baud rate for the UM980

void OnDataSent(const uint8_t *mac_addr, esp_now_send_status_t status) {}

// --- ESP-NOW Buffering Variables ---
uint8_t gnssBuffer[250];                // Array to hold bytes (250 is the max ESP-NOW payload)
size_t bufferIndex = 0;                 // Tracks how many bytes are currently in the buffer
unsigned long lastSendTime = 0;         // Tracks the last time we sent a packet
const unsigned long sendInterval = 20;  // 20ms timer

void setup() {
  // 1. Start the USB serial connection to your computer
  Serial.begin(115200);
  WiFi.mode(WIFI_STA);

  // Initialize ESP-NOW
  if (esp_now_init() != ESP_OK) {
    Serial.println("Error initializing ESP-NOW");
    return;
  }
  delay(1000);  // Give the serial monitor a moment to open

  // FIX 2: Cast the callback to bypass Core v3.x signature changes
  esp_now_register_send_cb((esp_now_send_cb_t)OnDataSent);
  
  memcpy(peerInfo.peer_addr, receiverAddress, 6);
  peerInfo.channel = 0;
  peerInfo.encrypt = false;  // Set to true if you want to add a custom key later

  if (esp_now_add_peer(&peerInfo) != ESP_OK) {
    Serial.println("Failed to add peer");
    return;
  }

  Serial.println("ESP-NOW Sender Ready. Type in the Serial Monitor...");
  Serial.println("ESP32 Initialized. Configuring UM980...");

  // 2. Start the UART connection to the GNSS module
  GNSS_Serial.begin(GNSS_BAUD, SERIAL_8N1, RX_PIN, TX_PIN);
  delay(1000);  // Give the GNSS module a moment to boot up

  // 3. Send the configuration commands iteratively
  // Every command must end with \r\n for the UM980 to accept it
  GNSS_Serial.print("gpgsa 0.1\r\n");
  delay(50);
  GNSS_Serial.print("gpgga 0.1\r\n");
  delay(50);
  GNSS_Serial.print("gpgll 0.1\r\n");
  delay(50);
  GNSS_Serial.print("gpgsv 0.4\r\n");
  delay(50);
  GNSS_Serial.print("gpvtg 0.1\r\n");
  delay(50);
  GNSS_Serial.print("gprmc 0.1\r\n");
  delay(50);

  Serial.println("Configuration complete! Streaming NMEA data:");
  Serial.println("--------------------------------------------------");
}

void loop() {
  // 1. Listen to the UM980 and pipe the data into our buffer
  while (GNSS_Serial.available()) {
    // Read the incoming byte from the UM980
    char incomingByte = GNSS_Serial.read();

    // Add the byte to the buffer
    gnssBuffer[bufferIndex] = incomingByte;
    bufferIndex++;

    // SAFETY CATCH: If the buffer hits the 250-byte ESP-NOW limit,
    // force a send immediately, even if 20ms hasn't passed!
    if (bufferIndex >= 250) {
      esp_now_send(receiverAddress, gnssBuffer, bufferIndex);
      bufferIndex = 0;          // Reset the buffer counter
      lastSendTime = millis();  // Reset the timer
    }
  }

  // 2. The 20ms Timer
  if (millis() - lastSendTime >= sendInterval) {

    // Only send if there is actually data waiting in the buffer
    if (bufferIndex > 0) {
      esp_err_t result = esp_now_send(receiverAddress, gnssBuffer, bufferIndex);

      // Reset the buffer counter so we start filling from the beginning again
      bufferIndex = 0;
    }

    // Reset the timer, ready for the next 20ms window
    lastSendTime = millis();
  }
}