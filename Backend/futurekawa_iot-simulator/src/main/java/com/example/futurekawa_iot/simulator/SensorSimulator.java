package com.example.futurekawa_iot.simulator;

import com.example.futurekawa_iot.config.CountryProfile;
import com.example.futurekawa_iot.mqtt.MqttPublisher;
import com.example.futurekawa_iot.mqtt.SensorPayload;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.Random;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Component
@RequiredArgsConstructor
public class SensorSimulator {

    private final MqttPublisher mqttPublisher;
    private final Random random = new Random();
    private final AtomicInteger measureCount = new AtomicInteger(0);

    @Value("${simulator.anomaly.enabled}")
    private boolean anomalyEnabled;

    @Value("${simulator.anomaly.frequency}")
    private int anomalyFrequency;

    // Publie un relevé pour chaque entrepôt de chaque pays
    @Scheduled(fixedDelayString = "${simulator.interval}")
    public void simulate() {
        int count = measureCount.incrementAndGet();
        boolean forceAnomaly = anomalyEnabled && (count % anomalyFrequency == 0);

        log.info("═══ Cycle #{} {} ═══", count, forceAnomaly ? "[ANOMALIE SIMULÉE]" : "");

        for (CountryProfile country : CountryProfile.all()) {
            for (Integer warehouseId : country.getWarehouseIds()) {
                SensorPayload payload = generateReading(country, warehouseId, forceAnomaly);
                String topic = country.getMqttTopicPrefix() + "/warehouse/" + warehouseId;
                mqttPublisher.publish(topic, payload);
            }
        }
    }

    private SensorPayload generateReading(CountryProfile country, Integer warehouseId,
                                           boolean forceAnomaly) {
        double temp;
        double humidity;

        if (forceAnomaly) {
            // Génère une valeur hors plage (±5 à ±8 degrés)
            double tempOffset = (random.nextBoolean() ? 1 : -1) * (5 + random.nextDouble() * 3);
            double humOffset  = (random.nextBoolean() ? 1 : -1) * (4 + random.nextDouble() * 4);
            temp     = round(country.getIdealTemp() + tempOffset);
            humidity = round(country.getIdealHumidity() + humOffset);
        } else {
            // Génère une valeur normale avec légère variation (±1.5°C, ±1%)
            temp     = round(country.getIdealTemp()     + (random.nextDouble() * 3 - 1.5));
            humidity = round(country.getIdealHumidity() + (random.nextDouble() * 2 - 1));
        }

        // Clamp pour rester dans des valeurs réalistes
        temp     = Math.max(0, Math.min(50, temp));
        humidity = Math.max(0, Math.min(100, humidity));

        boolean anomaly = country.isAnomaly(temp, humidity);

        String deviceId = "SIM-" + country.getName().substring(0, 2).toUpperCase()
                        + "-W" + warehouseId;

        return new SensorPayload(
            country.getName(),
            warehouseId,
            deviceId,
            temp,
            humidity,
            anomaly,
            OffsetDateTime.now().toString()
        );
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
