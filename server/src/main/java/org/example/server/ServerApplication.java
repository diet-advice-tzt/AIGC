package org.example.server;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration;
import org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import javax.annotation.PostConstruct;

@SpringBootApplication(exclude = {
        RedisAutoConfiguration.class,
        RedisRepositoriesAutoConfiguration.class
})
@EnableTransactionManagement
@EnableScheduling
@ComponentScan(basePackages = {
        "org.example.server",
        "org.example.properties",
        "org.example.common",
        "org.example.json",
        "org.example.utils"
})
@Slf4j
public class ServerApplication {

    @PostConstruct
    public void init() {
        log.info("========================================");
        log.info("    🚀 RACE 后端服务启动中...");
        log.info("========================================");
        log.info("✅ Redis 已设为可选依赖");
        log.info("✅ CORS 跨域已配置");
        log.info("✅ 健康检查接口已启用");
        log.info("========================================");
    }

    public static void main(String[] args) {
        System.setProperty("spring.cache.type", "none");
        System.setProperty("spring.profiles.active", "h2");
        SpringApplication.run(ServerApplication.class, args);
        log.info("========================================");
        log.info("    ✅ 后端服务启动成功！");
        log.info("========================================");
        log.info("📄 接口文档: http://localhost:8080/doc.html");
        log.info("💊 健康检查: http://localhost:8080/health");
        log.info("🎨 前端地址: http://localhost:3000");
        log.info("========================================");
    }
}