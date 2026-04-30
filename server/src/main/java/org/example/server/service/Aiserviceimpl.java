package org.example.server.service;

import lombok.extern.slf4j.Slf4j;
import org.example.context.BaseContext;
import org.example.enumeration.OperationType;
import org.example.exception.ExistingUserException;
import org.example.pojo.DTO.UserLoginDTO;
import org.example.pojo.DTO.UserStepsUpdated;
import org.example.pojo.DTO.UserUpdateDTO;
import org.example.pojo.VO.AllImageRecordVO;
import org.example.pojo.VO.AllRecordVO;
import org.example.pojo.VO.DailyStepsVO;
import org.example.pojo.VO.TrackGetVO;
import org.example.pojo.entity.*;
import org.example.server.annotation.AutoUpload;
import org.example.server.controller.ai.copyPicture;
import org.example.server.mapper.AiMapper;
import org.example.server.mapper.ChatRecordMapper;
import org.example.server.mapper.ImageLink;
import org.example.server.mapper.SessionMapper;
import org.example.utils.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@Slf4j
public class Aiserviceimpl implements AiService{
    @Autowired
    private AiUtil aiUtil;
    @Autowired
    private AiMapper aiMapper;
    @Autowired
    private AiPictureUtil aiPictureUtil;
    @Autowired
    private AiQueryPictureUtil aiQueryPictureUtil;
    @Autowired
    private SessionMapper sessionMapper;
    @Autowired
    private ChatRecordMapper chatRecordMapper;
    @Autowired
    private ImageLink imageLink;
    @Autowired
    private AliOssUtil aliOssUtil;
    @Autowired
    private AiPictureSpecialUtil  aiPictureSpecialUtil;
    @Autowired(required = false)
    private StringRedisTemplate redisTemplate;

    //图像保存逻辑有问题，记得上传到自己的oss阿里云上面
    //否则连接可能会失效
    @Override
    @Transactional
    public String question(String SessionId,String question,String userId) throws Exception {
        String string = aiUtil.getString(question, SessionId);
        Long currentId = BaseContext.getCurrentId();
        log.info("这是sessionid,{} question,{},currentId,{}",SessionId,question,currentId);
        chatRecord  chatRecord= org.example.pojo.entity.chatRecord.builder()
                .createdAt(LocalDateTime.now())
                .sessionId(SessionId)
                .content(string)
                .updatedAt(LocalDateTime.now())
                .userId(Long.valueOf(userId))
                .threadId(currentId.toString())
                .build();
        chatRecordMapper.insertNewRecord(chatRecord);
        return string;

    }

    @Override
    public user login(UserLoginDTO userLoginDTO,String SessionId) throws Exception {
        user user = aiMapper.login(userLoginDTO);
       //  Long id = user.getId();
        session session= org.example.pojo.entity.session.builder()
                        .createdAt(LocalDateTime.now())
                                .sessionKey(SessionId)
                                        .userId(user.getId().toString())
                .build();
        sessionMapper.insertSessionId(session);
        return user;
    }

    @Override
    public void register(UserLoginDTO userLoginDTO) throws ExistingUserException {
        user login = aiMapper.login(userLoginDTO);
        if (login != null) {
            throw new ExistingUserException("用户已经存在，请不要注册重复的账号");
        }
        user user1 = new user();
        user1.setUsername(userLoginDTO.getUsername());
        user1.setPassword(userLoginDTO.getPassword());
        user1.setEmail(userLoginDTO.getEmail());
        user1.setLoginTime(LocalDateTime.now());
        user1.setCount(0L);
        user1.setUpdatedAt(LocalDateTime.now());
        user1.setLogoutTime(LocalDateTime.now());
        aiMapper.insertNewUser(user1);
    }

    @Override
//    @AutoUpload(value = OperationType.INSERT, urlField = "imageUrl")
    public String queryPicture(String message, String id,String userId) throws Exception {
        String taskId = aiPictureUtil.getTaskId(message);
        String picture = aiQueryPictureUtil.getPicture(taskId);
        Long currentId = BaseContext.getCurrentId();
        imagelink imagelink= org.example.pojo.entity.imagelink.builder()
                .createdAt(LocalDateTime.now())
                .userId(Long.valueOf(userId))
                .updatedAt(LocalDateTime.now())
                .sessionId(id)
                .threadId(currentId.toString())
                .build();
        MultipartFile multipartFile= copyPicture.convertUrlToMultipartFile(picture);
        picture=multipartFile.getOriginalFilename();
        log.info("这是picture,{}",picture);
        /*try{
                String fileName = file.getOriginalFilename();
                String extName=null;
                if(fileName!=null){
                    extName=fileName.substring(fileName.lastIndexOf("."));

                }
                String uuid= UUID.randomUUID().toString()+extName;
                String upload = aliOssUtil.upload(file.getBytes(), uuid);
                return Result.success(upload);
            } catch (IOException e) {
                throw new RuntimeException(e);
            }*/
        String extName= picture.substring(picture.lastIndexOf("."));
        String extName1=extName.substring(0,4);
        String uuid= UUID.randomUUID().toString()+extName1;
        String upload = aliOssUtil.upload(multipartFile.getBytes(), uuid);
        imagelink.setImageUrl(upload);
        imageLink.insertNewPicture(imagelink);
        return upload;
    }

    @Override
    public void insertNewSession(Integer userId, String id1) {
        Long currentId = BaseContext.getCurrentId();
        session session= org.example.pojo.entity.session.builder()
                .userId(userId.toString())
                .sessionKey(id1).createdAt(LocalDateTime.now())
                .threadId(currentId.toString())
                .build();
        sessionMapper.insertSessionId(session);
    }

    @Override
    public List<Map> selectAllRecord(Integer userId) {
         //每一块sessionid所需要包含的信息有什么呢，记录内容，最后一次更新时间和使用时间，用户名
           List<String> sessionList= sessionMapper.selectSessionId(userId);
           List<Map> list = new ArrayList<>();
            for(int i=0; i<sessionList.size(); i++){
               String s = sessionList.get(i);
               //现在要查找sessionid是这个的所有有关数据
                Map<String,List> map=new HashMap();
                chatRecord chatRecord= org.example.pojo.entity.chatRecord.builder()
                        .sessionId(s)
                        .userId(userId.longValue())
                        .build();
                List<AllRecordVO> allRecordVOS = aiMapper.selectAllChatRecord(chatRecord);
                if(allRecordVOS!=null){
                    map.put("文本对话",allRecordVOS);
                }
                imagelink imagelink= org.example.pojo.entity.imagelink.builder()
                        .sessionId(s)
                        .userId(userId.longValue())
                        .build();
                List<AllImageRecordVO> allImageRecordVOS = aiMapper.selectAllImage(imagelink);
                if(allImageRecordVOS!=null){
                    map.put("图像生成",allImageRecordVOS);
                }
                List<String>list1=new ArrayList<>();
                list1.add(s);
                map.put("sessionId",list1);
                list.add(map);
            }
            return list;

    }

    @Override
    public user show(String id) throws Exception {
        user user = aiMapper.show(id);
        log.info("这是user{}", user);
        if(user==null){
            throw new RuntimeException("用户不存在");
        }
        //获取天气图片，使用redis缓存数据，要不然一直往oss发送图片，太占内存了
        //每天更新一次这个图片，卧槽，感觉好麻烦。。。。。
        String object =(String) redisTemplate.opsForValue().get("weatherImageUrl:"+ id);
        log.info("这是object,{}",object);
        //我需要让他过了一天之后，再更新一次
        if(object==null){
            String taskId = aiPictureSpecialUtil.getTaskId();
            String picture = aiQueryPictureUtil.getPicture(taskId);
            MultipartFile multipartFile= copyPicture.convertUrlToMultipartFile(picture);
            picture=multipartFile.getOriginalFilename();
            String extName= picture.substring(picture.lastIndexOf("."));
            String extName1=extName.substring(0,4);
            String uuid= UUID.randomUUID()+extName1;
            String upload = aliOssUtil.upload(multipartFile.getBytes(), uuid);
            redisTemplate.opsForValue().set("weatherImageUrl:"+id,upload);
            user.setWeatherImageUrl(upload);
        }else {
            user.setWeatherImageUrl(object);
        }
        log.info("这是user2222{}", user);
        return user;
    }

    @Override
    public void update(UserUpdateDTO userUpdateDTO) {
        aiMapper.update(userUpdateDTO);
    }

    @Override
    public void delete(String id) {
        aiMapper.delete(id);
    }

    @Override
    public DailyStepsVO steps(Integer userId, LocalDateTime date) {
        if(date==null){
            date=LocalDateTime.now();
        }
        UserSteps userSteps= org.example.pojo.entity.UserSteps.builder()
                .userId(userId)
                .stepDate(date)
                .build();
        return aiMapper.steps(userSteps);
    }

    @Override
    public void stepBatch(UserStepsUpdated userStepsUpdated) {
        //更新完之后要统计排名。也就是说根据步数要重新排名
        //批量更新吧，反正这种app也是百万级别以下的。数据库压力先不用管
        Long currentId = BaseContext.getCurrentId();
         userStepsUpdated.setThreadId(currentId);
        List<DailyStepsVO> steps = aiMapper.selectAllSteps();
        if(steps!=null&& !steps.isEmpty()){
            aiMapper.stepBatch(userStepsUpdated);
            //根据步数更新排名
            steps.sort(new Comparator<DailyStepsVO>() {
                @Override
                public int compare(DailyStepsVO o1, DailyStepsVO o2) {
                    return o2.getSteps()-o1.getSteps();
                }
            });
            for(int i=0; i<steps.size(); i++){
                DailyStepsVO dailyStepsVO = steps.get(i);
                dailyStepsVO.setRank(i+1);
                aiMapper.updateSteps(dailyStepsVO);
            }
        }else{
            aiMapper.insertNewSteps( userStepsUpdated);
        }
    }

    @Override
    public TrackGetVO getTrack(String trackId) {
         Track track = aiMapper.getTrack(trackId);
         ArrayList< location> points= new ArrayList<>();
        LocalDateTime recordTime = track.getRecordTime();
        Instant instant = recordTime.toInstant(ZoneOffset.of("+8"));

        location location=org.example.pojo.entity.location.builder()
                 .latitude(track.getLatitude())
                 .longitude(track.getLongitude())
                 .time(instant.toString())
                 .build();
         points.add(location);
         return TrackGetVO.builder()
                 .trackId(track.getTrackId())
                 .totalDistance(track.getTotalDistance())
                 .points(points)
                 .build();
    }
}
