package com.fitness.aiservice.service;

import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Service
public class GeminiService {

    private static final String DEFAULT_API_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

    private final WebClient webClient;
    private final String geminiApiUrl;
    private final String geminiApiKey;

    public GeminiService(WebClient.Builder webClientBuilder, Environment env) {
        this.webClient = webClientBuilder.build();
        String url = env.getProperty("gemini.api.url", DEFAULT_API_URL);
        if (url == null || url.isBlank() || isPlaceholderToken(url)) {
            url = DEFAULT_API_URL;
        }
        this.geminiApiUrl = url;
        this.geminiApiKey = env.getProperty("gemini.api.key", "");
    }

    /** Raw config like {@code ${GEMINI_URL}} is never resolved by the client; fall back to default URL. */
    private static boolean isPlaceholderToken(String value) {
        return value.startsWith("${") && value.endsWith("}");
    }

    public String getRecommendations(String details) {

        Map<String, Object> requestBody =
                Map.of(
                        "contents",
                        new Object[] {
                            Map.of("parts", new Object[] {Map.of("text", details)})
                        });
        String response =
                webClient
                        .post()
                        .uri(geminiApiUrl)
                        .header("Content-Type", "application/json")
                        .header("x-goog-api-key", geminiApiKey)
                        .bodyValue(requestBody)
                        .retrieve()
                        .bodyToMono(String.class)
                        .block();

        return response;
    }
}
