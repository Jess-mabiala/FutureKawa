package com.example.futurekawa_colombia.controller;

import com.example.futurekawa_colombia.dto.AlertResponse;
import com.example.futurekawa_colombia.enums.AlertType;
import com.example.futurekawa_colombia.service.AlertService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.OffsetDateTime;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AlertController.class)
@DisplayName("AlertController")
class AlertControllerTest {

    @Autowired MockMvc mockMvc;
    @MockBean AlertService alertService;

    private AlertResponse makeAlert(Integer id, AlertType type) {
        AlertResponse r = new AlertResponse();
        r.setId(id);
        r.setWarehouseId(1);
        r.setWarehouseName("Entrepôt BR-1");
        r.setType(type);
        r.setDetails("Valeur hors plage");
        r.setTriggeredAt(OffsetDateTime.now());
        r.setEmailSent(false);
        return r;
    }

    @Test
    @DisplayName("GET /api/alerts retourne les alertes actives")
    void getActiveAlertsReturns200() throws Exception {
        when(alertService.getActiveAlerts()).thenReturn(List.of(
                makeAlert(1, AlertType.temperature),
                makeAlert(2, AlertType.humidity)
        ));

        mockMvc.perform(get("/api/alerts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    @DisplayName("GET /api/alerts/warehouse/{id} retourne les alertes de l'entrepôt")
    void getByWarehouseReturns200() throws Exception {
        when(alertService.getByWarehouse(1)).thenReturn(List.of(
                makeAlert(1, AlertType.temperature)
        ));

        mockMvc.perform(get("/api/alerts/warehouse/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].type").value("temperature"));
    }

    @Test
    @DisplayName("PATCH /api/alerts/{id}/resolve retourne l'alerte résolue")
    void resolveAlertReturns200() throws Exception {
        AlertResponse resolved = makeAlert(1, AlertType.temperature);
        resolved.setResolvedAt(OffsetDateTime.now());

        when(alertService.resolve(1)).thenReturn(resolved);

        mockMvc.perform(patch("/api/alerts/1/resolve"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resolvedAt").isNotEmpty());
    }
}