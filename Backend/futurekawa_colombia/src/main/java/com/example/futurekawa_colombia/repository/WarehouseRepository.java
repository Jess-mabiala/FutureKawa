package com.example.futurekawa_colombia.repository;


import org.springframework.data.jpa.repository.JpaRepository;

import com.example.futurekawa_colombia.entity.Warehouse;

import java.util.List;

public interface WarehouseRepository extends JpaRepository<Warehouse, Integer> {
    List<Warehouse> findByExploitationId(Integer exploitationId);
}
