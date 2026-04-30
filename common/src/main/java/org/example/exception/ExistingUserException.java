package org.example.exception;

public class ExistingUserException extends Exception {
    private static final long serialVersionUID = 1L;
    public ExistingUserException(String message) {
        super(message);
    }
}
