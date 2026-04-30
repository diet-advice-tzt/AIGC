package org.example.pojo.VO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Builder
@Data
public class UserTrackVO {
    private String trackId;
    private String status;
    private LocalDateTime recordTime;
    private String remark;
}
