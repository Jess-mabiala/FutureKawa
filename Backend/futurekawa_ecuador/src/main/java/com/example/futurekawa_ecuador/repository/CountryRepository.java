package com.example.futurekawa_ecuador.repository;

import com.example.futurekawa_ecuador.entity.Country;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CountryRepository extends JpaRepository<Country, Integer> {
    Country findTopBy();
}