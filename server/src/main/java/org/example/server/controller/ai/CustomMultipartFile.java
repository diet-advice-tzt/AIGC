package org.example.server.controller.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.file.Path;

@Data
@Builder
public class CustomMultipartFile implements org.springframework.web.multipart.MultipartFile{
    private final String name;
    private final String originalFilename;
    private final String contentType;
    private final byte[] content;

    public CustomMultipartFile(String name, String originalFilename, String contentType, byte[] content) {
        this.name = name;
        this.originalFilename = originalFilename;
        this.contentType = contentType;
        this.content = content;
    }

    @Override
    public String getName() {
        return name;
    }

    @Override
    public String getOriginalFilename() {
        return originalFilename;
    }

    @Override
    public String getContentType() {
        return contentType;
    }

    @Override
    public boolean isEmpty() {
        return content == null || content.length == 0;
    }

    @Override
    public long getSize() {
        return content != null ? content.length : 0;
    }

    @Override
    public byte[] getBytes() throws IOException {
        return content;
    }

    @Override
    public InputStream getInputStream() throws IOException {
        return new ByteArrayInputStream(content);
    }

    @Override
    public void transferTo(File dest) throws IOException, IllegalStateException {
        try (OutputStream os = new FileOutputStream(dest)) {
            os.write(content);
        }
        catch (Exception e) {
            throw new IOException("Failed to transfer content to file", e);
        }
    }
}
