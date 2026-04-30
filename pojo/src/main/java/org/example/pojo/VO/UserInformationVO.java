package org.example.pojo.VO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class UserInformationVO {
    private String username;
    private String email;
    private String imageUrl;
    private String password;
    private String weatherImageUrl;
    private String avatarImageUrl;
}
