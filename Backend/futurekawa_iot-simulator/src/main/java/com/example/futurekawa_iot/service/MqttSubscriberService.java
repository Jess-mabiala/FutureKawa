package com.example.futurekawa_iot.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.example.futurekawa_iot.mqtt.SensorPayload;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.paho.client.mqttv3.*;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Ce service est OPTIONNEL si le backend Brésil a déjà son propre
 * listener MQTT (MqttListenerService côté backend-brazil).
 *
 * Il sert de filet de sécurité / debug : il écoute tous les topics
 * et les republie vers les APIs REST des backends pays via HTTP.
 *
 * Si les backends pays écoutent déjà MQTT directement, désactive ce
 * service pour éviter une double écriture (voir application.properties).
 */
@Slf4j
@Service
public class MqttSubscriberService {

    @Value("${mqtt.broker.url}")
    private String brokerUrl;

    @Value("${simulator.subscriber.enabled:true}")
    private boolean subscriberEnabled;

    private MqttClient subscriberClient;

    private final Map<String, String> countryApis = Map.of(
        "Brazil",   "http://localhost:3001",
        "Ecuador",  "http://localhost:3002",
        "Colombia", "http://localhost:3003"
    );

    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule());
    private final RestTemplate restTemplate = new RestTemplate();

    @PostConstruct
    public void subscribe() {
        if (!subscriberEnabled) {
            log.info("MqttSubscriberService désactivé (les backends pays écoutent déjà MQTT directement)");
            return;
        }

        try {
            subscriberClient = new MqttClient(brokerUrl,
                    "futurekawa-subscriber", new MemoryPersistence());
            MqttConnectOptions options = new MqttConnectOptions();
            options.setCleanSession(true);
            options.setAutomaticReconnect(true);
            subscriberClient.connect(options);

            subscriberClient.subscribe("futurekawa/#", this::onMessage);
            log.info("Abonné au topic : futurekawa/#");

        } catch (MqttException e) {
            log.error("Erreur abonnement MQTT : {}", e.getMessage());
        }
    }

    private void onMessage(String topic, MqttMessage message) {
        try {
            String json = new String(message.getPayload());
            SensorPayload payload = objectMapper.readValue(json, SensorPayload.class);

            log.info("Message reçu [{}] : {}°C / {}% (anomaly={})",
                    topic, payload.getTemperature(), payload.getHumidity(), payload.isAnomaly());

            persistToBackend(payload);

        } catch (Exception e) {
            log.error("Erreur traitement message MQTT [{}] : {}", topic, e.getMessage());
        }
    }

    private void persistToBackend(SensorPayload payload) {
        String apiUrl = countryApis.get(payload.getCountry());
        if (apiUrl == null) {
            log.warn("Pays inconnu : {}", payload.getCountry());
            return;
        }

        try {
            // Endpoint d'ingestion à exposer côté backend pays (voir note ci-dessous)
            String url = apiUrl + "/api/readings/ingest";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = Map.of(
                "deviceMac",    payload.getDeviceId(),
                "warehouseId",  payload.getWarehouseId(),
                "temperature",  payload.getTemperature(),
                "humidity",     payload.getHumidity()
            );

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            restTemplate.postForEntity(url, request, String.class);

            log.info("Données persistées → {} warehouse {}", payload.getCountry(), payload.getWarehouseId());

        } catch (Exception e) {
            log.warn("Impossible de persister pour {} : {}", payload.getCountry(), e.getMessage());
        }
    }

    @PreDestroy
    public void disconnect() {
        try {
            if (subscriberClient != null && subscriberClient.isConnected()) {
                subscriberClient.disconnect();
            }
        } catch (MqttException e) {
            log.error("Erreur déconnexion subscriber : {}", e.getMessage());
        }
    }
}
