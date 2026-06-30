package com.example.futurekawa_ecuador.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class MqttSensorPayload {
    private String country;
    private Integer warehouseId;
    private String deviceId;
    private Double temperature;
    private Double humidity;
    private boolean anomaly;
    private String recordedAt;
}