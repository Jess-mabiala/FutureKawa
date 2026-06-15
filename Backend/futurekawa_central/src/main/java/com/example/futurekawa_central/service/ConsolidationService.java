package com.example.futurekawa_central.service;

import com.example.futurekawa_central.config.CountryConfig;
import com.example.futurekawa_central.dto.AlertResponse;
import com.example.futurekawa_central.dto.CountryDataResponse;
import com.example.futurekawa_central.dto.LotResponse;
import com.example.futurekawa_central.dto.SensorReadingResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConsolidationService {

    private final RestTemplate restTemplate;
    private final CountryConfig countryConfig;

    // ── Tous les lots d'un pays ──────────────────────────────
    public List<LotResponse> getLotsForCountry(String country) {
        String url = countryConfig.getUrlForCountry(country) + "/api/lots";
        try {
            ResponseEntity<List<LotResponse>> response = restTemplate.exchange(
                url, HttpMethod.GET, null,
                new ParameterizedTypeReference<>() {}
            );
            return response.getBody() != null ? response.getBody() : Collections.emptyList();
        } catch (RestClientException e) {
            log.warn("Backend {} indisponible : {}", country, e.getMessage());
            return Collections.emptyList();
        }
    }

    // ── Lots d'un entrepôt d'un pays ────────────────────────
    public List<LotResponse> getLotsByWarehouse(String country, Integer warehouseId) {
        String url = countryConfig.getUrlForCountry(country)
                + "/api/lots/warehouse/" + warehouseId;
        try {
            ResponseEntity<List<LotResponse>> response = restTemplate.exchange(
                url, HttpMethod.GET, null,
                new ParameterizedTypeReference<>() {}
            );
            return response.getBody() != null ? response.getBody() : Collections.emptyList();
        } catch (RestClientException e) {
            log.warn("Backend {} indisponible : {}", country, e.getMessage());
            return Collections.emptyList();
        }
    }

    // ── Alertes actives d'un pays ───────────────────────────
    public List<AlertResponse> getAlertsForCountry(String country) {
        String url = countryConfig.getUrlForCountry(country) + "/api/alerts";
        try {
            ResponseEntity<List<AlertResponse>> response = restTemplate.exchange(
                url, HttpMethod.GET, null,
                new ParameterizedTypeReference<>() {}
            );
            return response.getBody() != null ? response.getBody() : Collections.emptyList();
        } catch (RestClientException e) {
            log.warn("Backend {} indisponible : {}", country, e.getMessage());
            return Collections.emptyList();
        }
    }

    // ── Derniers relevés IoT d'un entrepôt ──────────────────
    public List<SensorReadingResponse> getLatestReadings(String country, Integer warehouseId) {
        String url = countryConfig.getUrlForCountry(country)
                + "/api/readings/warehouse/" + warehouseId + "/latest";
        try {
            ResponseEntity<List<SensorReadingResponse>> response = restTemplate.exchange(
                url, HttpMethod.GET, null,
                new ParameterizedTypeReference<>() {}
            );
            return response.getBody() != null ? response.getBody() : Collections.emptyList();
        } catch (RestClientException e) {
            log.warn("Backend {} indisponible : {}", country, e.getMessage());
            return Collections.emptyList();
        }
    }

    // ── Consolidation globale : tous les pays ────────────────
    public List<CountryDataResponse> getGlobalConsolidation() {
        List<CountryDataResponse> result = new ArrayList<>();

        for (String country : countryConfig.getCountryNames()) {
            try {
                List<LotResponse> lots       = getLotsForCountry(country);
                List<AlertResponse> alerts   = getAlertsForCountry(country);

                result.add(new CountryDataResponse(country, "ok", lots, alerts, Collections.emptyList()));
            } catch (Exception e) {
                log.error("Erreur consolidation pays {} : {}", country, e.getMessage());
                result.add(new CountryDataResponse(country, "unavailable",
                        Collections.emptyList(), Collections.emptyList(), Collections.emptyList()));
            }
        }

        return result;
    }

    // ── Toutes les alertes actives tous pays confondus ───────
    public List<AlertResponse> getAllActiveAlerts() {
        List<AlertResponse> allAlerts = new ArrayList<>();
        for (String country : countryConfig.getCountryNames()) {
            List<AlertResponse> countryAlerts = getAlertsForCountry(country);
            // Ajoute le nom du pays dans les détails pour identifier la source
            countryAlerts.forEach(a -> {
                if (a.getDetails() != null) {
                    a.setDetails("[" + country + "] " + a.getDetails());
                }
            });
            allAlerts.addAll(countryAlerts);
        }
        return allAlerts;
    }

    // ── Tous les lots tous pays confondus (triés FIFO) ───────
    public List<LotResponse> getAllLots() {
        List<LotResponse> allLots = new ArrayList<>();
        for (String country : countryConfig.getCountryNames()) {
            allLots.addAll(getLotsForCountry(country));
        }
        // Tri FIFO global par date de stockage
        allLots.sort((a, b) -> {
            if (a.getStorageDate() == null) return 1;
            if (b.getStorageDate() == null) return -1;
            return a.getStorageDate().compareTo(b.getStorageDate());
        });
        return allLots;
    }
}