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
public class AllImageRecordVO implements Serializable {
    private static final long serialVersionUID = 1L;
    private String username;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String imageUrl;
}
