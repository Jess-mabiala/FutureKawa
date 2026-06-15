package com.example.futurekawa_central.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.Map;

@Configuration
@Getter
public class CountryConfig {

    @Value("${country.brazil.url}")
    private String brazilUrl;

    @Value("${country.ecuador.url}")
    private String ecuadorUrl;

    @Value("${country.colombia.url}")
    private String colombiaUrl;

    // Retourne la map pays → URL
    public Map<String, String> getAllCountries() {
        return Map.of(
            "Brazil",   brazilUrl,
            "Ecuador",  ecuadorUrl,
            "Colombia", colombiaUrl
        );
    }

    // Retourne l'URL d'un pays par son nom
    public String getUrlForCountry(String country) {
        return switch (country.toLowerCase()) {
            case "brazil"   -> brazilUrl;
            case "ecuador"  -> ecuadorUrl;
            case "colombia" -> colombiaUrl;
            default -> throw new IllegalArgumentException("Pays inconnu : " + country);
        };
    }

    public List<String> getCountryNames() {
        return List.of("Brazil", "Ecuador", "Colombia");
    }
}