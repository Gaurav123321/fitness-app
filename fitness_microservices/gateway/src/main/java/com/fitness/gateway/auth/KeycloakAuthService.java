package com.fitness.gateway.auth;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class KeycloakAuthService {

    private final WebClient keycloakWebClient;
    private final KeycloakProperties keycloakProperties;

    public Mono<TokenResponse> login(String username, String password) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "password");
        form.add("client_id", keycloakProperties.getClientId());
        form.add("username", username);
        form.add("password", password);

        if (keycloakProperties.getClientSecret() != null
                && !keycloakProperties.getClientSecret().isBlank()) {
            form.add("client_secret", keycloakProperties.getClientSecret());
        }

        return keycloakWebClient
                .post()
                .uri(keycloakProperties.getTokenUrl())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(BodyInserters.fromFormData(form))
                .retrieve()
                .onStatus(
                        status -> status.is4xxClientError() || status.is5xxServerError(),
                        response -> response
                                .bodyToMono(JsonNode.class)
                                .defaultIfEmpty(emptyError())
                                .flatMap(body -> Mono.error(toAuthException(response.statusCode().value(), body))))
                .bodyToMono(TokenResponse.class);
    }

    private static JsonNode emptyError() {
        return new com.fasterxml.jackson.databind.ObjectMapper().createObjectNode();
    }

    private static ResponseStatusException toAuthException(int statusCode, JsonNode body) {
        String description = body.path("error_description").asText(
                body.path("error").asText("Authentication failed"));
        HttpStatus status = statusCode == 401 ? HttpStatus.UNAUTHORIZED : HttpStatus.BAD_REQUEST;
        return new ResponseStatusException(status, description);
    }
}
