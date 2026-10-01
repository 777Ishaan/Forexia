package com.forexia.backend.controller;

import com.forexia.backend.entity.User;
import com.forexia.backend.service.UserService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;


    public UserController(UserService userService) {

        this.userService = userService;

    }


    /* =====================================================
       GET CURRENT USER
    ===================================================== */

    @GetMapping("/me")
    public ResponseEntity<?> me(
            Authentication authentication) {


        String email =
                authentication.getName();


        User user =
                userService.getUserByEmail(email);


        Map<String, Object> response =
                new HashMap<>();


        response.put(
                "id",
                user.getId()
        );

        response.put(
                "name",
                user.getName()
        );

        response.put(
                "email",
                user.getEmail()
        );

        response.put(
                "createdAt",
                user.getCreatedAt()
        );


        return ResponseEntity.ok(response);

    }


    /* =====================================================
       UPDATE PROFILE
    ===================================================== */

    @PutMapping("/me")
    public ResponseEntity<?> updateProfile(
            Authentication authentication,
            @RequestBody Map<String, String> request) {


        String currentEmail =
                authentication.getName();


        String name =
                request.get("name");


        String email =
                request.get("email");


        try {

            User updatedUser =
                    userService.updateProfile(
                            currentEmail,
                            name,
                            email
                    );


            Map<String, Object> response =
                    new HashMap<>();


            response.put(
                    "id",
                    updatedUser.getId()
            );

            response.put(
                    "name",
                    updatedUser.getName()
            );

            response.put(
                    "email",
                    updatedUser.getEmail()
            );

            response.put(
                    "createdAt",
                    updatedUser.getCreatedAt()
            );


            return ResponseEntity.ok(response);


        } catch (RuntimeException error) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    error.getMessage()
                            )
                    );

        }

    }

}