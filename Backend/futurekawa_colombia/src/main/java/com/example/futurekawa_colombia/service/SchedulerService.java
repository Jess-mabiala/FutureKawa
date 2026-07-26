//pour le check des lots expirés
package com.example.futurekawa_colombia.service;

import com.example.futurekawa_colombia.entity.Lot;
import com.example.futurekawa_colombia.enums.LotStatus;
import com.example.futurekawa_colombia.repository.LotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
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

    /**
     * Lancé automatiquement au démarrage de l'application.
     * Permet de détecter les lots expirés dès le lancement (ex: après un restart Docker)
     * sans attendre le cron de 6h du matin.
     */
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void checkExpiredLotsOnStartup() {
        log.info("Vérification des lots expirés au démarrage...");
        checkExpiredLots();
    }

    /**
     * Lancé tous les jours à 6h du matin.
     */
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