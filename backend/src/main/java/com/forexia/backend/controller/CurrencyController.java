package com.forexia.backend.controller;

import com.forexia.backend.service.CurrencyService;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/currency")
public class CurrencyController {

    private final CurrencyService currencyService;

    public CurrencyController(
            CurrencyService currencyService) {

        this.currencyService = currencyService;
    }

    @GetMapping("/convert")
    public CurrencyService.ConversionResponse convert(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam double amount,
            Authentication authentication) {

        String email = authentication.getName();

        return currencyService.convert(
                email,
                from,
                to,
                amount
        );
    }
    @GetMapping("/rate")
public Map<String, Object> getRate(
        @RequestParam String from,
        @RequestParam String to) {

    double rate =
            currencyService.getExchangeRate(from, to);

    return Map.of(
            "from", from.toUpperCase(),
            "to", to.toUpperCase(),
            "rate", rate
    );
}
}