package com.example.futurekawa_colombia.service;

import com.example.futurekawa_colombia.dto.AlertResponse;
import com.example.futurekawa_colombia.entity.*;
import com.example.futurekawa_colombia.enums.AlertType;
import com.example.futurekawa_colombia.repository.AlertRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AlertService")
class AlertServiceTest {

    @Mock AlertRepository alertRepository;
    @Mock JavaMailSender mailSender;
    @InjectMocks AlertService alertService;

    private Warehouse warehouse;
    private SensorReading reading;
    private Lot lot;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(alertService, "fromEmail", "test@futurekawa.com");

        Exploitation exploitation = new Exploitation();
        exploitation.setId(1);
        exploitation.setName("Exploitation Amazônia");

        warehouse = new Warehouse();
        warehouse.setId(1);
        warehouse.setName("Entrepôt BR-1");
        warehouse.setExploitation(exploitation);

        reading = new SensorReading();
        reading.setId(1L);
        reading.setWarehouse(warehouse);
        reading.setTemperature(BigDecimal.valueOf(35.0));
        reading.setHumidity(BigDecimal.valueOf(60.0));
        reading.setRecordedAt(OffsetDateTime.now());

        lot = new Lot();
        lot.setId(1);
        lot.setLotCode("BR-LOT-001");
        lot.setWarehouse(warehouse);
        lot.setStorageDate(LocalDate.now().minusDays(400));
    }

    @Test
    @DisplayName("Crée une alerte de type température")
    void raiseReadingAlertCreatesTemperatureAlert() {
        Alert saved = new Alert();
        saved.setId(1);
        saved.setWarehouse(warehouse);
        saved.setType(AlertType.temperature);
        saved.setTriggeredAt(OffsetDateTime.now());
        saved.setEmailSent(false);

        when(alertRepository.save(any())).thenReturn(saved);
        doThrow(new RuntimeException("SMTP indisponible")).when(mailSender).send(any(org.springframework.mail.SimpleMailMessage.class));

        alertService.raiseReadingAlert(reading, AlertType.temperature);

        verify(alertRepository, atLeast(1)).save(any());
    }

    @Test
    @DisplayName("Crée une alerte de péremption pour un lot > 365 jours")
    void raiseExpirationAlertCreatesAlert() {
        Alert saved = new Alert();
        saved.setId(2);
        saved.setWarehouse(warehouse);
        saved.setLot(lot);
        saved.setType(AlertType.expiration);
        saved.setTriggeredAt(OffsetDateTime.now());
        saved.setEmailSent(false);

        when(alertRepository.save(any())).thenReturn(saved);
        doThrow(new RuntimeException("SMTP indisponible")).when(mailSender).send(any(org.springframework.mail.SimpleMailMessage.class));

        alertService.raiseExpirationAlert(lot);

        verify(alertRepository, atLeast(1)).save(any());
    }

    @Test
    @DisplayName("Résout une alerte existante")
    void resolveAlertSetsResolvedAt() {
        Alert alert = new Alert();
        alert.setId(1);
        alert.setWarehouse(warehouse);
        alert.setType(AlertType.temperature);
        alert.setTriggeredAt(OffsetDateTime.now());

        when(alertRepository.findById(1)).thenReturn(Optional.of(alert));
        when(alertRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        AlertResponse response = alertService.resolve(1);

        assertThat(response.getResolvedAt()).isNotNull();
    }

    @Test
    @DisplayName("Retourne les alertes actives (non résolues)")
    void getActiveAlertsReturnsOnlyUnresolved() {
        Alert active = new Alert();
        active.setId(1);
        active.setWarehouse(warehouse);
        active.setType(AlertType.humidity);
        active.setTriggeredAt(OffsetDateTime.now());

        when(alertRepository.findByResolvedAtIsNullOrderByTriggeredAtDesc())
                .thenReturn(List.of(active));

        List<AlertResponse> result = alertService.getActiveAlerts();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getResolvedAt()).isNull();
    }

    @Test
    @DisplayName("L'envoi d'email échoue silencieusement sans planter l'application")
    void emailFailureDoesNotPropagateException() {
        Alert saved = new Alert();
        saved.setId(1);
        saved.setWarehouse(warehouse);
        saved.setType(AlertType.temperature);
        saved.setTriggeredAt(OffsetDateTime.now());
        saved.setEmailSent(false);

        when(alertRepository.save(any())).thenReturn(saved);
        doThrow(new RuntimeException("SMTP down")).when(mailSender).send(any(org.springframework.mail.SimpleMailMessage.class));

        // Ne doit pas lancer d'exception
        alertService.raiseReadingAlert(reading, AlertType.temperature);
    }
}
