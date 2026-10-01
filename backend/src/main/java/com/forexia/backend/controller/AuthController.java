package com.forexia.backend.controller;

import com.forexia.backend.dto.RegisterRequest;
import com.forexia.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import com.forexia.backend.dto.LoginRequest;
import com.forexia.backend.dto.LoginResponse;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public String register(@Valid @RequestBody RegisterRequest request) {
        return userService.registerUser(request);
    }
    
    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return userService.login(request);
    }
    @GetMapping("/me")
public String me() {
    return "You are authenticated!";
}   
}