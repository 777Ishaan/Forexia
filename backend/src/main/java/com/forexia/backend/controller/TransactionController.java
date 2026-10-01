package com.forexia.backend.controller;

import com.forexia.backend.dto.TransactionResponse;
import com.forexia.backend.entity.Transaction;
import com.forexia.backend.entity.User;
import com.forexia.backend.repository.TransactionRepository;
import com.forexia.backend.repository.UserRepository;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    public TransactionController(
            TransactionRepository transactionRepository,
            UserRepository userRepository) {

        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<TransactionResponse> getTransactions(
            Authentication authentication) {

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        List<Transaction> transactions =
                transactionRepository
                        .findByUserOrderByCreatedAtDesc(user);

        return transactions.stream()
                .map(transaction ->
                        new TransactionResponse(
                                transaction.getId(),
                                transaction.getType(),
                                transaction.getFromCurrency(),
                                transaction.getToCurrency(),
                                transaction.getAmount(),
                                transaction.getExchangeRate(),
                                transaction.getConvertedAmount(),
                                transaction.getCreatedAt(),
                                transaction.getRelatedUserEmail()
                        )
                )
                .toList();
    }
}