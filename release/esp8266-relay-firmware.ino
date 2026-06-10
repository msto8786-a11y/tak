/*
 * Industrial Control Lab Simulator - ESP8266 Firmware
 * 3-Channel Wi-Fi Relay Controller
 * 
 * Hardware:
 *   - NodeMCU ESP8266
 *   - 3-Channel Relay Module
 * 
 * Wiring:
 *   ESP8266    Relay Module
 *   --------   ------------
 *   3V3        VCC
 *   GND        GND
 *   D1 (GPIO5) IN1  (channel 1)
 *   D2 (GPIO4) IN2  (channel 2)
 *   D5 (GPIO14) IN3 (channel 3)
 * 
 * Endpoints (HTTP GET):
 *   /                  → status check
 *   /relay/on/1        → turn ON relay 1
 *   /relay/off/1       → turn OFF relay 1
 *   /relay/on/2        → turn ON relay 2  
 *   /relay/off/2       → turn OFF relay 2
 *   /relay/on/3        → turn ON relay 3
 *   /relay/off/3       → turn OFF relay 3
 *   /status            → JSON status of all channels
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>

// ===== Wi-Fi Configuration =====
const char* WIFI_SSID = "YOUR_WIFI_NAME";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";

// ===== Relay Pin Configuration =====
const int RELAY_PINS[3] = {D1, D2, D5};
const bool RELAY_ACTIVE_LOW = true;  // most relay modules are active-LOW

bool relayState[3] = {false, false, false};

ESP8266WebServer server(80);

void setRelay(int ch, bool on) {
  if (ch < 1 || ch > 3) return;
  relayState[ch - 1] = on;
  int level = RELAY_ACTIVE_LOW ? (on ? LOW : HIGH) : (on ? HIGH : LOW);
  digitalWrite(RELAY_PINS[ch - 1], level);
  Serial.printf("Relay %d -> %s\n", ch, on ? "ON" : "OFF");
}

void sendCORS() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

void handleRelay(int ch, bool on) {
  setRelay(ch, on);
  sendCORS();
  String body = "{\"channel\":" + String(ch) + ",\"state\":\"" + (on ? "on" : "off") + "\"}";
  server.send(200, "application/json", body);
}

void handleStatus() {
  sendCORS();
  String body = "{\"ip\":\"" + WiFi.localIP().toString() + "\",\"channels\":[";
  for (int i = 0; i < 3; i++) {
    body += "{\"id\":" + String(i + 1) + ",\"state\":\"" + (relayState[i] ? "on" : "off") + "\"}";
    if (i < 2) body += ",";
  }
  body += "]}";
  server.send(200, "application/json", body);
}

void handleRoot() {
  sendCORS();
  server.send(200, "text/plain", "ESP8266 Relay Controller OK. IP: " + WiFi.localIP().toString());
}

void handleOptions() {
  sendCORS();
  server.send(204);
}

void setup() {
  Serial.begin(115200);
  Serial.println("\nIndustrial Control Lab - ESP8266 Relay");

  // Initialize relay pins
  for (int i = 0; i < 3; i++) {
    pinMode(RELAY_PINS[i], OUTPUT);
    digitalWrite(RELAY_PINS[i], RELAY_ACTIVE_LOW ? HIGH : LOW); // start OFF
  }

  // Connect Wi-Fi
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("Connecting to ");
  Serial.println(WIFI_SSID);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 60) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.print("Connected. Local IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWi-Fi connect FAILED. Restarting...");
    ESP.restart();
  }

  // Register routes
  server.on("/", handleRoot);
  server.on("/status", handleStatus);
  server.on("/relay/on/1",  []() { handleRelay(1, true);  });
  server.on("/relay/off/1", []() { handleRelay(1, false); });
  server.on("/relay/on/2",  []() { handleRelay(2, true);  });
  server.on("/relay/off/2", []() { handleRelay(2, false); });
  server.on("/relay/on/3",  []() { handleRelay(3, true);  });
  server.on("/relay/off/3", []() { handleRelay(3, false); });

  // CORS preflight
  server.onNotFound([]() {
    if (server.method() == HTTP_OPTIONS) {
      handleOptions();
    } else {
      sendCORS();
      server.send(404, "text/plain", "Not Found");
    }
  });

  server.begin();
  Serial.println("HTTP server started on port 80");
}

void loop() {
  server.handleClient();

  // Reconnect if Wi-Fi is lost
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi lost. Reconnecting...");
    WiFi.reconnect();
    delay(2000);
  }
}
