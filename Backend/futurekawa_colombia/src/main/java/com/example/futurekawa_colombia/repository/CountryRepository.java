package com.example.futurekawa_colombia.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.futurekawa_colombia.entity.Country;

public interface CountryRepository extends JpaRepository<Country, Integer> {
    Country findTopBy();
}