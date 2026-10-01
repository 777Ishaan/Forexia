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

import com.forexia.backend.dto.TransferRequest;
import com.forexia.backend.dto.TransferResponse;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class WalletService {

    private final WalletRepository walletRepository;
    private final WalletBalanceRepository walletBalanceRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    public WalletService(
            WalletRepository walletRepository,
            WalletBalanceRepository walletBalanceRepository,
            TransactionRepository transactionRepository,
            UserRepository userRepository) {

        this.walletRepository = walletRepository;
        this.walletBalanceRepository = walletBalanceRepository;
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
    }

    // Get user's wallet
    public Wallet getWallet(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        return walletRepository.findByUser(user)
                .orElseThrow(() ->
                        new RuntimeException("Wallet not found"));
    }

    // Get all currency balances
    public List<WalletBalance> getBalances(String email) {

        Wallet wallet = getWallet(email);

        return walletBalanceRepository.findByWallet(wallet);
    }

    // Deposit money into a specific currency
    @Transactional
    public WalletBalance deposit(
            String email,
            String currency,
            double amount) {

        if (amount <= 0) {
            throw new RuntimeException(
                    "Amount must be greater than 0");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        Wallet wallet = walletRepository.findByUser(user)
                .orElseThrow(() ->
                        new RuntimeException("Wallet not found"));

        String normalizedCurrency =
                currency.toUpperCase();

        WalletBalance walletBalance =
                walletBalanceRepository
                        .findByWalletAndCurrency(
                                wallet,
                                normalizedCurrency
                        )
                        .orElseGet(() ->
                                new WalletBalance(
                                        wallet,
                                        normalizedCurrency,
                                        0.0
                                )
                        );

        // Add money
        walletBalance.setBalance(
                walletBalance.getBalance() + amount
        );

        WalletBalance savedBalance =
                walletBalanceRepository.save(walletBalance);


        // -----------------------------
        // SAVE DEPOSIT TRANSACTION
        // -----------------------------

        Transaction transaction =
                new Transaction();

        transaction.setType("DEPOSIT");

        transaction.setFromCurrency(null);

        transaction.setToCurrency(
                normalizedCurrency);

        transaction.setAmount(amount);

        transaction.setExchangeRate(1.0);

        transaction.setConvertedAmount(amount);

        transaction.setCreatedAt(
                LocalDateTime.now());

        transaction.setUser(user);

        transactionRepository.save(transaction);


        return savedBalance;
    }

    // Withdraw money from a specific currency
    @Transactional
    public WalletBalance withdraw(
            String email,
            String currency,
            double amount) {

        if (amount <= 0) {
            throw new RuntimeException(
                    "Amount must be greater than 0");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        Wallet wallet = walletRepository.findByUser(user)
                .orElseThrow(() ->
                        new RuntimeException("Wallet not found"));

        String normalizedCurrency =
                currency.toUpperCase();

        WalletBalance walletBalance =
                walletBalanceRepository
                        .findByWalletAndCurrency(
                                wallet,
                                normalizedCurrency
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Currency balance not found"
                                )
                        );


        // Check balance
        if (walletBalance.getBalance() < amount) {

            throw new RuntimeException(
                    "Insufficient "
                            + normalizedCurrency
                            + " balance"
            );
        }


        // Remove money
        walletBalance.setBalance(
                walletBalance.getBalance() - amount
        );

        WalletBalance savedBalance =
                walletBalanceRepository.save(walletBalance);


        // -----------------------------
        // SAVE WITHDRAW TRANSACTION
        // -----------------------------

        Transaction transaction =
                new Transaction();

        transaction.setType("WITHDRAW");

        transaction.setFromCurrency(
                normalizedCurrency);

        transaction.setToCurrency(null);

        transaction.setAmount(amount);

        transaction.setExchangeRate(1.0);

        transaction.setConvertedAmount(amount);

        transaction.setCreatedAt(
                LocalDateTime.now());

        transaction.setUser(user);

        transactionRepository.save(transaction);


        return savedBalance;
    }
    @Transactional
    public TransferResponse transfer(
        String senderEmail,
        TransferRequest request) {

    // -----------------------------
    // VALIDATE REQUEST
    // -----------------------------

    if (request == null) {
        throw new RuntimeException(
                "Transfer request cannot be empty"
        );
    }

    if (request.getReceiverEmail() == null ||
            request.getReceiverEmail().isBlank()) {

        throw new RuntimeException(
                "Receiver email is required"
        );
    }

    if (request.getCurrency() == null ||
            request.getCurrency().isBlank()) {

        throw new RuntimeException(
                "Currency is required"
        );
    }

    if (request.getAmount() <= 0) {

        throw new RuntimeException(
                "Amount must be greater than 0"
        );
    }


    // -----------------------------
    // FIND SENDER
    // -----------------------------

    User sender =
            userRepository.findByEmail(senderEmail)
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Sender not found"
                            )
                    );


    // -----------------------------
    // FIND RECEIVER
    // -----------------------------

    String receiverEmail =
            request.getReceiverEmail()
                    .trim()
                    .toLowerCase();

    User receiver =
            userRepository.findByEmail(receiverEmail)
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Receiver not found"
                            )
                    );


    // -----------------------------
    // PREVENT SELF TRANSFER
    // -----------------------------

    if (sender.getId()
            .equals(receiver.getId())) {

        throw new RuntimeException(
                "You cannot transfer money to yourself"
        );
    }


    // -----------------------------
    // NORMALIZE CURRENCY
    // -----------------------------

    String currency =
            request.getCurrency()
                    .trim()
                    .toUpperCase();


    double amount =
            request.getAmount();


    // -----------------------------
    // FIND SENDER WALLET
    // -----------------------------

    Wallet senderWallet =
            walletRepository.findByUser(sender)
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Sender wallet not found"
                            )
                    );


    // -----------------------------
    // FIND RECEIVER WALLET
    // -----------------------------

    Wallet receiverWallet =
            walletRepository.findByUser(receiver)
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Receiver wallet not found"
                            )
                    );


    // -----------------------------
    // FIND SENDER BALANCE
    // -----------------------------

    WalletBalance senderBalance =
            walletBalanceRepository
                    .findByWalletAndCurrency(
                            senderWallet,
                            currency
                    )
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Sender does not have a "
                                    + currency
                                    + " balance"
                            )
                    );


    // -----------------------------
    // CHECK BALANCE
    // -----------------------------

    if (senderBalance.getBalance()
            < amount) {

        throw new RuntimeException(
                "Insufficient "
                + currency
                + " balance"
        );
    }


    // -----------------------------
    // FIND OR CREATE RECEIVER BALANCE
    // -----------------------------

    WalletBalance receiverBalance =
            walletBalanceRepository
                    .findByWalletAndCurrency(
                            receiverWallet,
                            currency
                    )
                    .orElseGet(() ->
                            new WalletBalance(
                                    receiverWallet,
                                    currency,
                                    0.0
                            )
                    );


    // -----------------------------
    // DEDUCT FROM SENDER
    // -----------------------------

    senderBalance.setBalance(
            senderBalance.getBalance()
                    - amount
    );


    walletBalanceRepository.save(
            senderBalance
    );


    // -----------------------------
    // ADD TO RECEIVER
    // -----------------------------

    receiverBalance.setBalance(
            receiverBalance.getBalance()
                    + amount
    );


    walletBalanceRepository.save(
            receiverBalance
    );


    // -----------------------------
    // SAVE SENDER TRANSACTION
    // -----------------------------

    Transaction senderTransaction =
            new Transaction();

    senderTransaction.setType(
            "TRANSFER_SENT"
    );

    senderTransaction.setFromCurrency(
            currency
    );

    senderTransaction.setToCurrency(
            currency
    );

    senderTransaction.setAmount(
            amount
    );

    senderTransaction.setExchangeRate(
            1.0
    );

    senderTransaction.setConvertedAmount(
            amount
    );

    senderTransaction.setCreatedAt(
            LocalDateTime.now()
    );

    senderTransaction.setUser(sender);

// Store receiver email
senderTransaction.setRelatedUserEmail(receiverEmail);

transactionRepository.save(
        senderTransaction
);


    // -----------------------------
    // SAVE RECEIVER TRANSACTION
    // -----------------------------

    Transaction receiverTransaction =
            new Transaction();

    receiverTransaction.setType(
            "TRANSFER_RECEIVED"
    );

    receiverTransaction.setFromCurrency(
            currency
    );

    receiverTransaction.setToCurrency(
            currency
    );

    receiverTransaction.setAmount(
            amount
    );

    receiverTransaction.setExchangeRate(
            1.0
    );

    receiverTransaction.setConvertedAmount(
            amount
    );

    receiverTransaction.setCreatedAt(
            LocalDateTime.now()
    );

    receiverTransaction.setUser(receiver);

// Store sender email
receiverTransaction.setRelatedUserEmail(senderEmail);

transactionRepository.save(
        receiverTransaction
);


    // -----------------------------
    // RETURN RESPONSE
    // -----------------------------

    return new TransferResponse(
            senderEmail,
            receiverEmail,
            currency,
            amount,
            "Transfer successful"
    );
}
}