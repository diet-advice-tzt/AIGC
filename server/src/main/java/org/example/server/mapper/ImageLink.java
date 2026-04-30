package org.example.server.mapper;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.example.pojo.entity.imagelink;
import org.example.pojo.entity.session;

import java.util.List;

@Mapper
public interface ImageLink {
    @Insert("insert into imagelink (image_url, created_at, updated_at, user_id, session_id) VALUES (#{imageUrl},#{createdAt},#{updatedAt},#{userId},#{sessionId})")
    void insertNewPicture(imagelink imagelink);

    void delete(List<String> list);


//    void delete(String sessionKey);
}
