package com.example.futurekawa_ecuador.service;

import com.example.futurekawa_ecuador.dto.SensorReadingResponse;
import com.example.futurekawa_ecuador.entity.Country;
import com.example.futurekawa_ecuador.entity.IoTDevice;
import com.example.futurekawa_ecuador.entity.SensorReading;
import com.example.futurekawa_ecuador.entity.Warehouse;
import com.example.futurekawa_ecuador.enums.AlertType;
import com.example.futurekawa_ecuador.repository.CountryRepository;
import com.example.futurekawa_ecuador.repository.SensorReadingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("SensorReadingService — détection d'anomalie (Équateur)")
class SensorReadingServiceTest {

    @Mock SensorReadingRepository sensorReadingRepository;
    @Mock CountryRepository countryRepository;
    @Mock AlertService alertService;
    @InjectMocks SensorReadingService sensorReadingService;

    private Country ecuador;
    private Warehouse warehouse;
    private IoTDevice device;

    @BeforeEach
    void setUp() {
        // Équateur : idéal 31°C / 60%, tolérance ±3°C / ±2%
        ecuador = new Country();
        ecuador.setIdealTemp(BigDecimal.valueOf(31.0));
        ecuador.setIdealHumidity(BigDecimal.valueOf(60.0));
        ecuador.setTempTolerance(BigDecimal.valueOf(3.0));
        ecuador.setHumidityTolerance(BigDecimal.valueOf(2.0));

        warehouse = new Warehouse();
        warehouse.setId(1);

        device = new IoTDevice();
        device.setId(1);
        device.setWarehouse(warehouse);
    }

    @ParameterizedTest(name = "temp={0}°C, hum={1}% → anomalie={2}")
    @CsvSource({
        "31.0, 60.0, false",   // valeur idéale exacte
        "34.0, 60.0, false",   // limite haute temp (31+3)
        "34.1, 60.0, true",    // juste au-dessus → anomalie
        "27.9, 60.0, true",    // juste en dessous → anomalie
        "28.0, 60.0, false",   // limite basse (31-3)
        "31.0, 62.0, false",   // limite haute humidité (60+2)
        "31.0, 62.1, true",    // humidité hors tolérance
        "31.0, 58.0, false",   // limite basse humidité (60-2)
        "31.0, 57.9, true",    // humidité trop basse
        "45.0, 90.0, true",    // largement hors plage
    })
    @DisplayName("Détecte correctement les anomalies selon les tolérances ±3°C / ±2%")
    void detectsAnomalyAccordingToTolerance(double temp, double humidity, boolean expectedAnomaly) {
        when(countryRepository.findTopBy()).thenReturn(ecuador);

        SensorReading saved = new SensorReading();
        saved.setId(1L);
        saved.setDevice(device);
        saved.setWarehouse(warehouse);
        saved.setTemperature(BigDecimal.valueOf(temp));
        saved.setHumidity(BigDecimal.valueOf(humidity));
        saved.setIsAnomaly(expectedAnomaly);
        saved.setRecordedAt(OffsetDateTime.now());

        when(sensorReadingRepository.save(any())).thenReturn(saved);

        SensorReadingResponse response = sensorReadingService.save(
                device, warehouse,
                BigDecimal.valueOf(temp),
                BigDecimal.valueOf(humidity)
        );

        assertThat(response.getIsAnomaly()).isEqualTo(expectedAnomaly);

        if (expectedAnomaly) {
            verify(alertService, atLeastOnce()).raiseReadingAlert(any(), any(AlertType.class));
        } else {
            verify(alertService, never()).raiseReadingAlert(any(), any());
        }
    }
}