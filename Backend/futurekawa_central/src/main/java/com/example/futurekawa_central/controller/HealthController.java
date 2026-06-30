package com.example.futurekawa_central.controller;

import com.example.futurekawa_central.config.CountryConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/central/health")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173", allowedHeaders = "*")
public class HealthController {

    private final RestTemplate restTemplate;
    private final CountryConfig countryConfig;

    // GET /api/central/health — statut de chaque backend pays
    @GetMapping
    public ResponseEntity<Map<String, String>> checkHealth() {
        Map<String, String> status = new LinkedHashMap<>();
        status.put("central", "ok");

        for (Map.Entry<String, String> entry : countryConfig.getAllCountries().entrySet()) {
            String country = entry.getKey();
            String url = entry.getValue() + "/api/lots";
            try {
                restTemplate.getForEntity(url, String.class);
                status.put(country, "ok");
            } catch (Exception e) {
                log.warn("Backend {} indisponible", country);
                status.put(country, "unavailable");
            }
        }

        return ResponseEntity.ok(status);
    }
}