package com.fitness.aiservice.service;

import com.fitness.aiservice.config.GeminiProperties;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class GeminiService {

    private final WebClient webClient;
    private final GeminiProperties geminiProperties;

    @PostConstruct
    void logGeminiStatus() {
        if (geminiProperties.isConfigured()) {
            log.info(
                    "Gemini API configured (model={}, key=***{})",
                    geminiProperties.getModel(),
                    maskTail(geminiProperties.getKey()));
        } else {
            log.warn(
                    "GEMINI_KEY is not set — set env GEMINI_KEY or add gemini.api.key in application-local.yml");
        }
    }

    private static String maskTail(String key) {
        if (key.length() <= 4) {
            return "****";
        }
        return key.substring(key.length() - 4);
    }

    public String getRecommendations(String details) {
        if (!geminiProperties.isConfigured()) {
            return null;
        }

        String apiUrl = geminiProperties.resolveUrl();

        Map<String, Object> requestBody =
                Map.of(
                        "contents",
                        new Object[] {
                            Map.of("parts", new Object[] {Map.of("text", details)})
                        },
                        "generationConfig",
                        Map.of("temperature", 0.7, "maxOutputTokens", 2048));

        try {
            String response =
                    webClient
                            .post()
                            .uri(apiUrl)
                            .header("Content-Type", "application/json")
                            .header("x-goog-api-key", geminiProperties.getKey())
                            .bodyValue(requestBody)
                            .retrieve()
                            .bodyToMono(String.class)
                            .block();

            log.info("Gemini API call succeeded for model {}", geminiProperties.getModel());
            return response;
        } catch (WebClientResponseException e) {
            log.error(
                    "Gemini API error {} for model {}: {}",
                    e.getStatusCode(),
                    geminiProperties.getModel(),
                    e.getResponseBodyAsString());
            return null;
        } catch (Exception e) {
            log.error("Gemini API call failed", e);
            return null;
        }
    }
}
