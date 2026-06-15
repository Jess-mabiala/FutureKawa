package com.example.futurekawa_central.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CountryDataResponse {
    private String country;
    private String status;           // "ok" ou "unavailable"
    private List<LotResponse> lots;
    private List<AlertResponse> alerts;
    private List<SensorReadingResponse> latestReadings;
}