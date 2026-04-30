package org.example.pojo.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Component;


@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserUpdateDTO {
    private Integer userId;
    private String username;
    private String password;
    private String email;
    private String avatarImageUrl;
}
