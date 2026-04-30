package org.example.server.websocket;

import com.alibaba.fastjson.JSON;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.example.pojo.DTO.UserTrackDTO;
import org.example.pojo.VO.UserTrackVO;
import org.example.pojo.entity.Track;
import org.example.server.mapper.AiMapper;
import org.example.utils.AiUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import javax.servlet.http.HttpSession;
import java.awt.*;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Logger;

@Component
public class WebSocketServer1 extends TextWebSocketHandler {

    @Autowired
    private AiMapper aiMapper;

    @Autowired
    private AiUtil aiUtil;

    // 保持原有会话管理逻辑
    private static final ConcurrentHashMap<String, WebSocketSession> sessionMap = new ConcurrentHashMap<>();
    private static final Logger logger = Logger.getLogger(WebSocketServer1.class.getName());

    private final ObjectMapper objectMapper;

    public WebSocketServer1() {
        this.objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    // 对应原@OnOpen逻辑
    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String sid = extractSidFromUri(session.getUri().getPath());
        sessionMap.put(sid, session);
        logger.info(String.format("[连接建立] 客户端: %s | 当前在线: %d", sid, sessionMap.size()));
    }

    // 对应原@OnMessage逻辑
    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String sid = extractSidFromUri(session.getUri().getPath());
        String userTrackDTO1 = message.getPayload();

        try {
            UserTrackDTO userTrackDTO = objectMapper.readValue(userTrackDTO1, UserTrackDTO.class);
            System.out.println("收到来自客户端：" + sid + "的轨迹信息:" + userTrackDTO);

            //调用aimapper中的方法来计算这个点到最初的点的 距离
            Integer distance=aiMapper.getDistance(userTrackDTO);
            if(distance==null){
                distance=3000;
            }
            String message1="这是我今天走路的距离，请根据这个距离帮我生成一段不超过二十个字的建议，距离为:"+ distance;
            String string = aiUtil.getString(message1, session.getId());
            // 保持生成taskId的逻辑不变
            StringBuilder taskId1 = new StringBuilder();
            BigDecimal latitude = userTrackDTO.getLatitude();
            BigDecimal longitude = userTrackDTO.getLongitude();
            LocalDateTime recordTime = userTrackDTO.getRecordTime();
            int userId = userTrackDTO.getUserId();
            String taskId = taskId1.append(latitude).append(longitude).append(recordTime).append(userId).toString();
            Track track = Track.builder()
                    .trackId(taskId)
                    .latitude(latitude)
                    .longitude(longitude)
                    .recordTime(recordTime)
                    .totalDistance(distance)
                    .createdAt(LocalDateTime.now())
                    .userId(userId)
                    .build();
            aiMapper.insertNewTrack(track);
            UserTrackVO userTrackVO = UserTrackVO.builder()
                    .trackId(taskId)
                    .status("success")
                    .recordTime(recordTime)
                    .remark(string)
                    .build();

            sendToSpecificClient(userTrackVO, sid);
        } catch (Exception e) {
            System.out.println("解析失败");
            throw e;
        }
    }

    // 对应原@OnClose逻辑
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String sid = extractSidFromUri(session.getUri().getPath());
        WebSocketSession removed = sessionMap.remove(sid);
        if (removed != null) {
            logger.info(String.format("[连接关闭] 客户端: %s | 当前在线: %d", sid, sessionMap.size()));
        }
        logger.info(String.format("[连接关闭] 剩余在线: %d", sessionMap.size()));
    }

    // 发送消息给指定客户端（保持原有逻辑）
    public void sendToSpecificClient(UserTrackVO userTrackVO, String sid) {
        WebSocketSession session = sessionMap.get(sid);
        try {
            if (session != null && session.isOpen()) {
                // 1. 将对象转成 JSON 字符串
                String json = JSON.toJSONString(userTrackVO);
                // 2. 封装成 Spring 的 TextMessage
                TextMessage message = new TextMessage(json);
                // 3. 直接用 Spring 提供的 sendMessage 方法发送
                session.sendMessage(message);
            } else {
                logger.warning("客户端[" + sid + "]会话已关闭");
                sessionMap.remove(sid);
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    // 从URI中提取sid（保持URL路径不变）
    private String extractSidFromUri(String uri) {
        // 原URL路径为/realtime/{sid}，提取最后一段
        String[] parts = uri.split("/");
        return parts.length >= 2 ? parts[parts.length - 1] : "unknown";
    }
}
/*ava @Component @ServerEndpoint("/ws/{sid}") public class WebSocketServer { // 使用线程安全集合存储会话
private static final ConcurrentMap<String, Session> SESSION_MAP = new ConcurrentHashMap<>();
private static final Logger LOGGER = LoggerFactory.getLogger(WebSocketServer.class);
    *//**
     * 连接建立处理器
     * @param session 会话对象
     * @param sid 客户端唯一标识
     *//*
    @OnOpen
    public void onOpen(Session session, @PathParam("sid") String sid) {
        SESSION_MAP.put(sid, session);
        LOGGER.info("[连接建立] 客户端: {} | 当前在线: {}", sid, SESSION_MAP.size());
    }

    *//**
     * 消息接收处理器
     * @param message 消息内容
     * @param sid 客户端标识
     *//*
    @OnMessage
    public void onMessage(String message, @PathParam("sid") String sid) {
        LOGGER.info("[消息接收] 客户端: {} | 内容: {}", sid, message);
        // 添加消息处理逻辑（如消息路由）
    }

    *//**
     * 连接关闭处理器
     * @param sid 客户端标识
     *//*
    @OnClose
    public void onClose(@PathParam("sid") String sid) {
        Session session = SESSION_MAP.remove(sid);
        if (session != null) {
            LOGGER.info("[连接关闭] 客户端: {} | 剩余在线: {}", sid, SESSION_MAP.size());
        }
    }

    *//**
     * 增强型广播消息方法
     * @param message 消息内容
     *//*
    public void sendToAllClient(String message) {
        SESSION_MAP.forEach((sid, session) -> {
            try {
                if (session.isOpen()) {
                    session.getBasicRemote().sendText(message);
                    LOGGER.debug("[消息广播] 客户端: {} | 状态: 成功", sid);
                } else {
                    LOGGER.warn("[会话异常] 客户端: {} | 状态: 连接已关闭", sid);
                    SESSION_MAP.remove(sid);
                }
            } catch (Exception e) {
                LOGGER.error("[消息异常] 客户端: {} | 错误: {}", sid, e.getMessage());
                SESSION_MAP.remove(sid);
            }
        });
    }
}*/
