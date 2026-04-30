package org.example.server.controller.user;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.example.exception.NoSessionException;
import org.example.exception.NullUserException;
import org.example.pojo.DTO.*;
import org.example.pojo.VO.DailyStepsVO;
import org.example.pojo.VO.TrackGetVO;
import org.example.pojo.VO.UserInformationVO;
import org.example.pojo.VO.UserLoginVO;
import org.example.pojo.entity.user;
import org.example.properties.JwtProperties;
import org.example.result.Result;
import org.example.server.service.AiService;
import org.example.server.websocket.WebSocketServer1;
import org.example.utils.AiPictureSpecialUtil;
import org.example.utils.AiUtil;
import org.example.utils.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpSession;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
@Slf4j
@RequestMapping("/user")
@CrossOrigin
@Api("用户端ai开发")
public class ai {

     @Autowired
     private AiUtil aiUtil;
     @Autowired
     private AiService aiService;
     @Autowired
     private JwtProperties jwtProperties;
     @Autowired
     private WebSocketServer1 webSocketServer;
     @Autowired
     private AiPictureSpecialUtil  aiPictureSpecialUtil;
     @PostMapping("/questionSimple")
     @CrossOrigin(origins = "*")
     @ApiOperation(value="简单文本输出",notes = "服务器会自动生成或获取SessionID，用于会话管理")
     @CacheEvict(value = "queryRecord",key = "#userQuestionDTO.userId")
     public Result<Map<String,String>> questionSimple(@RequestBody UserQuestionDTO userQuestionDTO) throws Exception {
         String question = userQuestionDTO.getQuestion();
         String userId = userQuestionDTO.getUserId();
         String id = userQuestionDTO.getSessionId();
//          log.info("这是sessionid,{} question,{}",session.getId(),question);
          Map<String,String> map = new HashMap<>();
          map.put("success","完美的返回");
          String originalRespond=aiService.question(id,question,userId);
          //根据我要求的格式分割原始内容，并且按照时间-计划内容的格式装进map集合，然后返回给前端
          map.put("test","这是测试");
          map.put("Respond",originalRespond);
          return Result.success(map);
     }
     @PostMapping("/queryRecord")
     @ApiOperation("查询聊天记录接口开发")
     @Cacheable(value = "queryRecord",key = "#userId")
     public Result<List<Map>> queryRecord(@RequestParam Integer userId) throws Exception {
         List<Map> maps = aiService.selectAllRecord(userId);
         return Result.success(maps);
     }
//     <%@ page import="java.util.ArrayList" %>
//<%@ page import="com.example.Book" %>
//<%@ page language="java" contentType="text/html; charset=utf-8" pageEncoding="utf-8"%>
//<!DOCTYPE html>
//<html>
//<head>
//   <meta charset="utf-8">
//   <title>图书信息</title>
//</head>
//<body>
//<%
//    ArrayList<Book> books = new ArrayList<>();
//   books.add(new Book("1001", "Java", 10));
//   books.add(new Book("1002", "JSP", 20));
//   books.add(new Book("1003", "JavaWeb", 30));
//%>
//<table border="1">
//   <tr><th>图书编号</th><th>图书名称</th><th>借阅数</th></tr>
//   <% for (Book book : books) { %>
//       <tr>
//                <td><%= book.getId() %></td>
//                <td><%= book.getName() %></td>
//                <td><%= book.getCount() %></td>
//                </tr>
//                <% } %>
//</table>
//</body>
//</html>
     /*@GetMapping("/trace")
     @ApiOperation("轨迹和步数接口开发")
     public Result<String> trace(HttpSession session) throws Exception {}*/
   /* 数据库：
    步数数据：使用关系型数据库（如 MySQL、PostgreSQL），便于统计计数、复杂查询（如按时间范围统计步数）。
    轨迹数据：选用支持地理空间数据的数据库（如 MongoDB，其地理空间索引可优化轨迹坐标查询；或 PostGIS，扩展 PostgreSQL 对空间数据的支持），存储经纬度、时间戳等轨迹信息。*/
     @GetMapping("/steps/daily")
     @ApiOperation("获取用户今日步数")
     //根据展示的步数或者轨迹，调用ai，生成一段评价，并且返回给前端，要求短而精，调教一下
     public Result<DailyStepsVO> steps(@RequestParam Integer userId
     , @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDateTime date,HttpSession session) throws Exception {
         DailyStepsVO dailyStepsVO = aiService.steps(userId,date);
         if (dailyStepsVO == null) {
             return Result.error("没有数据");
         }
         if(dailyStepsVO.getAiEvaluation()==null){
             String string = aiUtil.getString("根据我今天所走的步数:" + dailyStepsVO.getSteps()+"步" + "给出一段不超过二十字的建议", session.getId());
             dailyStepsVO.setAiEvaluation(string);
         }
         return Result.success(dailyStepsVO);
     }
    @PostMapping("/steps/batch")
    @ApiOperation("上传用户步数")
    public Result stepBatch(@RequestBody UserStepsUpdated userStepsUpdated){
         aiService.stepBatch(userStepsUpdated);
         return Result.success();
    }
    @GetMapping("/tracks/{trackId}")
    @ApiOperation("轨迹数据获取")
    public  Result<TrackGetVO> getTrack(@PathVariable String trackId) throws Exception {
         TrackGetVO trackGetVO = aiService.getTrack(trackId);
         return Result.success(trackGetVO);
    }


   /* 二、核心功能实现所需组件
    步数功能：
    数据接收接口：前端（APP、小程序等）通过设备传感器（如手机步数传感器，调用 react-native-sensors 等库获取）获取步数，后端提供 RESTful 或 RPC 接口接收数据，格式如 JSON。
    统计逻辑：实现日、周、月步数统计，支持用户步数排名、目标达成判断等业务逻辑。
    轨迹功能：
    轨迹数据接收：前端通过 GPS 定位（如 HTML5 Geolocation API、微信小程序定位 API）获取实时坐标，后端接口接收并验证数据（如坐标范围检查）。
    存储与展示：将轨迹数据存入数据库，如需前端展示轨迹，可调用地图服务（如高德、百度地图 API），后端提供轨迹数据查询接口，供前端获取坐标序列绘制路径。
    简单分析：实现轨迹距离计算（通过经纬度公式）、速度统计（结合时间戳）等基础分析。
    三、第三方服务与集成
    地图服务：集成高德地图、百度地图等 API，用于轨迹可视化（后端可能需处理坐标转换或传递原始坐标给前端）。
    定位服务：若前端依赖第三方定位 SDK，后端需确保数据兼容性，如验证坐标格式、处理异常数据。*/



 /*   . 用户表（user）
    存储用户基本信息，关联步数和轨迹数据。

    sql
    CREATE TABLE user (
            id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
            username VARCHAR(50) NOT NULL COMMENT '用户名',
    phone VARCHAR(20) UNIQUE COMMENT '手机号',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_username (username)
) ENGINE=InnoDB COMMENT '用户表';
2. 步数记录表（step_record）
    按天记录用户步数，支持按日期统计。

    sql
    CREATE TABLE step_record (
            id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '记录ID',
            user_id BIGINT NOT NULL COMMENT '用户ID',
            record_date DATE NOT NULL COMMENT '记录日期（YYYY-MM-DD）',
            steps INT DEFAULT 0 COMMENT '步数',
            remark VARCHAR(200) COMMENT '备注（如运动类型）',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间',
    INDEX idx_user_date (user_id, record_date), -- 组合索引加速查询
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_date (user_id, record_date) -- 确保每日唯一
) ENGINE=InnoDB COMMENT '步数记录表';

3. 轨迹记录表（track_record）
    存储用户运动轨迹的详细坐标点（如跑步、骑行路线）。

    sql
    CREATE TABLE track_record (
            id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '轨迹ID',
            user_id BIGINT NOT NULL COMMENT '用户ID',
            track_uuid CHAR(36) NOT NULL COMMENT '轨迹唯一标识（UUID）',
    point_order INT NOT NULL COMMENT '轨迹点顺序（按时间排序）',
    latitude DECIMAL(10, 6) NOT NULL COMMENT '纬度（如30.123456）',
    longitude DECIMAL(11, 6) NOT NULL COMMENT '经度（如120.123456）',
    altitude FLOAT COMMENT '海拔（米）',
    speed FLOAT COMMENT '速度（米/秒）',
    record_time TIMESTAMP NOT NULL COMMENT '轨迹点时间',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_user_track (user_id, track_uuid), -- 按用户和轨迹分组查询
    INDEX idx_record_time (record_time) -- 按时间范围查询
) ENGINE=InnoDB COMMENT '轨迹记录表';*/
    //感觉前端实现起来会比较麻烦耶，后端貌似只需要查询呢


    /*数据格式优化：
    后端返回简化的坐标数组（如[{lat, lng, time}, ...]），前端直接调用地图库的polyline接口绘制路径：*/

    /*数据接口设计：
    后端直接返回统计好的数据（如{ date: '2025-05', steps: 15000 }），前端只需渲染：*/
    /*实时数据同步
    难点：实时更新步数或轨迹（如运动中实时显示路线）。
    解决方案：
    WebSocket：后端通过 WebSocket 推送实时数据（如每 5 秒更新一次位置），前端监听并更新地图：*/


    /*数据预处理与聚合
    轨迹简化：对密集轨迹点进行抽稀（如每 10 秒保留一个点），减少前端渲染压力：
    java
    // 示例：Java中使用Douglas-Peucker算法简化轨迹
    List<TrackPoint> simplifiedPoints = DouglasPeucker.simplify(trackPoints, 10.0); // 距离阈值10米


    步数统计接口：直接返回聚合结果（如 “本周总步数”），避免前端处理大量明细数据：
    sql
    SELECT SUM(steps) AS total_steps FROM step_record
    WHERE user_id = ? AND record_date BETWEEN ? AND ?;*/
     @PostMapping("/login")
     @ApiOperation("登录接口的实现")
     public Result<UserLoginVO> login(@RequestBody UserLoginDTO userLoginDTO,HttpSession session) throws Exception {
         log.info("用户登录：{}",userLoginDTO);
         String  sessionId=session.getId();
         user user =aiService.login(userLoginDTO,sessionId);
         if(user==null){
            throw new NullUserException("没有这个用户,请注册账号");
         }
         Map<String,Object> map = new HashMap<>();
         map.put("userId",user.getId());
         String jwt = JwtUtil.createJWT(jwtProperties.getUserSecretKey(), jwtProperties.getUserTtl(), map);
         log.info("token:{}，用户信息{}",jwt,user);
         UserLoginVO userLoginVO = UserLoginVO.builder()
                 .id(user.getId())
                 .username(user.getUsername())
                 .name(user.getName())
                 .token(jwt)
                 .sessionId(sessionId)
                 .build();
         return Result.success(userLoginVO);
     }




     @PostMapping("/register")
     @ApiOperation("注册接口开发")
     public Result<String> register(@RequestBody UserLoginDTO userLoginDTO) throws Exception {
         aiService.register(userLoginDTO);
         return Result.success("注册成功,请重新登录");
     }
     @PostMapping("/picture")
     @ApiOperation("图像生成接口开发")
     @CacheEvict(value = "queryRecord",key = "#userPictureDTO.userId")
    public Result<String> picture(@RequestBody UserPictureDTO userPictureDTO) throws Exception {
         String message = userPictureDTO.getPicture();
         if(message==null){
             throw new NoSessionException("请重新输入");
         }
         String userId = userPictureDTO.getUserId();
         String id = userPictureDTO.getSessionId();
         String imageUrl=aiService.queryPicture(message,id,userId);
         return Result.success(imageUrl);
     }
     @PostMapping("/newSpeak/{userId}")
     @ApiOperation(value = "开启新对话接口开发",notes = "前端直接传来一个空的session对象就可以了,我来创建新的session")
    public Result<Map<String,String>> newSpeak(@PathVariable Integer userId,HttpSession session) throws Exception {
             Map<String,String> map = new HashMap<>();
             String id1 = session.getId();
             map.put("SessionId",id1);
             map.put("userId",userId.toString());
             map.put("success","true");
             aiService.insertNewSession(userId,id1);
             return Result.success(map);
             //这部分逻辑就别加了，传过来的反正一定为空，holly谢bro
     }
     @PostMapping("/show/{id}")
     @ApiOperation("展示用户的基本信息")
     public Result<UserInformationVO> show(@PathVariable String id) throws Exception{
         user user = aiService.show(id);
         if(user==null){
             throw new NullUserException("没有这个用户");
         }
         UserInformationVO userInformationVO = UserInformationVO.builder()
                 .username(user.getUsername())
                 .email(user.getEmail())
                 .imageUrl(user.getImageUrl())
                 .password(user.getPassword())
                 .weatherImageUrl(user.getWeatherImageUrl())
                 .avatarImageUrl(user.getAvatarImageUrl())
                 .build();
         return Result.success(userInformationVO);
     }





     @PostMapping("/update")
     @ApiOperation("修改用户基本信息")
     @CrossOrigin
      public Result update(@RequestBody UserUpdateDTO userUpdateDTO) throws Exception {
         log.info("这是userUpdateDTO:{}",userUpdateDTO);
         aiService.update(userUpdateDTO);
         return Result.success();

     }

     @GetMapping("/delete/{id}")
     @ApiOperation("删除用户信息")
     public Result delete(@PathVariable String id) throws Exception {
         aiService.delete(id);
         return Result.success();

     }
    /* @GetMapping("/statistic")
     @ApiOperation("统计表的生成")
     public Result<>*/




     //查询历史聊天记录,使用redis









}
