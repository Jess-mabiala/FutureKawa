package com.example.futurekawa_colombia.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.futurekawa_colombia.dto.SensorReadingResponse;
import com.example.futurekawa_colombia.entity.Country;
import com.example.futurekawa_colombia.entity.IoTDevice;
import com.example.futurekawa_colombia.entity.SensorReading;
import com.example.futurekawa_colombia.entity.Warehouse;
import com.example.futurekawa_colombia.enums.AlertType;
import com.example.futurekawa_colombia.repository.CountryRepository;
import com.example.futurekawa_colombia.repository.SensorReadingRepository;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("SensorReadingService — détection d'anomalie")
class SensorReadingServiceTest {

    @Mock SensorReadingRepository sensorReadingRepository;
    @Mock CountryRepository countryRepository;
    @Mock AlertService alertService;
    @InjectMocks SensorReadingService sensorReadingService;

    private Country brazil;
    private Warehouse warehouse;
    private IoTDevice device;

    @BeforeEach
    void setUp() {
        brazil = new Country();
        brazil.setIdealTemp(BigDecimal.valueOf(29.0));
        brazil.setIdealHumidity(BigDecimal.valueOf(55.0));
        brazil.setTempTolerance(BigDecimal.valueOf(3.0));
        brazil.setHumidityTolerance(BigDecimal.valueOf(2.0));

        warehouse = new Warehouse();
        warehouse.setId(1);

        device = new IoTDevice();
        device.setId(1);
        device.setWarehouse(warehouse);
    }

    @ParameterizedTest(name = "temp={0}°C, hum={1}% → anomalie={2}")
    @CsvSource({
        "29.0, 55.0, false",   // valeur idéale exacte
        "32.0, 55.0, false",   // limite haute temp (29+3)
        "32.1, 55.0, true",    // juste au-dessus → anomalie
        "25.9, 55.0, true",    // juste en dessous → anomalie
        "26.0, 55.0, false",   // limite basse (29-3)
        "29.0, 57.0, false",   // limite haute humidité (55+2)
        "29.0, 57.1, true",    // humidité hors tolérance
        "29.0, 53.0, false",   // limite basse humidité (55-2)
        "29.0, 52.9, true",    // humidité trop basse
        "40.0, 80.0, true",    // largement hors plage
    })
    @DisplayName("Détecte correctement les anomalies selon les tolérances ±3°C / ±2%")
    void detectsAnomalyAccordingToTolerance(double temp, double humidity, boolean expectedAnomaly) {
        when(countryRepository.findTopBy()).thenReturn(brazil);

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
