package de.tum.aet.devops25.usersvc;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.PrintWriter;
import java.io.StringWriter;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;

import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@ExtendWith(MockitoExtension.class)
class CustomAuthenticationEntryPointTest {

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private AuthenticationException authException;

    private CustomAuthenticationEntryPoint authenticationEntryPoint;

    @BeforeEach
    void setUp() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules(); // Register JSR310 module for OffsetDateTime
        authenticationEntryPoint = new CustomAuthenticationEntryPoint(objectMapper);
    }

    @Test
    void testCommence_WithMissingAuthorizationHeader() throws Exception {
        // Arrange
        StringWriter stringWriter = new StringWriter();
        PrintWriter printWriter = new PrintWriter(stringWriter);
        
        when(request.getHeader("Authorization")).thenReturn(null);
        when(request.getRequestURI()).thenReturn("/api/users/profile");
        when(response.getWriter()).thenReturn(printWriter);

        // Act
        authenticationEntryPoint.commence(request, response, authException);

        // Assert
        verify(response).setContentType(MediaType.APPLICATION_JSON_VALUE);
        verify(response).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        
        String responseBody = stringWriter.toString();
        org.assertj.core.api.Assertions.assertThat(responseBody).contains("MISSING_TOKEN");
        org.assertj.core.api.Assertions.assertThat(responseBody).contains("Authentication token is required");
        org.assertj.core.api.Assertions.assertThat(responseBody).contains("/api/users/profile");
        org.assertj.core.api.Assertions.assertThat(responseBody).contains("401");
    }

    @Test
    void testCommence_WithEmptyAuthorizationHeader() throws Exception {
        // Arrange
        StringWriter stringWriter = new StringWriter();
        PrintWriter printWriter = new PrintWriter(stringWriter);
        
        when(request.getHeader("Authorization")).thenReturn("");
        when(request.getRequestURI()).thenReturn("/api/users/login");
        when(response.getWriter()).thenReturn(printWriter);

        // Act
        authenticationEntryPoint.commence(request, response, authException);

        // Assert
        verify(response).setContentType(MediaType.APPLICATION_JSON_VALUE);
        verify(response).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        
        String responseBody = stringWriter.toString();
        org.assertj.core.api.Assertions.assertThat(responseBody).contains("MISSING_TOKEN");
        org.assertj.core.api.Assertions.assertThat(responseBody).contains("Authentication token is required");
        org.assertj.core.api.Assertions.assertThat(responseBody).contains("/api/users/login");
    }

    @Test
    void testCommence_WithInvalidAuthorizationHeader() throws Exception {
        // Arrange
        StringWriter stringWriter = new StringWriter();
        PrintWriter printWriter = new PrintWriter(stringWriter);
        
        when(request.getHeader("Authorization")).thenReturn("Bearer invalid.token.here");
        when(request.getRequestURI()).thenReturn("/api/users/profile");
        when(response.getWriter()).thenReturn(printWriter);

        // Act
        authenticationEntryPoint.commence(request, response, authException);

        // Assert
        verify(response).setContentType(MediaType.APPLICATION_JSON_VALUE);
        verify(response).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        
        String responseBody = stringWriter.toString();
        org.assertj.core.api.Assertions.assertThat(responseBody).contains("INVALID_TOKEN");
        org.assertj.core.api.Assertions.assertThat(responseBody).contains("Invalid or expired authentication token");
        org.assertj.core.api.Assertions.assertThat(responseBody).contains("/api/users/profile");
        org.assertj.core.api.Assertions.assertThat(responseBody).contains("401");
    }

    @Test
    void testCommence_WithExpiredToken() throws Exception {
        // Arrange
        StringWriter stringWriter = new StringWriter();
        PrintWriter printWriter = new PrintWriter(stringWriter);
        
        when(request.getHeader("Authorization")).thenReturn("Bearer expired.jwt.token");
        when(request.getRequestURI()).thenReturn("/api/users/profile");
        when(response.getWriter()).thenReturn(printWriter);

        // Act
        authenticationEntryPoint.commence(request, response, authException);

        // Assert
        verify(response).setContentType(MediaType.APPLICATION_JSON_VALUE);
        verify(response).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        
        String responseBody = stringWriter.toString();
        org.assertj.core.api.Assertions.assertThat(responseBody).contains("INVALID_TOKEN");
        org.assertj.core.api.Assertions.assertThat(responseBody).contains("Invalid or expired authentication token");
    }

    @Test
    void testCommence_WithMalformedToken() throws Exception {
        // Arrange
        StringWriter stringWriter = new StringWriter();
        PrintWriter printWriter = new PrintWriter(stringWriter);
        
        when(request.getHeader("Authorization")).thenReturn("Basic somebasictoken");
        when(request.getRequestURI()).thenReturn("/api/users/register");
        when(response.getWriter()).thenReturn(printWriter);

        // Act
        authenticationEntryPoint.commence(request, response, authException);

        // Assert
        verify(response).setContentType(MediaType.APPLICATION_JSON_VALUE);
        verify(response).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        
        String responseBody = stringWriter.toString();
        org.assertj.core.api.Assertions.assertThat(responseBody).contains("INVALID_TOKEN");
        org.assertj.core.api.Assertions.assertThat(responseBody).contains("Invalid or expired authentication token");
        org.assertj.core.api.Assertions.assertThat(responseBody).contains("/api/users/register");
    }

    @Test
    void testCommence_ResponseBodyContainsTimestamp() throws Exception {
        // Arrange
        StringWriter stringWriter = new StringWriter();
        PrintWriter printWriter = new PrintWriter(stringWriter);
        
        when(request.getHeader("Authorization")).thenReturn(null);
        when(request.getRequestURI()).thenReturn("/test");
        when(response.getWriter()).thenReturn(printWriter);

        // Act
        authenticationEntryPoint.commence(request, response, authException);

        // Assert
        String responseBody = stringWriter.toString();
        org.assertj.core.api.Assertions.assertThat(responseBody).contains("timestamp");
    }

} 