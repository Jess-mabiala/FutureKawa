package com.example.futurekawa_colombia.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.futurekawa_colombia.dto.AlertResponse;
import com.example.futurekawa_colombia.entity.Alert;
import com.example.futurekawa_colombia.entity.Lot;
import com.example.futurekawa_colombia.entity.SensorReading;
import com.example.futurekawa_colombia.entity.Warehouse;
import com.example.futurekawa_colombia.enums.AlertType;
import com.example.futurekawa_colombia.repository.AlertRepository;

import java.time.OffsetDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AlertService {

    private final AlertRepository alertRepository;
    private final JavaMailSender mailSender;

    @Value("${alert.email.from}")
    private String fromEmail;

    @Transactional
    public void raiseReadingAlert(SensorReading reading, AlertType type) {
        Alert alert = new Alert();
        alert.setWarehouse(reading.getWarehouse());
        alert.setType(type);
        alert.setDetails(String.format(
                "Valeur hors plage — Température: %.2f°C, Humidité: %.2f%%",
                reading.getTemperature(), reading.getHumidity()
        ));
        alertRepository.save(alert);
        sendEmail(alert);
    }

    @Transactional
    public void raiseExpirationAlert(Lot lot) {
        Alert alert = new Alert();
        alert.setWarehouse(lot.getWarehouse());
        alert.setLot(lot);
        alert.setType(AlertType.expiration);
        alert.setDetails(String.format(
                "Lot %s en stockage depuis %s — dépasse 365 jours.",
                lot.getLotCode(), lot.getStorageDate()
        ));
        alertRepository.save(alert);
        sendEmail(alert);
    }

    @Transactional
    public AlertResponse resolve(Integer alertId) {
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new RuntimeException("Alert not found: " + alertId));
        alert.setResolvedAt(OffsetDateTime.now());
        return AlertResponse.from(alertRepository.save(alert));
    }

    @Transactional(readOnly = true)
    public List<AlertResponse> getActiveAlerts() {
        return alertRepository.findByResolvedAtIsNullOrderByTriggeredAtDesc()
                .stream().map(AlertResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<AlertResponse> getByWarehouse(Integer warehouseId) {
        return alertRepository.findByWarehouseIdOrderByTriggeredAtDesc(warehouseId)
                .stream().map(AlertResponse::from).toList();
    }

    private void sendEmail(Alert alert) {
        try {
            Warehouse warehouse = alert.getWarehouse();
            String toEmail = warehouse.getExploitation().getId() + "@futurekawa.br";
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(fromEmail);
            msg.setTo(toEmail);
            msg.setSubject("[FutureKawa ALERTE] " + alert.getType().name().toUpperCase()
                    + " — " + warehouse.getName());
            msg.setText(alert.getDetails() + "\n\nDéclenché le : " + alert.getTriggeredAt());
            mailSender.send(msg);
            alert.setEmailSent(true);
            alertRepository.save(alert);
            log.info("Email alerte envoyé #{}", alert.getId());
        } catch (Exception e) {
            log.error("Échec email alerte #{}: {}", alert.getId(), e.getMessage());
        }
    }
}
