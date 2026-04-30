package org.example.utils;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@Data
@Builder
@NoArgsConstructor
public class AiLanguageUtil {
    private String appId;
    private String appKey;
    private String httpMethod;
    private String httpUrl;
    private String requestUrl;
}
