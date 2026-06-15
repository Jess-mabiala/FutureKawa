package com.example.futurekawa_ecuador.service;

import com.example.futurekawa_ecuador.dto.SensorReadingResponse;
import com.example.futurekawa_ecuador.entity.Country;
import com.example.futurekawa_ecuador.entity.IoTDevice;
import com.example.futurekawa_ecuador.entity.SensorReading;
import com.example.futurekawa_ecuador.entity.Warehouse;
import com.example.futurekawa_ecuador.enums.AlertType;
import com.example.futurekawa_ecuador.repository.CountryRepository;
import com.example.futurekawa_ecuador.repository.SensorReadingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SensorReadingService {

    private final SensorReadingRepository sensorReadingRepository;
    private final CountryRepository countryRepository;
    private final AlertService alertService;

    @Transactional
    public SensorReadingResponse save(IoTDevice device, Warehouse warehouse,
                                      BigDecimal temperature, BigDecimal humidity) {
        Country country = countryRepository.findTopBy();
        boolean anomaly = isAnomaly(temperature, humidity, country);

        SensorReading reading = new SensorReading();
        reading.setDevice(device);
        reading.setWarehouse(warehouse);
        reading.setTemperature(temperature);
        reading.setHumidity(humidity);
        reading.setIsAnomaly(anomaly);

        SensorReading saved = sensorReadingRepository.save(reading);

        if (anomaly) {
            if (isOutOfRange(temperature, country.getIdealTemp(), country.getTempTolerance()))
                alertService.raiseReadingAlert(saved, AlertType.temperature);
            if (isOutOfRange(humidity, country.getIdealHumidity(), country.getHumidityTolerance()))
                alertService.raiseReadingAlert(saved, AlertType.humidity);
        }

        return SensorReadingResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<SensorReadingResponse> getHistory(Integer warehouseId,
                                                   OffsetDateTime from, OffsetDateTime to) {
        return sensorReadingRepository
                .findByWarehouseIdAndRecordedAtBetweenOrderByRecordedAtAsc(warehouseId, from, to)
                .stream().map(SensorReadingResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<SensorReadingResponse> getLatest(Integer warehouseId) {
        return sensorReadingRepository
                .findTop50ByWarehouseIdOrderByRecordedAtDesc(warehouseId)
                .stream().map(SensorReadingResponse::from).toList();
    }

    private boolean isAnomaly(BigDecimal temp, BigDecimal humidity, Country country) {
        return isOutOfRange(temp, country.getIdealTemp(), country.getTempTolerance())
                || isOutOfRange(humidity, country.getIdealHumidity(), country.getHumidityTolerance());
    }

    private boolean isOutOfRange(BigDecimal value, BigDecimal ideal, BigDecimal tolerance) {
        return value.subtract(ideal).abs().compareTo(tolerance) > 0;
    }
}
