package com.example.futurekawa_iot.mqtt;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.paho.client.mqttv3.*;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class MqttPublisher {

    @Value("${mqtt.broker.url}")
    private String brokerUrl;

    @Value("${mqtt.broker.clientId}")
    private String clientId;

    private MqttClient mqttClient;
    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule());

    @PostConstruct
    public void connect() {
        try {
            mqttClient = new MqttClient(brokerUrl, clientId, new MemoryPersistence());
            MqttConnectOptions options = new MqttConnectOptions();
            options.setCleanSession(true);
            options.setAutomaticReconnect(true);
            options.setConnectionTimeout(10);
            mqttClient.connect(options);
            log.info("Connecté au broker MQTT : {}", brokerUrl);
        } catch (MqttException e) {
            log.error("Impossible de se connecter au broker MQTT : {}", e.getMessage());
        }
    }

    public void publish(String topic, SensorPayload payload) {
        try {
            String json = objectMapper.writeValueAsString(payload);
            MqttMessage message = new MqttMessage(json.getBytes());
            message.setQos(1);
            mqttClient.publish(topic, message);
            log.info("MQTT → [{}] : temp={}°C, hum={}% anomaly={}",
                    topic, payload.getTemperature(), payload.getHumidity(), payload.isAnomaly());
        } catch (Exception e) {
            log.error("Erreur publication MQTT : {}", e.getMessage());
        }
    }

    @PreDestroy
    public void disconnect() {
        try {
            if (mqttClient != null && mqttClient.isConnected()) {
                mqttClient.disconnect();
                log.info("Déconnecté du broker MQTT");
            }
        } catch (MqttException e) {
            log.error("Erreur déconnexion MQTT : {}", e.getMessage());
        }
    }
}
