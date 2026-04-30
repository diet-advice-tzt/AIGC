package org.example.server.mapper;

import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;
import org.example.pojo.DTO.UserLoginDTO;
import org.example.pojo.DTO.UserStepsUpdated;
import org.example.pojo.DTO.UserTrackDTO;
import org.example.pojo.DTO.UserUpdateDTO;
import org.example.pojo.VO.AllImageRecordVO;
import org.example.pojo.VO.AllRecordVO;
import org.example.pojo.VO.DailyStepsVO;
import org.example.pojo.entity.*;

import java.util.List;

@Mapper
public interface AiMapper {
    user login(UserLoginDTO userLoginDTO);

    void insertNewUser(user user1);


    List<AllRecordVO> selectAllChatRecord(chatRecord chatRecord);

    List<AllImageRecordVO> selectAllImage(imagelink imagelink);
    @Select("SELECT *" +
            "FROM raceuser WHERE MOD(" +
            "    TIMESTAMPDIFF(SECOND, login_time, NOW())," +
            "    300 " +
            ") = 0;")
    List<user> selectAllPeople();
    @Select(
            "select * from sky_take_out.raceuser where id=#{id}"
    )
    user show(String id);

    void update(UserUpdateDTO userUpdateDTO);
    @Delete("delete from sky_take_out.raceuser where id=#{id}")
    void delete(String id);

    DailyStepsVO steps(UserSteps userSteps);

    void stepBatch(UserStepsUpdated userStepsUpdated);
    @Select("select * from sky_take_out.user_steps where step_date >= CURDATE() and step_date < DATE_ADD(CURDATE(), INTERVAL 1 DAY)")
    List<DailyStepsVO> selectAllSteps();
    @Update("update sky_take_out.user_steps set `rank`=#{rank} " +
            "where user_id=#{userId} " +
            "and step_date >= DATE_FORMAT(#{stepDate}, '%Y-%m-%d 00:00:00') " +
            "and step_date < DATE_FORMAT(DATE_ADD(#{stepDate}, INTERVAL 1 DAY), '%Y-%m-%d 00:00:00')")
    void updateSteps(DailyStepsVO dailyStepsVO);

    Track getTrack(String trackId);

    void insertNewTrack(Track userTrackDTO);

    void insertNewSteps(UserStepsUpdated userStepsUpdated);
    @Select("SELECT " +
            "    ST_Distance_Sphere(" +
            "        POINT(#{longitude}, #{latitude})," +
            "        first_point.location" +
            "    ) AS distance_meters " +
            "FROM (" +
            "    SELECT location " +
            "    FROM user_track " +
            "    WHERE " +
            "        user_id = #{userId} " +
            "        AND DATE(record_time) = DATE(#{recordTime}) " +
            "    ORDER BY record_time ASC " +
            "    LIMIT 1 " +
            ") first_point;")
    Integer getDistance(UserTrackDTO userTrackDTO);
}
