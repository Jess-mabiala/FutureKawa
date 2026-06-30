package com.example.futurekawa_iot.mqtt;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SensorPayload {
    private String country;
    private Integer warehouseId;
    private String deviceId;        // ex: "ESP32-BR-01"
    private double temperature;
    private double humidity;
    private boolean anomaly;
    private String recordedAt;      // ISO 8601
}