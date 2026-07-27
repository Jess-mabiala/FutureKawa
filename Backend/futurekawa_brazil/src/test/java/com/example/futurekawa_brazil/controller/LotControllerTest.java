package com.example.futurekawa_brazil.controller;

import com.example.futurekawa_brazil.dto.LotRequest;
import com.example.futurekawa_brazil.dto.LotResponse;
import com.example.futurekawa_brazil.enums.LotStatus;
import com.example.futurekawa_brazil.service.LotService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(LotController.class)
@DisplayName("LotController")
class LotControllerTest {

    @Autowired MockMvc mockMvc;
    @MockBean LotService lotService;

    private ObjectMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
    }

    private LotResponse makeLotResponse(Integer id, String code, LotStatus status) {
        LotResponse r = new LotResponse();
        r.setId(id);
        r.setLotCode(code);
        r.setWarehouseId(1);
        r.setWarehouseName("Entrepôt BR-1");
        r.setExploitationName("Exploitation Amazônia");
        r.setStorageDate(LocalDate.of(2024, 1, 1));
        r.setStatus(status);
        r.setCreatedAt(OffsetDateTime.now());
        r.setUpdatedAt(OffsetDateTime.now());
        return r;
    }

    @Test
    @DisplayName("POST /api/lots retourne 201 avec le lot créé")
    void createLotReturns201() throws Exception {
        LotRequest request = new LotRequest();
        request.setLotCode("BR-LOT-001");
        request.setWarehouseId(1);
        request.setStorageDate(LocalDate.now());

        when(lotService.create(any())).thenReturn(makeLotResponse(1, "BR-LOT-001", LotStatus.compliant));

        mockMvc.perform(post("/api/lots")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.lotCode").value("BR-LOT-001"))
                .andExpect(jsonPath("$.status").value("compliant"));
    }

    @Test
    @DisplayName("GET /api/lots retourne la liste complète")
    void getAllLotsReturns200() throws Exception {
        when(lotService.getAll()).thenReturn(List.of(
                makeLotResponse(1, "BR-LOT-001", LotStatus.compliant),
                makeLotResponse(2, "BR-LOT-002", LotStatus.compliant)
        ));

        mockMvc.perform(get("/api/lots"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    @DisplayName("GET /api/lots/warehouse/{id} retourne les lots FIFO")
    void getByWarehouseReturns200() throws Exception {
        when(lotService.getByWarehouse(1)).thenReturn(List.of(
                makeLotResponse(1, "BR-LOT-001", LotStatus.compliant)
        ));

        mockMvc.perform(get("/api/lots/warehouse/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].lotCode").value("BR-LOT-001"));
    }

    @Test
    @DisplayName("PATCH /api/lots/{id}/status met à jour le statut")
    void updateStatusReturns200() throws Exception {
        when(lotService.updateStatus(1, LotStatus.alert))
                .thenReturn(makeLotResponse(1, "BR-LOT-001", LotStatus.alert));

        mockMvc.perform(patch("/api/lots/1/status")
                        .param("status", "alert"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("alert"));
    }
}
