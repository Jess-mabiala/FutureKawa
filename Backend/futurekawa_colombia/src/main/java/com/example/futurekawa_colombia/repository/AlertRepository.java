package com.example.futurekawa_colombia.repository;


import org.springframework.data.jpa.repository.JpaRepository;

import com.example.futurekawa_colombia.entity.Alert;

import java.util.List;

public interface AlertRepository extends JpaRepository<Alert, Integer> {

    List<Alert> findByWarehouseIdAndResolvedAtIsNullOrderByTriggeredAtDesc(Integer warehouseId);

    List<Alert> findByWarehouseIdOrderByTriggeredAtDesc(Integer warehouseId);

    List<Alert> findByResolvedAtIsNullOrderByTriggeredAtDesc();
}
