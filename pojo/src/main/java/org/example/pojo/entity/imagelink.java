package org.example.pojo.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class imagelink {

    private String imageUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long userId;
    private String sessionId;
    private  String threadId;

}
