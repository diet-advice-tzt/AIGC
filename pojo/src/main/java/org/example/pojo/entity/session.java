package org.example.pojo.entity;

import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class session {
    @ApiModelProperty(value = "用户id")
    private String userId;
    @ApiModelProperty(value = "sessionId")
    private String sessionKey;
    @ApiModelProperty(value = "创建时间")
    private LocalDateTime createdAt;
    private String threadId;
}
