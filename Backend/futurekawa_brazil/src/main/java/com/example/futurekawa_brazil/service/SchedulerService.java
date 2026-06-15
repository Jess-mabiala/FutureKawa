//pour le check des lots expirés
package com.example.futurekawa_brazil.service;


import com.example.futurekawa_brazil.entity.Lot;
import com.example.futurekawa_brazil.enums.LotStatus;
import com.example.futurekawa_brazil.repository.LotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SchedulerService {

    private final LotRepository lotRepository;
    private final AlertService alertService;

    @Scheduled(cron = "0 0 6 * * *")
    @Transactional
    public void checkExpiredLots() {
        LocalDate cutoff = LocalDate.now().minusDays(365);
        List<Lot> expiredLots = lotRepository.findExpiredLots(cutoff);

        for (Lot lot : expiredLots) {
            if (lot.getStatus() != LotStatus.expired) {
                lot.setStatus(LotStatus.expired);
                lotRepository.save(lot);
                alertService.raiseExpirationAlert(lot);
                log.warn("Lot expiré : {} (stocké le {})", lot.getLotCode(), lot.getStorageDate());
            }
        }
        log.info("Vérification péremption — {} lot(s) expiré(s)", expiredLots.size());
    }
}