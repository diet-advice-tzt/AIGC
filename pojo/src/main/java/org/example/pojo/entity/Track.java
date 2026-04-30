package org.example.pojo.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.awt.*;
import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Builder
@Data
public class Track {
    private  String trackId;
    private Number latitude;
    private Number longitude;
    private Point location;
    private LocalDateTime recordTime;
    private int totalDistance;
    private LocalDateTime createdAt;
    private int userId;
}
