package com.example.futurekawa_colombia.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.futurekawa_colombia.dto.AlertResponse;
import com.example.futurekawa_colombia.service.AlertService;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AlertController {

    private final AlertService alertService;

    @GetMapping
    public ResponseEntity<List<AlertResponse>> getActive() {
        return ResponseEntity.ok(alertService.getActiveAlerts());
    }

    @GetMapping("/warehouse/{warehouseId}")
    public ResponseEntity<List<AlertResponse>> getByWarehouse(@PathVariable Integer warehouseId) {
        return ResponseEntity.ok(alertService.getByWarehouse(warehouseId));
    }

    @PatchMapping("/{id}/resolve")
    public ResponseEntity<AlertResponse> resolve(@PathVariable Integer id) {
        return ResponseEntity.ok(alertService.resolve(id));
    }
}
