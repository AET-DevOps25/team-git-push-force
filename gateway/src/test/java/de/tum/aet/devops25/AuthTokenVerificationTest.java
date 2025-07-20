package de.tum.aet.devops25;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class AuthTokenVerificationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private JwtUtil jwtUtil;

    @Test
    public void testAuthTokenInRequest() {
        // Generate a test token
        String userId = "test-user-id";
        String token = jwtUtil.generateAccessToken(userId);
        
        System.out.println("[TEST_DEBUG] Generated test token: " + token);

        // Create headers with Authorization
        HttpHeaders headers = new HttpHeaders();
        headers.add("Authorization", "Bearer " + token);
        
        // Create request entity with headers
        HttpEntity<String> requestEntity = new HttpEntity<>(headers);
        
        // Make request to health endpoint
        String url = "http://localhost:" + port + "/health";
        ResponseEntity<String> response = restTemplate.exchange(
            url, HttpMethod.GET, requestEntity, String.class);
        
        // Verify response
        assertEquals(200, response.getStatusCodeValue(), 
            "Health endpoint should return 200 OK");
        assertNotNull(response.getBody(), 
            "Response body should not be null");
        
        System.out.println("[TEST_DEBUG] Response: " + response.getBody());
        System.out.println("[TEST_DEBUG] Check server logs for [AUTH_DEBUG] messages to verify token inclusion");
    }

    @Test
    public void testRequestWithoutAuthToken() {
        // Make request to health endpoint without token
        String url = "http://localhost:" + port + "/health";
        ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
        
        // Verify response (health endpoint is permitted without auth)
        assertEquals(200, response.getStatusCodeValue(), 
            "Health endpoint should return 200 OK even without token");
        assertNotNull(response.getBody(), 
            "Response body should not be null");
        
        System.out.println("[TEST_DEBUG] Response without token: " + response.getBody());
        System.out.println("[TEST_DEBUG] Check server logs for [AUTH_DEBUG] messages to verify missing token");
    }

    @Test
    public void testRequestWithInvalidAuthToken() {
        // Create headers with invalid Authorization
        HttpHeaders headers = new HttpHeaders();
        headers.add("Authorization", "Bearer invalid-token");
        
        // Create request entity with headers
        HttpEntity<String> requestEntity = new HttpEntity<>(headers);
        
        // Make request to health endpoint
        String url = "http://localhost:" + port + "/health";
        ResponseEntity<String> response = restTemplate.exchange(
            url, HttpMethod.GET, requestEntity, String.class);
        
        // Verify response (health endpoint is permitted without auth)
        assertEquals(200, response.getStatusCodeValue(), 
            "Health endpoint should return 200 OK even with invalid token");
        assertNotNull(response.getBody(), 
            "Response body should not be null");
        
        System.out.println("[TEST_DEBUG] Response with invalid token: " + response.getBody());
        System.out.println("[TEST_DEBUG] Check server logs for [AUTH_DEBUG] messages to verify token validation failure");
    }
}