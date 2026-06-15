package com.example.futurekawa_brazil.repository;

import com.example.futurekawa_brazil.entity.Country;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CountryRepository extends JpaRepository<Country, Integer> {
    Country findTopBy();
}