package com.example.futurekawa_ecuador.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
 
import java.math.BigDecimal;
 
@Entity
@Table(name = "country")
@Getter @Setter
public class Country {
 
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
 
    @Column(length = 2, nullable = false, unique = true)
    private String code;
 
    @Column(nullable = false)
    private String name;
 
    @Column(name = "ideal_temp", nullable = false)
    private BigDecimal idealTemp;
 
    @Column(name = "ideal_humidity", nullable = false)
    private BigDecimal idealHumidity;
 
    @Column(name = "temp_tolerance", nullable = false)
    private BigDecimal tempTolerance;
 
    @Column(name = "humidity_tolerance", nullable = false)
    private BigDecimal humidityTolerance;
}
