package org.example.server.configuration;

import org.example.result.Result;
import org.springframework.cache.interceptor.KeyGenerator;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class KeyGeneratorConfiguration implements KeyGenerator {

    @Override
    public Object generate(Object target, Method method, Object... params) {
        Integer userId = (Integer) params[0];
        Result<List<Map>> result = new Result<>();
        try {
            result = (Result<List<Map>>) method.invoke(target, params);
        } catch (Exception e) {
            throw new RuntimeException("生成缓存键失败", e);
        }
        List<Map> keys = result.getData();
        String sessionId=keys.stream()
                .map(map->map.get("sessionId").toString())
                .distinct()
                .collect(Collectors.joining("-"));
        return userId+"-"+sessionId;
    }
}
