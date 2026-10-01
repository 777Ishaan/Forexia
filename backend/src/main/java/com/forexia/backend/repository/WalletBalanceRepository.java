package com.forexia.backend.repository;

import com.forexia.backend.entity.Wallet;
import com.forexia.backend.entity.WalletBalance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WalletBalanceRepository
        extends JpaRepository<WalletBalance, Long> {

    List<WalletBalance> findByWallet(Wallet wallet);

    Optional<WalletBalance> findByWalletAndCurrency(
            Wallet wallet,
            String currency
    );
}