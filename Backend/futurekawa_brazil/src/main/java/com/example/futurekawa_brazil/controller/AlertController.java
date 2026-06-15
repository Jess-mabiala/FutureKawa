package com.example.futurekawa_brazil.controller;

import com.example.futurekawa_brazil.dto.AlertResponse;
import com.example.futurekawa_brazil.service.AlertService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
