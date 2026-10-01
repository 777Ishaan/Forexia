package com.forexia.backend.service;

import com.forexia.backend.dto.ExchangeRateResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class ExchangeRateService {

    private final RestTemplate restTemplate;

    public ExchangeRateService() {
        this.restTemplate = new RestTemplate();
    }

    public ExchangeRateResponse getRates(String base) {

        String url =
                "https://api.frankfurter.app/latest?from=" + base.toUpperCase();

        return restTemplate.getForObject(
                url,
                ExchangeRateResponse.class
        );
    }
}