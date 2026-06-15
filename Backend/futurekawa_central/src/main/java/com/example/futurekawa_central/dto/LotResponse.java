package com.example.futurekawa_central.dto;

import lombok.Data;
//import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

// ── Lot ──────────────────────────────────────────────────────
@Data
public class LotResponse {
    private Integer id;
    private String lotCode;
    private Integer warehouseId;
    private String warehouseName;
    private String exploitationName;
    private LocalDate storageDate;
    private String status;
    private String notes;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}