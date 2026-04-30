package org.example.server.AOP;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.annotation.Pointcut;
import org.aspectj.lang.reflect.MethodSignature;
import org.example.result.Result;
import org.example.server.annotation.AutoUpload;
import org.example.utils.AliOssUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.UUID;

@Aspect
@Slf4j
@Component
public class AOPUpload {
    @Autowired
    private AliOssUtil aliOssUtil;
    @Pointcut("execution(* org.example.server.service.Aiserviceimpl.*(..)) && @annotation(org.example.server.annotation.AutoUpload)")
    public void upload(){}
    @Around("upload()"
    )
    public Object upload(ProceedingJoinPoint joinPoint) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        AutoUpload autoUpload = signature.getMethod().getAnnotation(AutoUpload.class);
        Method method = signature.getMethod();
        if (autoUpload == null){
            return joinPoint.proceed();
        }
        Object[] args = joinPoint.getArgs();
        if(args==null||args.length==0){
            return joinPoint.proceed();
        }
        Object proceed = joinPoint.proceed();
        if(proceed instanceof String && !((String)proceed).isEmpty()){
            String imageUrl=(String)proceed;
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
            String extName= imageUrl.substring(imageUrl.lastIndexOf("."));
            String uuid= UUID.randomUUID().toString()+extName;
            String upload = aliOssUtil.upload(imageUrl.getBytes(), uuid);
            log.info("上传成功：{}", upload);
            for(Object arg:args){
                if (arg != null && !(arg instanceof String) && !(arg instanceof MultipartFile)) {
                    // 设置图片URL到实体对象
                    setImageUrlToEntity(arg, upload, autoUpload.urlField());
                    break;
                }
            }
        }
        return proceed;
    }

    private void setImageUrlToEntity(Object arg, String imageUrl, String s) {
        try{
            Class<?> clazz = arg.getClass();
            Field field = clazz.getDeclaredField(s);
            field.setAccessible(true);
            field.set(arg, imageUrl);
            log.info("设置图片URL成功：{}", imageUrl);
        }catch (Exception e){
            log.error("设置图片url失败:{}",  e.getMessage());
        }
    }
}
