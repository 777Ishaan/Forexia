package com.forexia.backend.controller;

import com.forexia.backend.dto.ExchangeRateResponse;
import com.forexia.backend.service.ExchangeRateService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rates")
public class ExchangeRateController {

    private final ExchangeRateService exchangeRateService;

    public ExchangeRateController(
            ExchangeRateService exchangeRateService) {

        this.exchangeRateService = exchangeRateService;
    }

    @GetMapping
    public ExchangeRateResponse getRates(
            @RequestParam(defaultValue = "USD") String base) {

        return exchangeRateService.getRates(base);
    }
}