package com.forexia.backend.controller;

import com.forexia.backend.dto.WalletBalanceResponse;
import com.forexia.backend.entity.Wallet;
import com.forexia.backend.entity.WalletBalance;
import com.forexia.backend.service.WalletService;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.forexia.backend.dto.TransferRequest;
import com.forexia.backend.dto.TransferResponse;

import java.util.List;

@RestController
@RequestMapping("/api/wallet")
public class WalletController {

    private final WalletService walletService;

    public WalletController(WalletService walletService) {
        this.walletService = walletService;
    }

    // Get wallet
    @GetMapping
    public Wallet getWallet(Authentication authentication) {

        String email = authentication.getName();

        return walletService.getWallet(email);
    }

    // Get all currency balances
    @GetMapping("/balances")
    public List<WalletBalanceResponse> getBalances(
            Authentication authentication) {

        String email = authentication.getName();

        List<WalletBalance> balances =
                walletService.getBalances(email);

        return balances.stream()
                .map(balance ->
                        new WalletBalanceResponse(
                                balance.getCurrency(),
                                balance.getBalance()
                        )
                )
                .toList();
    }

    // Deposit
    @PostMapping("/deposit")
    public WalletBalanceResponse deposit(
            @RequestParam String currency,
            @RequestParam double amount,
            Authentication authentication) {

        String email = authentication.getName();

        WalletBalance balance =
                walletService.deposit(
                        email,
                        currency,
                        amount
                );

        return new WalletBalanceResponse(
                balance.getCurrency(),
                balance.getBalance()
        );
    }

    // Withdraw
    @PostMapping("/withdraw")
    public WalletBalanceResponse withdraw(
            @RequestParam String currency,
            @RequestParam double amount,
            Authentication authentication) {

        String email = authentication.getName();

        WalletBalance balance =
                walletService.withdraw(
                        email,
                        currency,
                        amount
                );

        return new WalletBalanceResponse(
                balance.getCurrency(),
                balance.getBalance()
        );
    }
    @PostMapping("/transfer")
    public TransferResponse transfer(
        @RequestBody TransferRequest request,
        Authentication authentication) {

    String senderEmail =
            authentication.getName();

    return walletService.transfer(
            senderEmail,
            request
    );
}
}