package com.example.futurekawa_ecuador.repository;


import com.example.futurekawa_ecuador.entity.Lot;
import com.example.futurekawa_ecuador.enums.LotStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;

public interface LotRepository extends JpaRepository<Lot, Integer> {

    List<Lot> findByWarehouseIdOrderByStorageDateAsc(Integer warehouseId);

    @Query("SELECT l FROM Lot l JOIN l.warehouse w JOIN w.exploitation e WHERE e.id = :exploitationId ORDER BY l.storageDate ASC")
    List<Lot> findByExploitationIdOrderByStorageDateAsc(Integer exploitationId);

    @Query("SELECT l FROM Lot l WHERE l.storageDate <= :cutoffDate AND l.status <> 'expired'")
    List<Lot> findExpiredLots(LocalDate cutoffDate);

    List<Lot> findByStatus(LotStatus status);
}
