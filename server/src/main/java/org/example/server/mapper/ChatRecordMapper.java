package org.example.server.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.example.pojo.entity.chatRecord;
import org.example.pojo.entity.session;

import java.util.List;

@Mapper
public interface ChatRecordMapper {

    void insertNewRecord(chatRecord chatRecord);

    void delete(List<String> list);
}
