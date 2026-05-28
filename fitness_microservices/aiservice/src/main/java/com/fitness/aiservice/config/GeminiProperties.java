package com.fitness.aiservice.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "gemini.api")
public class GeminiProperties {

    /**
     * Model id, e.g. gemini-2.0-flash
     */
    private String model = "gemini-2.0-flash";

    private String key = "";

    public String resolveUrl() {
        return "https://generativelanguage.googleapis.com/v1beta/models/"
                + model
                + ":generateContent";
    }

    public boolean isConfigured() {
        return key != null && !key.isBlank();
    }
}
