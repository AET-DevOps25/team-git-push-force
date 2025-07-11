package de.tum.aet.devops25.conceptsvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.context.request.WebRequest;

import de.tum.aet.devops25.api.generated.model.ErrorResponse;

@ExtendWith(MockitoExtension.class)
@ActiveProfiles("test")
class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler globalExceptionHandler;

    @Mock
    private WebRequest webRequest;

    @Mock
    private MethodArgumentNotValidException methodArgumentNotValidException;

    @Mock
    private BindingResult bindingResult;

    @BeforeEach
    void setUp() {
        globalExceptionHandler = new GlobalExceptionHandler();
        when(webRequest.getDescription(false)).thenReturn("uri=/api/concepts");
    }

    @Test
    void testHandleValidationException() {
        // When
        ResponseEntity<ErrorResponse> response = globalExceptionHandler
                .handleValidationException(methodArgumentNotValidException, webRequest);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        
        ErrorResponse errorResponse = response.getBody();
        assertThat(errorResponse.getError()).isEqualTo("VALIDATION_ERROR");
        assertThat(errorResponse.getMessage()).isEqualTo("Invalid input data provided");
        assertThat(errorResponse.getPath()).isEqualTo("/api/concepts");
        assertThat(errorResponse.getStatus()).isEqualTo(400);
        assertThat(errorResponse.getTimestamp()).isNotNull();
    }

    @Test
    void testHandleIllegalArgumentException() {
        // Given
        IllegalArgumentException exception = new IllegalArgumentException("Invalid argument provided");

        // When
        ResponseEntity<ErrorResponse> response = globalExceptionHandler
                .handleIllegalArgumentException(exception, webRequest);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        
        ErrorResponse errorResponse = response.getBody();
        assertThat(errorResponse.getError()).isEqualTo("VALIDATION_ERROR");
        assertThat(errorResponse.getMessage()).isEqualTo("Invalid argument provided");
        assertThat(errorResponse.getPath()).isEqualTo("/api/concepts");
        assertThat(errorResponse.getStatus()).isEqualTo(400);
        assertThat(errorResponse.getTimestamp()).isNotNull();
    }

    @Test
    void testHandleRuntimeException() {
        // Given
        RuntimeException exception = new RuntimeException("Something went wrong");

        // When
        ResponseEntity<ErrorResponse> response = globalExceptionHandler
                .handleRuntimeException(exception, webRequest);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        
        ErrorResponse errorResponse = response.getBody();
        assertThat(errorResponse.getError()).isEqualTo("RUNTIME_ERROR");
        assertThat(errorResponse.getMessage()).isEqualTo("Something went wrong");
        assertThat(errorResponse.getPath()).isEqualTo("/api/concepts");
        assertThat(errorResponse.getStatus()).isEqualTo(500);
        assertThat(errorResponse.getTimestamp()).isNotNull();
    }

    @Test
    void testHandleGenericException() {
        // Given
        Exception exception = new Exception("Unexpected error occurred");

        // When
        ResponseEntity<ErrorResponse> response = globalExceptionHandler
                .handleGenericException(exception, webRequest);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        
        ErrorResponse errorResponse = response.getBody();
        assertThat(errorResponse.getError()).isEqualTo("INTERNAL_SERVER_ERROR");
        assertThat(errorResponse.getMessage()).isEqualTo("An unexpected error occurred");
        assertThat(errorResponse.getPath()).isEqualTo("/api/concepts");
        assertThat(errorResponse.getStatus()).isEqualTo(500);
        assertThat(errorResponse.getTimestamp()).isNotNull();
    }

    @Test
    void testHandleIllegalArgumentException_WithNullMessage() {
        // Given
        IllegalArgumentException exception = new IllegalArgumentException((String) null);

        // When
        ResponseEntity<ErrorResponse> response = globalExceptionHandler
                .handleIllegalArgumentException(exception, webRequest);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        
        ErrorResponse errorResponse = response.getBody();
        assertThat(errorResponse.getError()).isEqualTo("VALIDATION_ERROR");
        assertThat(errorResponse.getMessage()).isNull();
        assertThat(errorResponse.getPath()).isEqualTo("/api/concepts");
        assertThat(errorResponse.getStatus()).isEqualTo(400);
    }

    @Test
    void testHandleRuntimeException_WithNullMessage() {
        // Given
        RuntimeException exception = new RuntimeException((String) null);

        // When
        ResponseEntity<ErrorResponse> response = globalExceptionHandler
                .handleRuntimeException(exception, webRequest);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        
        ErrorResponse errorResponse = response.getBody();
        assertThat(errorResponse.getError()).isEqualTo("RUNTIME_ERROR");
        assertThat(errorResponse.getMessage()).isNull();
        assertThat(errorResponse.getStatus()).isEqualTo(500);
    }

    @Test
    void testErrorResponsePathExtraction() {
        // Given
        when(webRequest.getDescription(false)).thenReturn("uri=/api/concepts/123");
        RuntimeException exception = new RuntimeException("Test error");

        // When
        ResponseEntity<ErrorResponse> response = globalExceptionHandler
                .handleRuntimeException(exception, webRequest);

        // Then
        assertThat(response.getBody().getPath()).isEqualTo("/api/concepts/123");
    }

    @Test
    void testErrorResponsePathExtraction_WithoutUriPrefix() {
        // Given
        when(webRequest.getDescription(false)).thenReturn("/api/concepts/456");
        RuntimeException exception = new RuntimeException("Test error");

        // When
        ResponseEntity<ErrorResponse> response = globalExceptionHandler
                .handleRuntimeException(exception, webRequest);

        // Then
        assertThat(response.getBody().getPath()).isEqualTo("/api/concepts/456");
    }

    @Test
    void testTimestampIsRecentForAllExceptions() {
        // Given
        long beforeTime = System.currentTimeMillis();
        RuntimeException exception = new RuntimeException("Test error");

        // When
        ResponseEntity<ErrorResponse> response = globalExceptionHandler
                .handleRuntimeException(exception, webRequest);

        // Then
        long afterTime = System.currentTimeMillis();
        long responseTime = response.getBody().getTimestamp().toInstant().toEpochMilli();
        assertThat(responseTime).isBetween(beforeTime, afterTime);
    }
} 