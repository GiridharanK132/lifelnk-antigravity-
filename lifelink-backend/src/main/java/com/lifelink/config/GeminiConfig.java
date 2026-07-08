package com.lifelink.config;

import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GeminiConfig {
    private static final Logger logger = LoggerFactory.getLogger(GeminiConfig.class);

    @Value("${google.gemini.api-key:}")
    private String apiKey;

    @Value("${google.gemini.model:gemini-1.5-flash}")
    private String modelName;

    @Bean
    public ChatLanguageModel chatLanguageModel() {
        // Handle cases where property might resolve to default or remain un-substituted
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.contains("GEMINI_API_KEY")) {
            logger.warn("GEMINI_API_KEY is not configured. AI Agents will run in fallback simulation mode.");
            return null;
        }
        try {
            logger.info("Initializing Google Gemini Chat Model: {}", modelName);
            return GoogleAiGeminiChatModel.builder()
                    .apiKey(apiKey)
                    .modelName(modelName)
                    .temperature(0.2)
                    .build();
        } catch (Exception e) {
            logger.error("Failed to initialize Google Gemini Chat Model: {}. Falling back to simulation.", e.getMessage());
            return null;
        }
    }
}
