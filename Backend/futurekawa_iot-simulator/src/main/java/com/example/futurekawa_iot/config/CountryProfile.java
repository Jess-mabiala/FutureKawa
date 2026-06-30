package com.example.futurekawa_iot.config;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class CountryProfile {

    private final String name;
    private final double idealTemp;
    private final double idealHumidity;
    private final double tempTolerance;
    private final double humidityTolerance;
    private final List<Integer> warehouseIds;
    private final String mqttTopicPrefix;  // ex: futurekawa/brazil

    // Vérifie si les valeurs sont dans la plage acceptable
    public boolean isAnomaly(double temp, double humidity) {
        return Math.abs(temp - idealTemp) > tempTolerance
            || Math.abs(humidity - idealHumidity) > humidityTolerance;
    }

    // Définition des 3 pays
    public static final CountryProfile BRAZIL = new CountryProfile(
        "Brazil", 29.0, 55.0, 3.0, 2.0,
        List.of(1, 2, 3), "futurekawa/brazil"
    );

    public static final CountryProfile ECUADOR = new CountryProfile(
        "Ecuador", 31.0, 60.0, 3.0, 2.0,
        List.of(1, 2, 3), "futurekawa/ecuador"
    );

    public static final CountryProfile COLOMBIA = new CountryProfile(
        "Colombia", 26.0, 80.0, 3.0, 2.0,
        List.of(1, 2, 3), "futurekawa/colombia"
    );

    public static List<CountryProfile> all() {
        return List.of(BRAZIL, ECUADOR, COLOMBIA);
    }
}