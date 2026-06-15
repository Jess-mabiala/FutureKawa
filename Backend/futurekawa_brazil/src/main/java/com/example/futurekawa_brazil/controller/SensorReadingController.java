package com.example.futurekawa_brazil.controller;

import com.example.futurekawa_brazil.dto.SensorReadingResponse;
import com.example.futurekawa_brazil.service.SensorReadingService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/readings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SensorReadingController {

    private final SensorReadingService sensorReadingService;

    @GetMapping("/warehouse/{warehouseId}/latest")
    public ResponseEntity<List<SensorReadingResponse>> getLatest(@PathVariable Integer warehouseId) {
        return ResponseEntity.ok(sensorReadingService.getLatest(warehouseId));
    }

    @GetMapping("/warehouse/{warehouseId}/history")
    public ResponseEntity<List<SensorReadingResponse>> getHistory(
            @PathVariable Integer warehouseId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to) {
        return ResponseEntity.ok(sensorReadingService.getHistory(warehouseId, from, to));
    }
}
