package com.fitness.gateway.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final KeycloakAuthService keycloakAuthService;

    @PostMapping("/login")
    public Mono<TokenResponse> login(@RequestBody LoginRequest request) {
        if (request.getUsername() == null || request.getUsername().isBlank()) {
            return Mono.error(new IllegalArgumentException("Username is required"));
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            return Mono.error(new IllegalArgumentException("Password is required"));
        }
        return keycloakAuthService.login(request.getUsername().trim(), request.getPassword());
    }
}
