package com.forexia.backend.dto;

import java.time.LocalDateTime;

public class ProfileResponse {

    private String name;
    private String email;
    private LocalDateTime createdAt;

    public ProfileResponse() {
    }

    public ProfileResponse(
            String name,
            String email,
            LocalDateTime createdAt
    ) {
        this.name = name;
        this.email = email;
        this.createdAt = createdAt;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}