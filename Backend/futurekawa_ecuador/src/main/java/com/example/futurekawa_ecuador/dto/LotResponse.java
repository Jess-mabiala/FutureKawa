package com.example.futurekawa_ecuador.dto;


import com.example.futurekawa_ecuador.entity.Lot;
import com.example.futurekawa_ecuador.enums.LotStatus;
import lombok.Data;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Data
public class LotResponse {
    private Integer id;
    private String lotCode;
    private Integer warehouseId;
    private String warehouseName;
    private String exploitationName;
    private LocalDate storageDate;
    private LotStatus status;
    private String notes;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public static LotResponse from(Lot lot) {
        LotResponse dto = new LotResponse();
        dto.id               = lot.getId();
        dto.lotCode          = lot.getLotCode();
        dto.warehouseId      = lot.getWarehouse().getId();
        dto.warehouseName    = lot.getWarehouse().getName();
        dto.exploitationName = lot.getWarehouse().getExploitation().getName();
        dto.storageDate      = lot.getStorageDate();
        dto.status           = lot.getStatus();
        dto.notes            = lot.getNotes();
        dto.createdAt        = lot.getCreatedAt();
        dto.updatedAt        = lot.getUpdatedAt();
        return dto;
    }
}
