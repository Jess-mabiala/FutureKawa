package com.example.futurekawa_colombia.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

import com.example.futurekawa_colombia.entity.SensorReading;

@Data
public class SensorReadingResponse {
    private Long id;
    private Integer warehouseId;
    private BigDecimal temperature;
    private BigDecimal humidity;
    private Boolean isAnomaly;
    private OffsetDateTime recordedAt;

    public static SensorReadingResponse from(SensorReading r) {
        SensorReadingResponse dto = new SensorReadingResponse();
        dto.id          = r.getId();
        dto.warehouseId = r.getWarehouse().getId();
        dto.temperature = r.getTemperature();
        dto.humidity    = r.getHumidity();
        dto.isAnomaly   = r.getIsAnomaly();
        dto.recordedAt  = r.getRecordedAt();
        return dto;
    }
}