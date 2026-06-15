package com.example.futurekawa_colombia.dto;

import lombok.Data;
import java.time.OffsetDateTime;

import com.example.futurekawa_colombia.entity.Alert;
import com.example.futurekawa_colombia.enums.AlertType;

@Data
public class AlertResponse {
    private Integer id;
    private Integer warehouseId;
    private String warehouseName;
    private Integer lotId;
    private String lotCode;
    private AlertType type;
    private String details;
    private OffsetDateTime triggeredAt;
    private OffsetDateTime resolvedAt;
    private Boolean emailSent;

    public static AlertResponse from(Alert a) {
        AlertResponse dto = new AlertResponse();
        dto.id            = a.getId();
        dto.warehouseId   = a.getWarehouse().getId();
        dto.warehouseName = a.getWarehouse().getName();
        dto.lotId         = a.getLot() != null ? a.getLot().getId() : null;
        dto.lotCode       = a.getLot() != null ? a.getLot().getLotCode() : null;
        dto.type          = a.getType();
        dto.details       = a.getDetails();
        dto.triggeredAt   = a.getTriggeredAt();
        dto.resolvedAt    = a.getResolvedAt();
        dto.emailSent     = a.getEmailSent();
        return dto;
    }
}