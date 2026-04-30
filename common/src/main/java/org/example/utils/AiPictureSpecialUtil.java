package org.example.utils;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.alibaba.fastjson.serializer.SerializerFeature;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.apache.http.HttpEntity;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.client.utils.URIBuilder;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AiPictureSpecialUtil {

        private String appId;
        private String appKey;
        private String httpMethod;
        private String httpUrl;
        private String requestUrl;
        public String getTaskId() throws Exception {
            CloseableHttpClient httpClient = HttpClients.createDefault();
            final String ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
            StringBuilder sb = new StringBuilder(8);
            SecureRandom secureRandom = new SecureRandom();
            for (int i = 0; i < 8; i++) {
                int randomIndex = secureRandom.nextInt(ALPHABET.length());
                sb.append(ALPHABET.charAt(randomIndex));
            }
            String string = sb.toString();
            HttpPost httpPost = new HttpPost(requestUrl);
            httpPost.setHeader("Content-Type", "application/json");
            httpPost.setHeader("X-AI-GATEWAY-APP-ID",appId);
            long epochSecond = Instant.now().getEpochSecond();
            httpPost.setHeader("X-AI-GATEWAY-TIMESTAMP",epochSecond+"");
            httpPost.setHeader("X-AI-GATEWAY-NONCE",string);
            String canonicalQueryString ="";
            String s=calculateSignature(httpMethod,httpUrl,canonicalQueryString,appId,epochSecond,string,appKey);
            httpPost.setHeader("X-AI-GATEWAY-SIGNATURE",s);
            httpPost.setHeader("X-AI-GATEWAY-SIGNED-HEADERS","x-ai-gateway-app-id;x-ai-gateway-timestamp;x-ai-gateway-nonce");
            String weatherKey="2067e98e5727c05a5f4c91c60cf60d62";
            String weather=WeatherReport(weatherKey);
            // 假设 message 是用户传入的动态参数（例如 "准备产品发布会，包括PPT制作、嘉宾接待、流程彩排"）
            String prompt = "根据天气实况生成一幅类似书签的图片，要求精美有意境，weather:"+weather;
            String jsonString = JSON.toJSONString(prompt, SerializerFeature.WriteNonStringValueAsString);
            String requestBody = "{" +
                    "\"dataId\": \"a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4\"," +
                    "\"businessCode\": \"pc\"," +
                    "\"userAccount\": \"openid_123456\"," +
                    "\"prompt\":"+jsonString+"," +
                    "\"imageType\": 1," +
                    "\"styleConfig\": \"4cbc9165bc615ea0815301116e7925a3\"," +
                    "\"height\": 512," +
                    "\"width\": 512," +
                    "\"seed\": -1," +
                    "\"cfgScale\": 7," +
                    "\"denoisingStrength\": 0.1," +
                    "\"ctrlNetStrength\": 0.5," +
                    "\"steps\": 15," +
                    "\"negativePrompt\": \"低分辨率, 扭曲的面部,违反常识和物理规律的数据\"" +
                    "}";
            httpPost.setEntity(new StringEntity(requestBody, StandardCharsets.UTF_8));
            CloseableHttpResponse execute = httpClient.execute(httpPost);
            if(execute.getStatusLine().getStatusCode() == 200){
                HttpEntity entity = execute.getEntity();
                JSONObject jsonObject = JSONObject.parseObject(EntityUtils.toString(entity));
                jsonObject = jsonObject.getJSONObject("result");
                String string1 = jsonObject.getString("task_id");
                execute.close();
                httpClient.close();
                return string1;

            }else {
                System.out.println(execute.getStatusLine().getReasonPhrase());
            }
            return null;
        }

    private String WeatherReport(String weatherKey) throws URISyntaxException, IOException {
            CloseableHttpClient httpClient = HttpClients.createDefault();
        URIBuilder  uriBuilder = new URIBuilder("https://restapi.amap.com/v3/weather/weatherInfo");
        uriBuilder.addParameter("Key",weatherKey);
        uriBuilder.addParameter("output","JSON");
        String city = GetCity();
        uriBuilder.addParameter("city", city);
        uriBuilder.addParameter("extensions","base");
        URI uri = uriBuilder.build();
        HttpGet httpGet = new HttpGet(uri);
        CloseableHttpResponse execute = httpClient.execute(httpGet);
        if(execute.getStatusLine().getStatusCode() == 200){
            HttpEntity entity = execute.getEntity();
            JSONObject jsonObject = JSONObject.parseObject(EntityUtils.toString(entity));
            JSONArray array = jsonObject.getJSONArray("lives");
            JSONObject jsonObject1  = array.getJSONObject(0);
            String weather = jsonObject1.getString("weather");
            String temperature = jsonObject1.getString("temperature");
            String s = "{\"weather\":\""+weather+"\",\"温度是\"\""+temperature+"摄氏度\"}";
            execute.close();
            httpClient.close();
            return s;
        }
        return  null;
    }

    private String GetCity() throws URISyntaxException, IOException {
            CloseableHttpClient httpClient = HttpClients.createDefault();
            URIBuilder uriBuilder = new URIBuilder("https://restapi.amap.com/v3/ip");
            uriBuilder.addParameter("Key","6124c382ad473ae4055334c5c1a5a794");
            URI uri = uriBuilder.build();
            HttpGet httpGet = new HttpGet(uri);
            CloseableHttpResponse execute = httpClient.execute(httpGet);
            if(execute.getStatusLine().getStatusCode() == 200){
                HttpEntity entity = execute.getEntity();
                JSONObject jsonObject = JSONObject.parseObject(EntityUtils.toString(entity));
                String adCode  = jsonObject.getString("adcode");
                execute.close();
                httpClient.close();
                return adCode;
            }
            return  null;
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
