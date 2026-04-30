package org.example.utils;

import com.alibaba.fastjson.JSONObject;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.utils.URIBuilder;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.logging.Logger;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Slf4j
public class AiQueryPictureUtil {
    private String appId;
    private String appKey;
    private String httpMethod;
    private String httpUrl;
    private String requestUrl;
    public String getPicture(String taskId) throws Exception {
        CloseableHttpClient httpClient = HttpClients.createDefault();
        URIBuilder uriBuilder=new URIBuilder(requestUrl);
        uriBuilder.addParameter("task_id", taskId);
        URI build = uriBuilder.build();
        HttpGet httpGet = new HttpGet(build);
        final String ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        StringBuilder sb = new StringBuilder(8);
        SecureRandom secureRandom = new SecureRandom();
        for (int i = 0; i < 8; i++) {
            int randomIndex = secureRandom.nextInt(ALPHABET.length());
            sb.append(ALPHABET.charAt(randomIndex));
        }
        String string = sb.toString();
        long epochSecond = Instant.now().getEpochSecond();
        httpGet.setHeader("X-AI-GATEWAY-TIMESTAMP", epochSecond + "");
        httpGet.setHeader("X-AI-GATEWAY-NONCE", string);
        httpGet.setHeader("X-AI-GATEWAY-SIGNED-HEADERS", "x-ai-gateway-app-id;x-ai-gateway-timestamp;x-ai-gateway-nonce");
        String canonicalQueryString="task_id="+taskId;
        String s = calculateSignature(httpMethod, httpUrl, canonicalQueryString, appId, epochSecond, string, appKey);
        httpGet.setHeader("X-AI-GATEWAY-SIGNATURE", s);
        httpGet.setHeader("Content-Type", "application/json");
        httpGet.setHeader("X-AI-GATEWAY-APP-ID", appId);
        for(int i=0;i<10;i++){
            URIBuilder  uriBuilder1=new URIBuilder(requestUrl);
            uriBuilder1.addParameter("task_id", taskId);
            URI build1 = uriBuilder1.build();
            httpGet = new HttpGet(build1);
            httpGet.setHeader("X-AI-GATEWAY-TIMESTAMP", epochSecond + "");
            httpGet.setHeader("X-AI-GATEWAY-NONCE", string);
            httpGet.setHeader("X-AI-GATEWAY-SIGNED-HEADERS", "x-ai-gateway-app-id;x-ai-gateway-timestamp;x-ai-gateway-nonce");
            String canonicalQueryString1="task_id="+taskId;
            String s1 = calculateSignature(httpMethod, httpUrl, canonicalQueryString1, appId, epochSecond, string, appKey);
            httpGet.setHeader("X-AI-GATEWAY-SIGNATURE", s1);
            httpGet.setHeader("Content-Type", "application/json");
            httpGet.setHeader("X-AI-GATEWAY-APP-ID", appId);
            CloseableHttpResponse execute = httpClient.execute(httpGet);
            if(execute.getStatusLine().getStatusCode() == 200) {
                String  entity = EntityUtils.toString(execute.getEntity());
                JSONObject jsonObject = JSONObject.parseObject(entity);
                JSONObject result = jsonObject.getJSONObject("result");
                Integer  status = result.getInteger("status");
                if(status == 2){
                    log.info("任务完成，响应内容：{}",  entity);
                    String imageUrl = result.getString("images_url");
                    execute.close();
                    httpClient.close();
                    log.info("图片地址：{}", imageUrl);
                    return imageUrl;
                }
                if(status == 1){
                    System.out.println("任务未完成，当前状态：" + status);
                }
                if(status == 0){
                    System.out.println("任务完成，当前状态：" + status);
                }
                if(status == 3){
                    System.out.println("任务失败，当前状态：" + status);
                }
            }else {
                System.out.println(execute.getStatusLine());
            }
            Thread.sleep(1000);
        }

        return null;


    }
    private static String calculateSignature(
            String httpMethod,
            String httpUri,
            String canonicalQueryString,
            String appId,
            long timestamp,  // 输入为 long 类型
            String nonce,
            String appKey) throws Exception {

        // 显式将 timestamp 转换为字符串
        String timestampStr = String.valueOf(timestamp);

        // 构建签名字符串（所有参数均为字符串）
        String signingString = String.join("\n",
                httpMethod.toUpperCase(),       // POST
                httpUri,                        // /vivogpt/completions
                canonicalQueryString,           // requestId=xxx
                appId,                          // "2025158089"
                timestampStr,                   // "1745768181"（显式转换）
                "x-ai-gateway-app-id:" + appId, // 头部字段
                "x-ai-gateway-timestamp:" + timestampStr, // 使用转换后的字符串
                "x-ai-gateway-nonce:" + nonce
        );

        // 打印调试信息（确保 timestamp 为字符串形式）
        System.out.println("Timestamp String: " + timestampStr);
        System.out.println("Signing String:\n" + signingString);

        // 计算 HMAC-SHA256（不变）
        Mac sha256Hmac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKey = new SecretKeySpec(appKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        sha256Hmac.init(secretKey);
        byte[] hashBytes = sha256Hmac.doFinal(signingString.getBytes(StandardCharsets.UTF_8));

        return Base64.getEncoder().encodeToString(hashBytes);
    }
}
