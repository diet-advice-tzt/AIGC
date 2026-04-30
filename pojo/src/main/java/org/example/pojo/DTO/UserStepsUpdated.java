package org.example.pojo.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@NoArgsConstructor
@Builder
@AllArgsConstructor
@Data
public class UserStepsUpdated {
    private Integer userId;
    private LocalDateTime stepDate;
    private Integer steps;
    private Long threadId;
}
