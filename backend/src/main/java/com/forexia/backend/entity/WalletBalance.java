package com.forexia.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(
    name = "wallet_balances",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"wallet_id", "currency"})
    }
)
public class WalletBalance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "wallet_id", nullable = false)
    private Wallet wallet;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(nullable = false)
    private double balance;

    public WalletBalance() {
    }

    public WalletBalance(Wallet wallet, String currency, double balance) {
        this.wallet = wallet;
        this.currency = currency;
        this.balance = balance;
    }

    public Long getId() {
        return id;
    }

    public Wallet getWallet() {
        return wallet;
    }

    public void setWallet(Wallet wallet) {
        this.wallet = wallet;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public double getBalance() {
        return balance;
    }

    public void setBalance(double balance) {
        this.balance = balance;
    }
}