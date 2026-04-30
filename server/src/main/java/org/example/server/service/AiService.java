package org.example.server.service;

import org.example.exception.ExistingUserException;
import org.example.pojo.DTO.UserLoginDTO;
import org.example.pojo.DTO.UserStepsUpdated;
import org.example.pojo.DTO.UserUpdateDTO;
import org.example.pojo.VO.DailyStepsVO;
import org.example.pojo.VO.TrackGetVO;
import org.example.pojo.entity.user;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public interface AiService {
    String question(String SessionId, String question,String userId) throws Exception;

    user login(UserLoginDTO userLoginDTO,String sessionId) throws Exception;

    void register(UserLoginDTO userLoginDTO) throws ExistingUserException;

    String queryPicture(String message, String id,String userId) throws Exception;

    void insertNewSession(Integer userId, String id1);

    List<Map> selectAllRecord(Integer userId);

    user show(String id) throws Exception;

    void update(UserUpdateDTO userUpdateDTO);

    void delete(String id);

    DailyStepsVO steps(Integer userId, LocalDateTime date);

    void stepBatch(UserStepsUpdated userStepsUpdated);

    TrackGetVO getTrack(String trackId);
}
