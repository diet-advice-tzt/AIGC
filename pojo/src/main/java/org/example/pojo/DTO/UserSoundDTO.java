package org.example.pojo.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@Data
@NoArgsConstructor
@Builder
public class UserSoundDTO {
    private String model;
    private String systemVersion;
    private String clientVersion;
    private String package1;
    private String sdkVersion ;
    private String userId;
    private String androidVersion;
    private String systemTime;
    private String netType;
    private String engineId;
}
