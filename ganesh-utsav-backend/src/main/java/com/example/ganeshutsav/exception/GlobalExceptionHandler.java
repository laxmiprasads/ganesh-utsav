package com.example.ganeshutsav.exception;

import java.util.HashMap;
import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ResourceNotFoundException.class)
    ResponseEntity<ApiError> notFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiError.of(404, ex.getMessage()));
    }

    @ExceptionHandler(DuplicateRecordException.class)
    ResponseEntity<ApiError> duplicate(DuplicateRecordException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiError.of(409, ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiError> validation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> errors.put(error.getField(), error.getDefaultMessage()));
        return ResponseEntity.badRequest().body(ApiError.of(400, "Validation failed", errors));
    }

    @ExceptionHandler(BadCredentialsException.class)
    ResponseEntity<ApiError> badCredentials() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiError.of(401, "Invalid username or password"));
    }

    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<ApiError> denied() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiError.of(403, "You are not allowed to access this resource"));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ApiError> database(DataIntegrityViolationException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiError.of(409, "The request conflicts with existing data"));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<ApiError> badRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(ApiError.of(400, ex.getMessage()));
    }

    @ExceptionHandler(org.springframework.web.multipart.MultipartException.class)
    ResponseEntity<ApiError> uploadProblem(org.springframework.web.multipart.MultipartException ex) {
        return ResponseEntity.badRequest().body(ApiError.of(400, "Invalid upload request: " + ex.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    ResponseEntity<ApiError> serverError(IllegalStateException ex) {
        String message = ex.getMessage() == null || ex.getMessage().isBlank()
                ? "Could not save the uploaded photo"
                : ex.getMessage();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiError.of(500, message));
    }

    @ExceptionHandler(org.springframework.web.multipart.MaxUploadSizeExceededException.class)
    ResponseEntity<ApiError> tooLarge(org.springframework.web.multipart.MaxUploadSizeExceededException ex) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(ApiError.of(413, "Uploaded photo is too large"));
    }
}
