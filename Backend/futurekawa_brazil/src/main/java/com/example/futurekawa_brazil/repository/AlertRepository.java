package com.example.futurekawa_brazil.repository;


import com.example.futurekawa_brazil.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AlertRepository extends JpaRepository<Alert, Integer> {

    List<Alert> findByWarehouseIdAndResolvedAtIsNullOrderByTriggeredAtDesc(Integer warehouseId);

    List<Alert> findByWarehouseIdOrderByTriggeredAtDesc(Integer warehouseId);

    List<Alert> findByResolvedAtIsNullOrderByTriggeredAtDesc();
}
