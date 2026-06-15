package com.example.futurekawa_central.dto;

import lombok.Data;
import java.time.OffsetDateTime;

@Data
public class AlertResponse {
    private Integer id;
    private Integer warehouseId;
    private String warehouseName;
    private Integer lotId;
    private String lotCode;
    private String type;
    private String details;
    private OffsetDateTime triggeredAt;
    private OffsetDateTime resolvedAt;
    private Boolean emailSent;
}