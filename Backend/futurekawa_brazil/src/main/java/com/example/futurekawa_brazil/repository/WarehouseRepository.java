package com.example.futurekawa_brazil.repository;


import com.example.futurekawa_brazil.entity.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WarehouseRepository extends JpaRepository<Warehouse, Integer> {
    List<Warehouse> findByExploitationId(Integer exploitationId);
}
