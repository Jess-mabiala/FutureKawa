package com.example.futurekawa_brazil.repository;


import com.example.futurekawa_brazil.entity.SensorReading;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.OffsetDateTime;
import java.util.List;

public interface SensorReadingRepository extends JpaRepository<SensorReading, Long> {

    List<SensorReading> findByWarehouseIdAndRecordedAtBetweenOrderByRecordedAtAsc(
            Integer warehouseId, OffsetDateTime from, OffsetDateTime to);

    List<SensorReading> findTop50ByWarehouseIdOrderByRecordedAtDesc(Integer warehouseId);

    List<SensorReading> findByWarehouseIdAndIsAnomalyTrueOrderByRecordedAtDesc(Integer warehouseId);
}
