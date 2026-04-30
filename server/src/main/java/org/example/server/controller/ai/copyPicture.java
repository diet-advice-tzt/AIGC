package org.example.server.controller.ai;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.ProtocolException;
import java.net.URL;
@Slf4j
public class copyPicture {
    public static MultipartFile convertUrlToMultipartFile(String url) throws IOException {
        // 清理URL字符串，去除多余的方括号和引号
        url = cleanUrlString(url);
        log.info("清理后的URL: {}", url);

        // 验证URL格式
        if (!url.toLowerCase().startsWith("http")) {
            throw new IllegalArgumentException("无效的HTTP/HTTPS URL: " + url);
        }

        URL imageUrl = new URL(url);
        HttpURLConnection connection = null;

        try {
            // 打开连接
            connection = (HttpURLConnection) imageUrl.openConnection();
            connection.setRequestMethod("GET");
            connection.setInstanceFollowRedirects(true); // 允许重定向

            // 设置完整的请求头，模拟浏览器行为
            connection.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");
            connection.setRequestProperty("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8");
            connection.setRequestProperty("Accept-Language", "zh-CN,zh;q=0.9,en;q=0.8");
            connection.setRequestProperty("Connection", "keep-alive");

            // 添加Referer头，根据目标域名设置
            String host = imageUrl.getHost();
            if (host.contains("vivo.com.cn")) {
                connection.setRequestProperty("Referer", "https://www.vivo.com.cn/");
            }

            // 设置超时
            connection.setConnectTimeout(10000); // 10秒连接超时
            connection.setReadTimeout(30000);    // 30秒读取超时

            // 获取响应码
            int responseCode = connection.getResponseCode();
            log.info("HTTP响应码: {}", responseCode);

            if (responseCode != HttpURLConnection.HTTP_OK) {
                // 尝试读取错误响应内容
                String errorMessage = "";
                try (BufferedReader br = new BufferedReader(
                        new InputStreamReader(connection.getErrorStream()))) {
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = br.readLine()) != null) {
                        sb.append(line).append("\n");
                    }
                    errorMessage = sb.toString();
                } catch (Exception e) {
                    errorMessage = "无法读取错误详情";
                }

                throw new IOException("HTTP请求失败，状态码: " + responseCode +
                        ", 错误信息: " + errorMessage);
            }

            // 从URL中提取文件名
            String fileName = url.substring(url.lastIndexOf("/") + 1);
            if (fileName.isEmpty() || !fileName.contains(".")) {
                // 如果无法从URL获取有效文件名，生成一个带时间戳的文件名
                String contentType = connection.getContentType();
                String ext = getFileExtension(contentType);
                fileName = "image_" + System.currentTimeMillis() + ext;
            }

            // 获取输入流并转换为字节数组
            try (InputStream inputStream = connection.getInputStream();
                 ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

                byte[] buffer = new byte[4096];
                int bytesRead;
                while ((bytesRead = inputStream.read(buffer)) != -1) {
                    outputStream.write(buffer, 0, bytesRead);
                }
                byte[] bytes = outputStream.toByteArray();
                log.info("成功获取图片数据，大小: {} 字节", bytes.length);

                // 使用自定义实现创建MultipartFile对象
                return new CustomMultipartFile(
                        "file",
                        fileName,
                        connection.getContentType(),
                        bytes
                );
            }

        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }

    /**
     * 根据Content-Type推测文件扩展名
     */
    private static String getFileExtension(String contentType) {
        if (contentType == null) {
            return ".jpg";
        }

        if (contentType.contains("png")) {
            return ".png";
        } else if (contentType.contains("jpeg") || contentType.contains("jpg")) {
            return ".jpg";
        } else if (contentType.contains("gif")) {
            return ".gif";
        } else if (contentType.contains("webp")) {
            return ".webp";
        } else {
            return ".jpg"; // 默认使用JPG
        }
    }

    private  static String cleanUrlString(String url) {
        if (url == null) {
            return null;
        }

        // 去除首尾的空白字符
        url = url.trim();

        // 去除开头的方括号和引号
        if (url.startsWith("[\"")) {
            url = url.substring(2);
        } else if (url.startsWith("[")) {
            url = url.substring(1);
        } else if (url.startsWith("\"")) {
            url = url.substring(1);
        }

        // 去除结尾的方括号和引号
        if (url.endsWith("\"]")) {
            url = url.substring(0, url.length() - 2);
        } else if (url.endsWith("]")) {
            url = url.substring(0, url.length() - 1);
        } else if (url.endsWith("\"")) {
            url = url.substring(0, url.length() - 1);
        }

        return url;
    }
}
