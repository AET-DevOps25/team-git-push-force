package de.tum.aet.devops25.usersvc;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class UserAlreadyExistsExceptionTest {

    @Test
    void testConstructorWithMessage() {
        String message = "User with email test@example.com already exists";
        UserAlreadyExistsException exception = new UserAlreadyExistsException(message);
        
        assertThat(exception.getMessage()).isEqualTo(message);
        assertThat(exception.getCause()).isNull();
    }

    @Test
    void testConstructorWithMessageAndCause() {
        String message = "User already exists";
        Throwable cause = new RuntimeException("Database constraint violation");
        
        UserAlreadyExistsException exception = new UserAlreadyExistsException(message, cause);
        
        assertThat(exception.getMessage()).isEqualTo(message);
        assertThat(exception.getCause()).isEqualTo(cause);
    }

    @Test
    void testConstructorWithNullMessage() {
        UserAlreadyExistsException exception = new UserAlreadyExistsException(null);
        
        assertThat(exception.getMessage()).isNull();
        assertThat(exception.getCause()).isNull();
    }

    @Test
    void testConstructorWithNullMessageAndCause() {
        Throwable cause = new IllegalArgumentException("Invalid input");
        
        UserAlreadyExistsException exception = new UserAlreadyExistsException(null, cause);
        
        assertThat(exception.getMessage()).isNull();
        assertThat(exception.getCause()).isEqualTo(cause);
    }

    @Test
    void testExceptionIsRuntimeException() {
        UserAlreadyExistsException exception = new UserAlreadyExistsException("test");
        
        assertThat(exception).isInstanceOf(RuntimeException.class);
    }
} 