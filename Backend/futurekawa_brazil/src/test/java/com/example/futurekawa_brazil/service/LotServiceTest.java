package com.example.futurekawa_brazil.service;

import com.example.futurekawa_brazil.dto.LotRequest;
import com.example.futurekawa_brazil.dto.LotResponse;
import com.example.futurekawa_brazil.entity.Exploitation;
import com.example.futurekawa_brazil.entity.Lot;
import com.example.futurekawa_brazil.entity.Warehouse;
import com.example.futurekawa_brazil.enums.LotStatus;
import com.example.futurekawa_brazil.repository.LotRepository;
import com.example.futurekawa_brazil.repository.WarehouseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("LotService")
class LotServiceTest {

    @Mock LotRepository lotRepository;
    @Mock WarehouseRepository warehouseRepository;
    @InjectMocks LotService lotService;

    private Warehouse warehouse;

@BeforeEach
void setUp() {
    Exploitation exploitation = new Exploitation();
    exploitation.setId(1);
    exploitation.setName("Exploitation Amazônia");

    warehouse = new Warehouse();
    warehouse.setId(1);
    warehouse.setName("Entrepôt BR-1");
    warehouse.setExploitation(exploitation); // ← ajouter cette ligne
}

    private Lot makeLot(Integer id, String code, LocalDate date, LotStatus status) {
        Lot lot = new Lot();
        lot.setId(id);
        lot.setLotCode(code);
        lot.setWarehouse(warehouse);
        lot.setStorageDate(date);
        lot.setStatus(status);
        lot.setCreatedAt(OffsetDateTime.now());
        lot.setUpdatedAt(OffsetDateTime.now());
        return lot;
    }

    @Test
    @DisplayName("Crée un lot avec le statut CONFORME par défaut")
    void createLotWithCompliantStatus() {
        LotRequest request = new LotRequest();
        request.setLotCode("BR-LOT-001");
        request.setWarehouseId(1);
        request.setStorageDate(LocalDate.now());

        Lot saved = makeLot(1, "BR-LOT-001", LocalDate.now(), LotStatus.compliant);

        when(warehouseRepository.findById(1)).thenReturn(Optional.of(warehouse));
        when(lotRepository.save(any())).thenReturn(saved);

        LotResponse response = lotService.create(request);

        assertThat(response.getStatus()).isEqualTo(LotStatus.compliant);
        assertThat(response.getLotCode()).isEqualTo("BR-LOT-001");
    }

    @Test
    @DisplayName("Retourne les lots d'un entrepôt triés par date croissante (FIFO)")
    void getByWarehouseReturnsFifoOrder() {
        Lot older = makeLot(1, "BR-LOT-001", LocalDate.of(2024, 1, 1), LotStatus.compliant);
        Lot newer = makeLot(2, "BR-LOT-002", LocalDate.of(2024, 6, 1), LotStatus.compliant);

        when(lotRepository.findByWarehouseIdOrderByStorageDateAsc(1))
                .thenReturn(List.of(older, newer));

        List<LotResponse> result = lotService.getByWarehouse(1);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getStorageDate()).isBefore(result.get(1).getStorageDate());
    }

    @Test
    @DisplayName("marque les lots de plus de 365 jours comme EXPIRES")
    void markExpiredLotsUpdatesStatus() {
        Lot oldLot = makeLot(1, "BR-LOT-OLD", LocalDate.now().minusDays(400), LotStatus.compliant);

        when(lotRepository.findExpiredLots(any())).thenReturn(List.of(oldLot));
        when(lotRepository.saveAll(any())).thenReturn(List.of(oldLot));

        int count = lotService.markExpiredLots();

        assertThat(count).isEqualTo(1);
        assertThat(oldLot.getStatus()).isEqualTo(LotStatus.expired);
    }

    @Test
    @DisplayName("Met à jour le statut d'un lot")
    void updateStatusChangesLotStatus() {
        Lot lot = makeLot(1, "BR-LOT-001", LocalDate.now(), LotStatus.compliant);

        when(lotRepository.findById(1)).thenReturn(Optional.of(lot));
        when(lotRepository.save(any())).thenReturn(lot);

        LotResponse response = lotService.updateStatus(1, LotStatus.alert);

        assertThat(response.getStatus()).isEqualTo(LotStatus.alert);
    }
}
