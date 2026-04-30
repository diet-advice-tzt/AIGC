package org.example.server.controller.common;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.example.result.Result;
import org.example.utils.AliOssUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@RestController
@Slf4j
@RequestMapping("/common")
@Api(tags = "上传文件")
@CrossOrigin
public class CommonController {
    @Autowired
    private AliOssUtil aliOssUtil;
    @PostMapping("/upload")
    @ApiOperation("文件传输")
    public Result<String> upload(@RequestBody  MultipartFile file){
        try{
            String fileName = file.getOriginalFilename();
            String extName=null;
            if(fileName!=null){
                extName=fileName.substring(fileName.lastIndexOf("."));

            }
                String extName1=extName.substring(0,4);
            String uuid= UUID.randomUUID().toString()+extName1;
            String upload = aliOssUtil.upload(file.getBytes(), uuid);
            return Result.success(upload);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}
