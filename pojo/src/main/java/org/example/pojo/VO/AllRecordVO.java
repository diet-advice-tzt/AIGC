package org.example.pojo.VO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AllRecordVO implements Serializable {
    private static final long serialVersionUID = 1L;
    private String username;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String content;

}
//记录内容，最后一次更新时间和使用时间，用户名