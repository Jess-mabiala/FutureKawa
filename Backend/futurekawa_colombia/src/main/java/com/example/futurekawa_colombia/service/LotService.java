package com.example.futurekawa_colombia.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.futurekawa_colombia.dto.LotRequest;
import com.example.futurekawa_colombia.dto.LotResponse;
import com.example.futurekawa_colombia.entity.Lot;
import com.example.futurekawa_colombia.entity.Warehouse;
import com.example.futurekawa_colombia.enums.LotStatus;
import com.example.futurekawa_colombia.exception.ResourceNotFoundException;
import com.example.futurekawa_colombia.repository.LotRepository;
import com.example.futurekawa_colombia.repository.WarehouseRepository;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LotService {

    private final LotRepository lotRepository;
    private final WarehouseRepository warehouseRepository;

    @Transactional
    public LotResponse create(LotRequest request) {
        Warehouse warehouse = warehouseRepository.findById(request.getWarehouseId())
                .orElseThrow();
        Lot lot = new Lot();
        lot.setLotCode(request.getLotCode());
        lot.setWarehouse(warehouse);
        lot.setStorageDate(request.getStorageDate());
        lot.setNotes(request.getNotes());
        lot.setStatus(LotStatus.compliant);
        return LotResponse.from(lotRepository.save(lot));
    }

    @Transactional(readOnly = true)
    public List<LotResponse> getByWarehouse(Integer warehouseId) {
        return lotRepository.findByWarehouseIdOrderByStorageDateAsc(warehouseId)
                .stream().map(LotResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<LotResponse> getByExploitation(Integer exploitationId) {
        return lotRepository.findByExploitationIdOrderByStorageDateAsc(exploitationId)
                .stream().map(LotResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public LotResponse getById(Integer id) {
        return LotResponse.from(lotRepository.findById(id)
                .orElseThrow());
    }

    @Transactional(readOnly = true)
    public List<LotResponse> getAll() {
        return lotRepository.findAll()
                .stream().map(LotResponse::from).toList();
    }

    @Transactional
    public LotResponse updateStatus(Integer id, LotStatus status) {
        Lot lot = lotRepository.findById(id)
                .orElseThrow();
        lot.setStatus(status);
        return LotResponse.from(lotRepository.save(lot));
    }

    @Transactional
    public int markExpiredLots() {
        LocalDate cutoff = LocalDate.now().minusDays(365);
        List<Lot> expired = lotRepository.findExpiredLots(cutoff);
        expired.forEach(l -> l.setStatus(LotStatus.expired));
        lotRepository.saveAll(expired);
        return expired.size();
    }
}
