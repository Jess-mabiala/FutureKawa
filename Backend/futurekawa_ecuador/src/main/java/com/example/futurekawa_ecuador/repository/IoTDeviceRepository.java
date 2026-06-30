package com.example.futurekawa_ecuador.repository;

import com.example.futurekawa_ecuador.entity.IoTDevice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface IoTDeviceRepository extends JpaRepository<IoTDevice, Integer> {
    Optional<IoTDevice> findByMacAddress(String macAddress);
}