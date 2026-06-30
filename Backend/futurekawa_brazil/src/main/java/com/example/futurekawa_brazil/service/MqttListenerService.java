package com.example.futurekawa_brazil.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.example.futurekawa_brazil.dto.MqttSensorPayload;
import com.example.futurekawa_brazil.entity.IoTDevice;
import com.example.futurekawa_brazil.entity.Warehouse;
import com.example.futurekawa_brazil.repository.IoTDeviceRepository;
import com.example.futurekawa_brazil.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.messaging.Message;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class MqttListenerService {

    private final SensorReadingService sensorReadingService;
    private final IoTDeviceRepository ioTDeviceRepository;
    private final WarehouseRepository warehouseRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @ServiceActivator(inputChannel = "mqttInputChannel")
    @Transactional
    public void handleMessage(Message<?> message) {
        try {
            String payloadJson = message.getPayload().toString();
            MqttSensorPayload payload = objectMapper.readValue(payloadJson, MqttSensorPayload.class);

            log.info("Message MQTT reçu — device={}, warehouse={}, temp={}, hum={}",
                    payload.getDeviceId(), payload.getWarehouseId(),
                    payload.getTemperature(), payload.getHumidity());

            Warehouse warehouse = warehouseRepository.findById(payload.getWarehouseId())
                    .orElseThrow(() -> new RuntimeException(
                            "Warehouse introuvable : " + payload.getWarehouseId()));

            IoTDevice device = ioTDeviceRepository.findByMacAddress(payload.getDeviceId())
                    .orElseGet(() -> {
                        IoTDevice newDevice = new IoTDevice();
                        newDevice.setMacAddress(payload.getDeviceId());
                        newDevice.setWarehouse(warehouse);
                        newDevice.setFirmwareVersion("simulator-1.0");
                        log.info("Nouveau device IoT enregistré : {}", payload.getDeviceId());
                        return ioTDeviceRepository.save(newDevice);
                    });

            device.setLastSeen(OffsetDateTime.now());
            ioTDeviceRepository.save(device);

            sensorReadingService.save(
                    device,
                    warehouse,
                    BigDecimal.valueOf(payload.getTemperature()),
                    BigDecimal.valueOf(payload.getHumidity())
            );

        } catch (Exception e) {
            log.error("Erreur traitement message MQTT : {}", e.getMessage(), e);
        }
    }
}