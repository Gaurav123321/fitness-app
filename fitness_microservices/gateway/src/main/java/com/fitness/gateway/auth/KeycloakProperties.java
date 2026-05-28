package com.fitness.gateway.auth;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "keycloak")
public class KeycloakProperties {
    private String tokenUrl = "http://localhost:8181/realms/fitness-app/protocol/openid-connect/token";
    private String clientId = "fitness-frontend";
    private String clientSecret = "";
}
