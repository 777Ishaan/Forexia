package com.forexia.backend.dto;

public class WalletResponse {

    private Long id;
    private Double balance;
    private UserResponse user;

    public WalletResponse() {
    }

    public WalletResponse(Long id, Double balance, UserResponse user) {
        this.id = id;
        this.balance = balance;
        this.user = user;
    }

    public Long getId() {
        return id;
    }

    public Double getBalance() {
        return balance;
    }

    public UserResponse getUser() {
        return user;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setBalance(Double balance) {
        this.balance = balance;
    }

    public void setUser(UserResponse user) {
        this.user = user;
    }
}