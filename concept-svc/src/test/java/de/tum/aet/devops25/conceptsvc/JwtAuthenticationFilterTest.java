package de.tum.aet.devops25.conceptsvc;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication existingAuthentication;

    private JwtAuthenticationFilter jwtAuthenticationFilter;
    private static final String JWT_SECRET = "my-super-long-and-secure-secret-key-1234567890!@#$";

    @BeforeEach
    void setUp() {
        jwtAuthenticationFilter = new JwtAuthenticationFilter();
        // Clear security context
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Should authenticate with valid JWT token")
    void testDoFilterInternal_ValidToken() throws Exception {
        // Given
        String userId = UUID.randomUUID().toString();
        String validToken = generateValidToken(userId);
        
        when(request.getHeader("Authorization")).thenReturn("Bearer " + validToken);
        when(securityContext.getAuthentication()).thenReturn(null);
        SecurityContextHolder.setContext(securityContext);

        // When
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then
        verify(filterChain).doFilter(request, response);
        verify(securityContext).setAuthentication(any());
    }

    @Test
    @DisplayName("Should skip authentication when no Authorization header")
    void testDoFilterInternal_NoAuthHeader() throws Exception {
        // Given
        when(request.getHeader("Authorization")).thenReturn(null);

        // When
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then
        verify(filterChain).doFilter(request, response);
        verify(securityContext, never()).setAuthentication(any());
    }

    @Test
    @DisplayName("Should skip authentication when Authorization header doesn't start with Bearer")
    void testDoFilterInternal_InvalidAuthHeaderFormat() throws Exception {
        // Given
        when(request.getHeader("Authorization")).thenReturn("Basic invalid-format");

        // When
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then
        verify(filterChain).doFilter(request, response);
        verify(securityContext, never()).setAuthentication(any());
    }

    @Test
    @DisplayName("Should skip authentication when token is invalid")
    void testDoFilterInternal_InvalidToken() throws Exception {
        // Given
        when(request.getHeader("Authorization")).thenReturn("Bearer invalid-token");

        // When
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then
        verify(filterChain).doFilter(request, response);
        verify(securityContext, never()).setAuthentication(any());
    }

    @Test
    @DisplayName("Should skip authentication when user already authenticated")
    void testDoFilterInternal_AlreadyAuthenticated() throws Exception {
        // Given
        String userId = UUID.randomUUID().toString();
        String validToken = generateValidToken(userId);
        
        when(request.getHeader("Authorization")).thenReturn("Bearer " + validToken);
        when(securityContext.getAuthentication()).thenReturn(existingAuthentication);
        SecurityContextHolder.setContext(securityContext);

        // When
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then
        verify(filterChain).doFilter(request, response);
        verify(securityContext, never()).setAuthentication(any());
    }

    @Test
    @DisplayName("Should handle expired token gracefully")
    void testDoFilterInternal_ExpiredToken() throws Exception {
        // Given
        String expiredToken = generateExpiredToken();
        when(request.getHeader("Authorization")).thenReturn("Bearer " + expiredToken);

        // When
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then
        verify(filterChain).doFilter(request, response);
        verify(securityContext, never()).setAuthentication(any());
    }

    @Test
    @DisplayName("Should handle malformed token gracefully")
    void testDoFilterInternal_MalformedToken() throws Exception {
        // Given
        when(request.getHeader("Authorization")).thenReturn("Bearer malformed.token.here");

        // When
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then
        verify(filterChain).doFilter(request, response);
        verify(securityContext, never()).setAuthentication(any());
    }

    @Test
    @DisplayName("Should extract userId from valid token")
    void testValidateTokenAndExtractUserId_ValidToken() throws Exception {
        // Given
        String userId = UUID.randomUUID().toString();
        String validToken = generateValidToken(userId);
        
        when(request.getHeader("Authorization")).thenReturn("Bearer " + validToken);
        when(securityContext.getAuthentication()).thenReturn(null);
        SecurityContextHolder.setContext(securityContext);

        // When
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then
        verify(securityContext).setAuthentication(argThat(auth -> 
            auth.getPrincipal().equals(userId) && auth.isAuthenticated()
        ));
    }

    private String generateValidToken(String userId) {
        return Jwts.builder()
                .setSubject(userId)
                .setIssuedAt(new java.util.Date())
                .setExpiration(new java.util.Date(System.currentTimeMillis() + 86400000)) // 24 hours
                .signWith(Keys.hmacShaKeyFor(JWT_SECRET.getBytes()))
                .compact();
    }

    private String generateExpiredToken() {
        return Jwts.builder()
                .setSubject("expired-user")
                .setIssuedAt(new java.util.Date(System.currentTimeMillis() - 86400000)) // Yesterday
                .setExpiration(new java.util.Date(System.currentTimeMillis() - 3600000)) // 1 hour ago
                .signWith(Keys.hmacShaKeyFor(JWT_SECRET.getBytes()))
                .compact();
    }
} 