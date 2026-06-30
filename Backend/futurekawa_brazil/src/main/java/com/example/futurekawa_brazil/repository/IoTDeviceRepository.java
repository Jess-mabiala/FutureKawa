package com.example.futurekawa_brazil.repository;

import com.example.futurekawa_brazil.entity.IoTDevice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface IoTDeviceRepository extends JpaRepository<IoTDevice, Integer> {
    Optional<IoTDevice> findByMacAddress(String macAddress);
}