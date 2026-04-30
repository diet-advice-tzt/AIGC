package org.example.pojo.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@NoArgsConstructor
@Builder
@Data
@AllArgsConstructor
public class UserTrackDTO {
    private int userId;
    private BigDecimal latitude;
     private BigDecimal longitude;
     private LocalDateTime recordTime;
}
