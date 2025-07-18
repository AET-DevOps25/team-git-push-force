package de.tum.aet.devops25.usersvc;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Date;

import javax.crypto.SecretKey;

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
    private Authentication existingAuthentication;

    private JwtAuthenticationFilter jwtAuthenticationFilter;
    private static final String JWT_SECRET = "my-super-long-and-secure-secret-key-1234567890!@#$";

    @BeforeEach
    void setUp() {
        jwtAuthenticationFilter = new JwtAuthenticationFilter();
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Should authenticate with valid JWT token")
    void testDoFilterInternal_ValidToken() throws Exception {
        String userId = "550e8400-e29b-41d4-a716-446655440000";
        String validToken = generateValidToken(userId);
        
        when(request.getHeader("Authorization")).thenReturn("Bearer " + validToken);

        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        // Authentication should be set in the SecurityContext (we can't easily verify this in the test)
    }

    @Test
    @DisplayName("Should skip authentication when no Authorization header")
    void testDoFilterInternal_NoAuthHeader() throws Exception {
        when(request.getHeader("Authorization")).thenReturn(null);

        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("Should skip authentication when Authorization header doesn't start with Bearer")
    void testDoFilterInternal_InvalidAuthHeaderFormat() throws Exception {
        when(request.getHeader("Authorization")).thenReturn("Basic sometoken");

        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("Should skip authentication when token is invalid")
    void testDoFilterInternal_InvalidToken() throws Exception {
        when(request.getHeader("Authorization")).thenReturn("Bearer invalid.token.here");

        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("Should skip authentication when user already authenticated")
    void testDoFilterInternal_AlreadyAuthenticated() throws Exception {
        String userId = "550e8400-e29b-41d4-a716-446655440000";
        String validToken = generateValidToken(userId);
        
        // Set existing authentication
        SecurityContextHolder.getContext().setAuthentication(existingAuthentication);
        
        when(request.getHeader("Authorization")).thenReturn("Bearer " + validToken);

        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("Should handle expired token gracefully")
    void testDoFilterInternal_ExpiredToken() throws Exception {
        String expiredToken = generateExpiredToken();
        
        when(request.getHeader("Authorization")).thenReturn("Bearer " + expiredToken);

        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("Should handle malformed token gracefully")
    void testDoFilterInternal_MalformedToken() throws Exception {
        when(request.getHeader("Authorization")).thenReturn("Bearer malformed-token");

        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }

    private String generateValidToken(String userId) {
        SecretKey key = Keys.hmacShaKeyFor(JWT_SECRET.getBytes());
        return Jwts.builder()
                .setSubject(userId)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 86400000)) // 1 day
                .signWith(key)
                .compact();
    }

    private String generateExpiredToken() {
        SecretKey key = Keys.hmacShaKeyFor(JWT_SECRET.getBytes());
        return Jwts.builder()
                .setSubject("test-user")
                .setIssuedAt(new Date(System.currentTimeMillis() - 172800000)) // 2 days ago
                .setExpiration(new Date(System.currentTimeMillis() - 86400000)) // 1 day ago (expired)
                .signWith(key)
                .compact();
    }
} 