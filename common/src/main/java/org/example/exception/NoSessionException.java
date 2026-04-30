package org.example.exception;

public class NoSessionException extends RuntimeException {
    public NoSessionException() {}
    public NoSessionException(String message) {
        super(message);
    }
}
