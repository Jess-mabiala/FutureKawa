package com.example.futurekawa_central.controller; // Adapte le package à ton projet

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomeController {

    @GetMapping("/")
    public String home() {
        return "Le backend FutureKawa fonctionne sur le port 3000 !";
    }
    
}
