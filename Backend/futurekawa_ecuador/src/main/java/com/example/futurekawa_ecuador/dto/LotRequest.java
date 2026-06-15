package com.example.futurekawa_ecuador.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;

@Data
public class LotRequest {
    @NotBlank
    public String lotCode;
    @NotNull
    public Integer warehouseId;
    @NotNull
    public LocalDate storageDate;
    public String notes;
}