package de.tum.aet.devops25;

import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import de.tum.aet.devops25.api.generated.model.UserLogout200Response;
import io.jsonwebtoken.JwtException;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class TokenBlacklistTest {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private AuthenticationController authenticationController;

    private String validToken;
    private ServerWebExchange exchangeWithToken;

    @BeforeEach
    void setUp() {
        // Generate a valid token for testing
        validToken = jwtUtil.generateAccessToken("test-user-id");

        // Create a mock ServerWebExchange with the token in the Authorization header
        MockServerHttpRequest request = MockServerHttpRequest.get("/")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + validToken)
                .build();
        exchangeWithToken = MockServerWebExchange.from(request);
    }

    @Test
    void testTokenBlacklisting() {
        // Step 1: Verify that the token is valid before logout
        Claims claims = jwtUtil.validateToken(validToken);
        assertNotNull(claims);
        assertEquals("test-user-id", claims.getSubject());

        // Step 2: Logout the user, which should blacklist the token
        ResponseEntity<UserLogout200Response> logoutResponse = 
            authenticationController.userLogout(exchangeWithToken).block();
        
        // Verify successful logout
        assertNotNull(logoutResponse);
        assertEquals(HttpStatus.OK, logoutResponse.getStatusCode());
        
        UserLogout200Response logoutResponseBody = logoutResponse.getBody();
        assertNotNull(logoutResponseBody);
        assertEquals("Logout successful", logoutResponseBody.getMessage());

        // Step 3: Verify that the token is now blacklisted and cannot be used
        Exception exception = assertThrows(JwtException.class, () -> {
            jwtUtil.validateToken(validToken);
        });
        
        assertTrue(exception.getMessage().contains("blacklisted"));
    }
}