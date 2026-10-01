package com.forexia.backend.service;

import com.forexia.backend.dto.RegisterRequest;
import com.forexia.backend.entity.User;
import com.forexia.backend.repository.UserRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.forexia.backend.dto.LoginRequest;
import com.forexia.backend.dto.LoginResponse;
import com.forexia.backend.security.JwtService;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import com.forexia.backend.entity.Wallet;
import com.forexia.backend.repository.WalletRepository;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final WalletRepository walletRepository;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            WalletRepository walletRepository) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.walletRepository = walletRepository;
    }


    /* =====================================================
       LOGIN
    ===================================================== */

    public LoginResponse login(LoginRequest request) {

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        String token =
                jwtService.generateToken(request.getEmail());

        return new LoginResponse(
                token,
                "Login successful"
        );
    }


    /* =====================================================
       REGISTER
    ===================================================== */

    public String registerUser(RegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {

            throw new RuntimeException(
                    "Email already exists"
            );

        }

        User user = new User();

        user.setName(request.getName());
        user.setEmail(request.getEmail());

        user.setPassword(
                passwordEncoder.encode(
                        request.getPassword()
                )
        );

        userRepository.save(user);


        // Create wallet for new user

        Wallet wallet = new Wallet();

        wallet.setUser(user);
        wallet.setBalance(0.0);

        walletRepository.save(wallet);


        return "User registered successfully!";
    }


    /* =====================================================
       GET USER BY EMAIL
    ===================================================== */

    public User getUserByEmail(String email) {

        return userRepository
                .findByEmail(email)
                .orElseThrow(
                        () -> new RuntimeException(
                                "User not found"
                        )
                );

    }


    /* =====================================================
       UPDATE PROFILE
    ===================================================== */

    public User updateProfile(
            String currentEmail,
            String name,
            String email) {

        User user =
                getUserByEmail(currentEmail);


        // Update name if provided

        if (name != null &&
                !name.trim().isEmpty()) {

            user.setName(
                    name.trim()
            );

        }


        // Update email if provided

        if (email != null &&
                !email.trim().isEmpty() &&
                !email.equalsIgnoreCase(currentEmail)) {


            if (userRepository.existsByEmail(email)) {

                throw new RuntimeException(
                        "Email already exists"
                );

            }

            user.setEmail(
                    email.trim()
            );

        }


        return userRepository.save(user);
    }

}