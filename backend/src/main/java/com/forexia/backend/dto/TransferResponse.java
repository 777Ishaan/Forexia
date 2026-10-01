package com.forexia.backend.dto;

public record TransferResponse(
        String sender,
        String receiver,
        String currency,
        double amount,
        String message
) {
}