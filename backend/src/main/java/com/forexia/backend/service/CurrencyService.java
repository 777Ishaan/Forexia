package com.forexia.backend.service;

import com.forexia.backend.entity.Transaction;
import com.forexia.backend.entity.User;
import com.forexia.backend.entity.Wallet;
import com.forexia.backend.entity.WalletBalance;

import com.forexia.backend.repository.TransactionRepository;
import com.forexia.backend.repository.UserRepository;
import com.forexia.backend.repository.WalletBalanceRepository;
import com.forexia.backend.repository.WalletRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Map;

@Service
public class CurrencyService {

    private final RestTemplate restTemplate = new RestTemplate();

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final WalletBalanceRepository walletBalanceRepository;

    public CurrencyService(
            TransactionRepository transactionRepository,
            UserRepository userRepository,
            WalletRepository walletRepository,
            WalletBalanceRepository walletBalanceRepository) {

        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
        this.walletRepository = walletRepository;
        this.walletBalanceRepository = walletBalanceRepository;
    }
    public double getExchangeRate(String from, String to) {

    String sourceCurrency = from.toUpperCase();
    String targetCurrency = to.toUpperCase();

    if (sourceCurrency.equals(targetCurrency)) {
        return 1.0;
    }

    String url =
            "https://api.frankfurter.app/latest?from="
                    + sourceCurrency
                    + "&to="
                    + targetCurrency;

    ExchangeResponse response =
            restTemplate.getForObject(
                    url,
                    ExchangeResponse.class
            );

    if (response == null ||
            response.rates() == null) {

        throw new RuntimeException(
                "Unable to fetch exchange rate"
        );
    }

    Double rate =
            response.rates().get(targetCurrency);

    if (rate == null) {
        throw new RuntimeException(
                "Currency not supported"
        );
    }

    return rate;
}

    @Transactional
    public ConversionResponse convert(
            String email,
            String from,
            String to,
            double amount) {

        // Validate amount
        if (amount <= 0) {
            throw new RuntimeException(
                    "Amount must be greater than 0");
        }

        // Create NEW variables instead of modifying from/to
        final String sourceCurrency = from.toUpperCase();
        final String targetCurrency = to.toUpperCase();

        // Source and destination cannot be same
        if (sourceCurrency.equals(targetCurrency)) {
            throw new RuntimeException(
                    "Source and destination currencies must be different");
        }

        // Find user
        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        // Find wallet
        Wallet wallet = walletRepository.findByUser(user)
                .orElseThrow(() ->
                        new RuntimeException("Wallet not found"));

        // Find source currency balance
        WalletBalance sourceBalance =
                walletBalanceRepository
                        .findByWalletAndCurrency(
                                wallet,
                                sourceCurrency)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Source currency balance not found"));

        // Check sufficient balance
        if (sourceBalance.getBalance() < amount) {
            throw new RuntimeException(
                    "Insufficient "
                            + sourceCurrency
                            + " balance");
        }

        // Fetch live exchange rate
        String url =
                "https://api.frankfurter.app/latest?from="
                        + sourceCurrency
                        + "&to="
                        + targetCurrency;

        ExchangeResponse response =
                restTemplate.getForObject(
                        url,
                        ExchangeResponse.class);

        if (response == null ||
                response.rates() == null) {

            throw new RuntimeException(
                    "Unable to fetch exchange rate");
        }

        // Get exchange rate
        Double rate =
                response.rates()
                        .get(targetCurrency);

        if (rate == null) {
            throw new RuntimeException(
                    "Currency not supported");
        }

        // Calculate converted amount
        double convertedAmount =
                amount * rate;

        // -----------------------------
        // DEDUCT SOURCE CURRENCY
        // -----------------------------

        sourceBalance.setBalance(
                sourceBalance.getBalance() - amount
        );

        walletBalanceRepository.save(sourceBalance);

        // -----------------------------
        // ADD DESTINATION CURRENCY
        // -----------------------------

        WalletBalance destinationBalance =
                walletBalanceRepository
                        .findByWalletAndCurrency(
                                wallet,
                                targetCurrency)
                        .orElseGet(() ->
                                new WalletBalance(
                                        wallet,
                                        targetCurrency,
                                        0.0
                                )
                        );

        destinationBalance.setBalance(
                destinationBalance.getBalance()
                        + convertedAmount
        );

        walletBalanceRepository.save(
                destinationBalance);

        // -----------------------------
        // SAVE TRANSACTION
        // -----------------------------

        Transaction transaction = new Transaction();

        transaction.setType("CONVERSION");

        transaction.setFromCurrency(sourceCurrency);
        transaction.setToCurrency(targetCurrency);
        transaction.setAmount(amount);
        transaction.setExchangeRate(rate);
        transaction.setConvertedAmount(convertedAmount);
        transaction.setCreatedAt(LocalDateTime.now());
        transaction.setUser(user);
        
        transactionRepository.save(transaction);

        // Return response
        return new ConversionResponse(
                sourceCurrency,
                targetCurrency,
                amount,
                rate,
                convertedAmount
        );
    }

    public record ExchangeResponse(
            String base,
            Map<String, Double> rates
    ) {}

    public record ConversionResponse(
            String from,
            String to,
            double amount,
            double rate,
            double convertedAmount
    ) {}
}