package com.forexia.backend.dto;

import java.time.LocalDateTime;

public record TransactionResponse(

        Long id,

        String type,

        String fromCurrency,

        String toCurrency,

        double amount,

        double exchangeRate,

        double convertedAmount,

        LocalDateTime createdAt,

        String relatedUserEmail

) {
}