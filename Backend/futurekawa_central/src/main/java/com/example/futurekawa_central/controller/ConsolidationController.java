package com.example.futurekawa_central.controller;

import com.example.futurekawa_central.dto.AlertResponse;  
import com.example.futurekawa_central.dto.CountryDataResponse;
import com.example.futurekawa_central.dto.LotResponse;
import com.example.futurekawa_central.dto.SensorReadingResponse;
import com.example.futurekawa_central.service.ConsolidationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/central")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ConsolidationController {

    private final ConsolidationService consolidationService;

    // GET /api/central/consolidation — vue globale tous pays
    @GetMapping("/consolidation")
    public ResponseEntity<List<CountryDataResponse>> getGlobalConsolidation() {
        return ResponseEntity.ok(consolidationService.getGlobalConsolidation());
    }

    // GET /api/central/lots — tous les lots tous pays (FIFO)
    @GetMapping("/lots")
    public ResponseEntity<List<LotResponse>> getAllLots() {
        return ResponseEntity.ok(consolidationService.getAllLots());
    }

    // GET /api/central/lots/{country} — lots d'un pays spécifique
    @GetMapping("/lots/{country}")
    public ResponseEntity<List<LotResponse>> getLotsByCountry(@PathVariable String country) {
        return ResponseEntity.ok(consolidationService.getLotsForCountry(country));
    }

    // GET /api/central/lots/{country}/warehouse/{warehouseId} — lots d'un entrepôt
    @GetMapping("/lots/{country}/warehouse/{warehouseId}")
    public ResponseEntity<List<LotResponse>> getLotsByWarehouse(
            @PathVariable String country,
            @PathVariable Integer warehouseId) {
        return ResponseEntity.ok(consolidationService.getLotsByWarehouse(country, warehouseId));
    }

    // GET /api/central/alerts — toutes les alertes actives tous pays
    @GetMapping("/alerts")
    public ResponseEntity<List<AlertResponse>> getAllAlerts() {
        return ResponseEntity.ok(consolidationService.getAllActiveAlerts());
    }

    // GET /api/central/alerts/{country} — alertes d'un pays
    @GetMapping("/alerts/{country}")
    public ResponseEntity<List<AlertResponse>> getAlertsByCountry(@PathVariable String country) {
        return ResponseEntity.ok(consolidationService.getAlertsForCountry(country));
    }

    // GET /api/central/readings/{country}/warehouse/{warehouseId} — derniers relevés IoT
    @GetMapping("/readings/{country}/warehouse/{warehouseId}")
    public ResponseEntity<List<SensorReadingResponse>> getLatestReadings(
            @PathVariable String country,
            @PathVariable Integer warehouseId) {
        return ResponseEntity.ok(consolidationService.getLatestReadings(country, warehouseId));
    }
}