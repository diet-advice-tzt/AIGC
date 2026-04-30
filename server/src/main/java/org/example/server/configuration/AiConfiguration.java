package org.example.server.configuration;

import lombok.extern.slf4j.Slf4j;
import org.example.properties.AiPictureProperties;
import org.example.properties.AiProperties;
import org.example.properties.AiQueryPictureProperties;
import org.example.utils.AiPictureSpecialUtil;
import org.example.utils.AiPictureUtil;
import org.example.utils.AiQueryPictureUtil;
import org.example.utils.AiUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@Slf4j
public class AiConfiguration {
    @Bean
    public AiUtil aiUtil(AiProperties aiProperties) {
        return new AiUtil(aiProperties.getApiKey(),aiProperties.getApiKey1(),aiProperties.getDeepSeekUrl(),
                aiProperties.getTongYingUrl(), aiProperties.getAppId(), aiProperties.getAppKey(), aiProperties.getHttpMethod(), aiProperties.getHttpUrl(), aiProperties.getRequestUrl());
    }
    @Bean
    public AiPictureUtil aiPictureUtil(AiPictureProperties aiPictureProperties) {
        return new AiPictureUtil(aiPictureProperties.getAppId(),aiPictureProperties.getAppKey(),aiPictureProperties.getHttpMethod(),aiPictureProperties.getHttpUrl(),aiPictureProperties.getRequestUrl());
    }
    @Bean
    public AiQueryPictureUtil aiQueryPictureUtil(AiQueryPictureProperties aiQueryPictureProperties) {
        return new AiQueryPictureUtil(aiQueryPictureProperties.getAppId(),aiQueryPictureProperties.getAppKey(),aiQueryPictureProperties.getHttpMethod(),aiQueryPictureProperties.getHttpUrl(),aiQueryPictureProperties.getRequestUrl());
    }
    @Bean
    public AiPictureSpecialUtil aiPictureSpecialUtil(AiPictureProperties aiPictureProperties) {
        return new AiPictureSpecialUtil(aiPictureProperties.getAppId(),aiPictureProperties.getAppKey(),aiPictureProperties.getHttpMethod(),aiPictureProperties.getHttpUrl(),aiPictureProperties.getRequestUrl());
    }
}
