package org.example.pojo.VO;

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
public class DailyStepsVO {
    @ApiModelProperty("当天的日期")
    private LocalDateTime  date;
    @ApiModelProperty("当天的步数")
    private Integer steps;
    @ApiModelProperty("当天的排名")
    private Integer rank;
    @ApiModelProperty("AI对今天的评价")
    private String aiEvaluation;

}
