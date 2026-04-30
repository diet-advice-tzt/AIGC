package org.example.server.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.example.pojo.entity.session;

import java.util.List;

@Mapper
public interface SessionMapper {

    void insertSessionId(session session);

    List<String> selectSessionId(Integer userId);

    void delete();

    List<session> selectAllDeleteSession();
}
