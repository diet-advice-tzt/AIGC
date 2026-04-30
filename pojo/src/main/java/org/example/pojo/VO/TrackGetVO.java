package org.example.pojo.VO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.pojo.entity.location;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Map;

@AllArgsConstructor
 @Builder
@NoArgsConstructor
@Data
public class TrackGetVO {
    private String trackId;
    private int totalDistance;
    private ArrayList<location>  points;
}
