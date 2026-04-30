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
public class UserSteps {
    private Integer userId;
    private LocalDateTime stepDate;
    private Integer steps;
    private String aiEvaluation;
    private Integer rank;

}
