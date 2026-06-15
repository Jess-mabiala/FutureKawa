package com.example.futurekawa_central.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
public class SensorReadingResponse {
    private Long id;
    private Integer warehouseId;
    private BigDecimal temperature;
    private BigDecimal humidity;
    private Boolean isAnomaly;
    private OffsetDateTime recordedAt;
}