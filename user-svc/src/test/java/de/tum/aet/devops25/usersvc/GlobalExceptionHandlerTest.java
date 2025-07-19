package de.tum.aet.devops25.usersvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.time.OffsetDateTime;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.context.request.WebRequest;

import de.tum.aet.devops25.api.generated.model.ErrorResponse;

@ExtendWith(MockitoExtension.class)
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
        when(webRequest.getDescription(false)).thenReturn("uri=/api/users/test");
    }

    @Test
    void testHandleUserAlreadyExistsException() {
        // Arrange
        UserAlreadyExistsException exception = new UserAlreadyExistsException("User already exists");

        // Act
        ResponseEntity<ErrorResponse> response = globalExceptionHandler
                .handleUserAlreadyExistsException(exception, webRequest);

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getError()).isEqualTo("USER_ALREADY_EXISTS");
        assertThat(response.getBody().getMessage()).isEqualTo("User already exists");
        assertThat(response.getBody().getPath()).isEqualTo("/api/users/test");
        assertThat(response.getBody().getStatus()).isEqualTo(409);
        assertThat(response.getBody().getTimestamp()).isNotNull();
        assertThat(response.getBody().getTimestamp()).isBefore(OffsetDateTime.now().plusSeconds(1));
    }

    @Test
    void testHandleRuntimeException() {
        // Arrange
        RuntimeException exception = new RuntimeException("Runtime error occurred");

        // Act
        ResponseEntity<ErrorResponse> response = globalExceptionHandler
                .handleRuntimeException(exception, webRequest);

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getError()).isEqualTo("RUNTIME_ERROR");
        assertThat(response.getBody().getMessage()).isEqualTo("Runtime error occurred");
        assertThat(response.getBody().getPath()).isEqualTo("/api/users/test");
        assertThat(response.getBody().getStatus()).isEqualTo(500);
        assertThat(response.getBody().getTimestamp()).isNotNull();
    }

    @Test
    void testHandleGenericException() {
        // Arrange
        Exception exception = new Exception("Generic error occurred");

        // Act
        ResponseEntity<ErrorResponse> response = globalExceptionHandler
                .handleGenericException(exception, webRequest);

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getError()).isEqualTo("INTERNAL_SERVER_ERROR");
        assertThat(response.getBody().getMessage()).isEqualTo("An unexpected error occurred");
        assertThat(response.getBody().getPath()).isEqualTo("/api/users/test");
        assertThat(response.getBody().getStatus()).isEqualTo(500);
        assertThat(response.getBody().getTimestamp()).isNotNull();
    }

    @Test
    void testHandleIllegalArgumentException() {
        // Arrange
        IllegalArgumentException exception = new IllegalArgumentException("Invalid argument provided");

        // Act
        ResponseEntity<ErrorResponse> response = globalExceptionHandler
                .handleIllegalArgumentException(exception, webRequest);

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getError()).isEqualTo("VALIDATION_ERROR");
        assertThat(response.getBody().getMessage()).isEqualTo("Invalid argument provided");
        assertThat(response.getBody().getPath()).isEqualTo("/api/users/test");
        assertThat(response.getBody().getStatus()).isEqualTo(400);
        assertThat(response.getBody().getTimestamp()).isNotNull();
    }

    @Test
    void testHandleUserAlreadyExistsException_WithNullMessage() {
        // Arrange
        UserAlreadyExistsException exception = new UserAlreadyExistsException(null);

        // Act
        ResponseEntity<ErrorResponse> response = globalExceptionHandler
                .handleUserAlreadyExistsException(exception, webRequest);

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getError()).isEqualTo("USER_ALREADY_EXISTS");
        assertThat(response.getBody().getMessage()).isNull();
        assertThat(response.getBody().getPath()).isEqualTo("/api/users/test");
        assertThat(response.getBody().getStatus()).isEqualTo(409);
    }

    @Test
    void testHandleRuntimeException_WithNullMessage() {
        // Arrange
        RuntimeException exception = new RuntimeException((String) null);

        // Act
        ResponseEntity<ErrorResponse> response = globalExceptionHandler
                .handleRuntimeException(exception, webRequest);

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getError()).isEqualTo("RUNTIME_ERROR");
        assertThat(response.getBody().getMessage()).isNull();
        assertThat(response.getBody().getPath()).isEqualTo("/api/users/test");
        assertThat(response.getBody().getStatus()).isEqualTo(500);
    }

    @Test
    void testErrorResponsePathExtraction() {
        // Arrange
        when(webRequest.getDescription(false)).thenReturn("uri=/api/users/profile");
        UserAlreadyExistsException exception = new UserAlreadyExistsException("Test message");

        // Act
        ResponseEntity<ErrorResponse> response = globalExceptionHandler
                .handleUserAlreadyExistsException(exception, webRequest);

        // Assert
        assertThat(response.getBody().getPath()).isEqualTo("/api/users/profile");
    }

    @Test
    void testErrorResponsePathExtraction_WithoutUriPrefix() {
        // Arrange
        when(webRequest.getDescription(false)).thenReturn("/api/users/register");
        UserAlreadyExistsException exception = new UserAlreadyExistsException("Test message");

        // Act
        ResponseEntity<ErrorResponse> response = globalExceptionHandler
                .handleUserAlreadyExistsException(exception, webRequest);

        // Assert
        assertThat(response.getBody().getPath()).isEqualTo("/api/users/register");
    }

    @Test
    void testTimestampIsRecentForAllExceptions() {
        // Test that timestamps are within a reasonable time range for all exception types
        OffsetDateTime beforeTest = OffsetDateTime.now().minusSeconds(1);
        OffsetDateTime afterTest = OffsetDateTime.now().plusSeconds(1);

        // Test UserAlreadyExistsException
        ResponseEntity<ErrorResponse> response1 = globalExceptionHandler
                .handleUserAlreadyExistsException(new UserAlreadyExistsException("test"), webRequest);
        assertThat(response1.getBody().getTimestamp()).isBetween(beforeTest, afterTest);

        // Test RuntimeException
        ResponseEntity<ErrorResponse> response2 = globalExceptionHandler
                .handleRuntimeException(new RuntimeException("test"), webRequest);
        assertThat(response2.getBody().getTimestamp()).isBetween(beforeTest, afterTest);

        // Test Generic Exception
        ResponseEntity<ErrorResponse> response3 = globalExceptionHandler
                .handleGenericException(new Exception("test"), webRequest);
        assertThat(response3.getBody().getTimestamp()).isBetween(beforeTest, afterTest);

        // Test IllegalArgumentException
        ResponseEntity<ErrorResponse> response4 = globalExceptionHandler
                .handleIllegalArgumentException(new IllegalArgumentException("test"), webRequest);
        assertThat(response4.getBody().getTimestamp()).isBetween(beforeTest, afterTest);
    }

    @Test
    void testHandleUserAlreadyExistsException_WithCause() {
        // Arrange
        Throwable cause = new RuntimeException("Database constraint violation");
        UserAlreadyExistsException exception = new UserAlreadyExistsException("User already exists", cause);

        // Act
        ResponseEntity<ErrorResponse> response = globalExceptionHandler
                .handleUserAlreadyExistsException(exception, webRequest);

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getError()).isEqualTo("USER_ALREADY_EXISTS");
        assertThat(response.getBody().getMessage()).isEqualTo("User already exists");
    }
} 