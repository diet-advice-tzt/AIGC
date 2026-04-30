package org.example.server.taskTime;

import lombok.extern.slf4j.Slf4j;
import org.example.pojo.entity.session;
import org.example.pojo.entity.user;
import org.example.server.mapper.AiMapper;
import org.example.server.mapper.ChatRecordMapper;
import org.example.server.mapper.ImageLink;
import org.example.server.mapper.SessionMapper;
import org.example.server.websocket.WebSocketServer1;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
@Slf4j
public class task {
    //每到月末的时间，就清除一部分sessionid及其对应的聊天内容
    //每隔一年，就像用户推送恭喜你使用app多少年
    //之后还要根据注册人数，来庆祝第几位用户的到来
    @Autowired
    private SessionMapper sessionMapper;
    @Autowired
    private ChatRecordMapper chatRecordMapper;
    @Autowired
    private ImageLink imageLink;
    @Autowired
    private WebSocketServer1 webSocketServer;
    @Autowired
    private AiMapper aiMapper;
    @Autowired(required = false)
    private RedisTemplate redisTemplate;
    @Scheduled(cron = "0 0 0 1 */2 *")
    public void deleteRecord(){
        List<session> list= sessionMapper.selectAllDeleteSession();
        sessionMapper.delete();
        List<String>sessionIdList=new ArrayList<>();
        for(session session:list){
            sessionIdList.add(session.getSessionKey());
        }
        chatRecordMapper.delete(sessionIdList);
        imageLink.delete(sessionIdList);
        //webSocketServer.sendToAllClient("用户你好,您有一部分聊天记录已经过期，系统自动帮你清除掉了,谢谢你的使用");
    }


    @Scheduled(cron = "0 0 0 * * *")
    public void push(){
       List<user>list= aiMapper.selectAllPeople();
       for(user user:list){
           LocalDateTime loginTime = user.getLoginTime();
           LocalDateTime now = LocalDateTime.now();
           Duration duration = Duration.between(loginTime, now);
           long minutes = duration.toMinutes();
           //webSocketServer.sendToAllClient("hello,亲爱的用户.你已经使用我们的软件"+minutes+"分钟了哦");
       }
    }

    @Scheduled(cron = "0 0 0 * * *")
    public void deleteEveryPersonPicture(){
        redisTemplate.delete("weatherImageUrl:*");
        log.info("删除了天气图片缓存,每天清除一次");
    }
    //ok了，这个项目算是基本完成了
}
