package com.example.futurekawa_colombia.controller;


import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.futurekawa_colombia.dto.LotRequest;
import com.example.futurekawa_colombia.dto.LotResponse;
import com.example.futurekawa_colombia.enums.LotStatus;
import com.example.futurekawa_colombia.service.LotService;

import java.util.List;

@RestController
@RequestMapping("/api/lots")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class LotController {

    private final LotService lotService;

    @PostMapping
    public ResponseEntity<LotResponse> create(@Valid @RequestBody LotRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(lotService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<LotResponse>> getAll() {
        return ResponseEntity.ok(lotService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LotResponse> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(lotService.getById(id));
    }

    @GetMapping("/warehouse/{warehouseId}")
    public ResponseEntity<List<LotResponse>> getByWarehouse(@PathVariable Integer warehouseId) {
        return ResponseEntity.ok(lotService.getByWarehouse(warehouseId));
    }

    @GetMapping("/exploitation/{exploitationId}")
    public ResponseEntity<List<LotResponse>> getByExploitation(@PathVariable Integer exploitationId) {
        return ResponseEntity.ok(lotService.getByExploitation(exploitationId));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<LotResponse> updateStatus(@PathVariable Integer id,
                                                     @RequestParam LotStatus status) {
        return ResponseEntity.ok(lotService.updateStatus(id, status));
    }
}