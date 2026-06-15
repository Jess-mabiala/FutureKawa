package com.example.futurekawa_colombia.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
 
import java.time.LocalDate;
import java.time.OffsetDateTime;

import com.example.futurekawa_colombia.enums.LotStatus;
 
@Entity
@Table(name = "lot")
@Getter @Setter
public class Lot {
 
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
 
    @Column(name = "lot_code", nullable = false, unique = true)
    private String lotCode;
 
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;
 
    @Column(name = "storage_date", nullable = false)
    private LocalDate storageDate;
 
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.NAMED_ENUM)
    private LotStatus status = LotStatus.compliant;
 
    private String notes;
 
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();
 
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();
 
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
