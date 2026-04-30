package org.example.properties;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties("race.language")
@Data
public class AiLanguageProperties {
    private String appId;
    private String appKey;
    private String httpMethod;
    private String httpUrl;
    private String requestUrl;

}
