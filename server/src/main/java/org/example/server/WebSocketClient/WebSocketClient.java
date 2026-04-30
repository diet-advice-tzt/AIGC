package org.example.server.WebSocketClient;

import javax.websocket.ClientEndpoint;
import javax.websocket.Session;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.util.UUID;

@ClientEndpoint
public class WebSocketClient {
    private Session session;
    private String requestId;
    public WebSocketClient() {
       this.requestId= UUID.randomUUID().toString().replace("-", "");
       
    }
    public void onOpen(Session session) {
        this.session = session;
        
        System.out.println("WebSocket opened");
        sendInitialRequest();
    }

    private void sendInitialRequest() {
        try {
            // 构建初始JSON请求
            String jsonRequest = "{" +
                    "\"type\":\"started\"," +
                    "\"request_id\":\"" + requestId + "\"," +
                    "\"asr_info\":{" +
                    "\"end_vad_time\":10000," +
                    "\"audio_type\":\"pcm\"," +
                    "\"chinese2digital\":1," +
                    "\"punctuation\":1" +
                    "}" +
                    "}";

            // 发送文本消息
            session.getBasicRemote().sendText(jsonRequest);
            System.out.println("已发送初始请求: " + jsonRequest);

            // 模拟发送音频数据
            simulateAudioData();

        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    private void simulateAudioData() {
        try {
            // 模拟发送PCM音频数据（每帧40ms）
            // 实际应用中需要从麦克风或文件读取真实音频
            byte[] audioFrame = new byte[1280]; // 16kHz * 16bit * 0.04s = 1280字节

            for (int i = 0; i < 10; i++) { // 模拟发送10帧
                session.getBasicRemote().sendBinary(ByteBuffer.wrap(audioFrame));
                Thread.sleep(40); // 每40ms发送一帧
            }

            // 发送结束标记
            session.getBasicRemote().sendBinary(ByteBuffer.wrap("--end--".getBytes()));

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void onMessage(String message) {
        System.out.println("Received message: " + message);
    }
    public void onClose(int statusCode, String reason) {
        System.out.println("WebSocket closed with status code: " + statusCode + ", reason: " + reason);
    }
    public void onError(Throwable t) {
        System.out.println("WebSocket error: " + t.getMessage());
    }
   /*try {
        // 创建WebSocket连接
        WebSocketContainer container = ContainerProvider.getWebSocketContainer();
        String uri = "ws://api-ai.vivo.com.cn/asr/v2?model=vivo&system_version=13&client_version=1.0.0&package=com.example.app&sdk_version=1.0.0&user_id=1234567890abcdef1234567890abcdef&android_version=13&system_time=" + System.currentTimeMillis() + "&net_type=1&engineid=shortasrinput";

        // 构建请求头
        URI serverUri = new URI(uri);
        WebSocketClientExample client = new WebSocketClientExample();
        container.connectToServer(client, serverUri);

        // 保持主线程运行
        Thread.sleep(60000);

    } catch (Exception e) {
        e.printStackTrace();
    }
}*/
}
