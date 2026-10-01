package com.forexia.backend.dto;

public record WalletBalanceResponse(
        String currency,
        double balance
) {
}