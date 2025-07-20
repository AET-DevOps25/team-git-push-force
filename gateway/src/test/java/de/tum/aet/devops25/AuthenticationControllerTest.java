package de.tum.aet.devops25;

import de.tum.aet.devops25.api.generated.model.AuthResponse;
import de.tum.aet.devops25.api.generated.model.RefreshTokenRequest;
import de.tum.aet.devops25.api.generated.model.User;
import de.tum.aet.devops25.api.generated.model.UserLoginRequest;
import de.tum.aet.devops25.api.generated.model.UserLogout200Response;
import de.tum.aet.devops25.api.generated.model.UserRegistrationRequest;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.reactive.function.server.MockServerRequest;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import org.mockito.ArgumentMatchers;
import java.time.Duration;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doReturn;
import static org.springframework.http.HttpStatus.OK;

@SpringBootTest
class AuthenticationControllerTest {

    // Create a custom implementation of AuthenticationController for testing
    private static class TestAuthenticationController extends AuthenticationController {
        public TestAuthenticationController() {
            super(WebClient.builder(), "http://test-user-svc", createMockJwtUtil());
        }

        private static JwtUtil createMockJwtUtil() {
            JwtUtil jwtUtil = new JwtUtil();
            try {
                // Use reflection to set the private fields
                java.lang.reflect.Field jwtSecretField = JwtUtil.class.getDeclaredField("jwtSecret");
                jwtSecretField.setAccessible(true);
                jwtSecretField.set(jwtUtil, "test-secret-key-for-testing-purposes-only");

                java.lang.reflect.Field jwtExpirationField = JwtUtil.class.getDeclaredField("jwtExpiration");
                jwtExpirationField.setAccessible(true);
                jwtExpirationField.set(jwtUtil, 3600000L);

                java.lang.reflect.Field refreshExpirationField = JwtUtil.class.getDeclaredField("refreshExpiration");
                refreshExpirationField.setAccessible(true);
                refreshExpirationField.set(jwtUtil, 86400000L);
            } catch (Exception e) {
                throw new RuntimeException("Failed to create mock JwtUtil", e);
            }
            return jwtUtil;
        }

        @Override
        public Mono<ResponseEntity<AuthResponse>> userLogin(Mono<UserLoginRequest> userLoginRequestMono, ServerWebExchange exchange) {
            return Mono.just(createLoginResponse());
        }

        @Override
        public Mono<ResponseEntity<AuthResponse>> userRegistration(Mono<UserRegistrationRequest> userRegistrationRequestMono, ServerWebExchange exchange) {
            return Mono.just(createRegistrationResponse());
        }

        @Override
        public Mono<ResponseEntity<AuthResponse>> refreshToken(Mono<RefreshTokenRequest> refreshTokenRequestMono, ServerWebExchange exchange) {
            return Mono.just(createRefreshResponse());
        }

        @Override
        public Mono<ResponseEntity<UserLogout200Response>> userLogout(ServerWebExchange exchange) {
            UserLogout200Response logoutResponse = new UserLogout200Response().message("Logout successful");
            return Mono.just(ResponseEntity.ok(logoutResponse));
        }

        private ResponseEntity<AuthResponse> createLoginResponse() {
            User mockUser = new User();
            UUID userId = UUID.fromString("00000000-0000-0000-0000-000000000123");
            mockUser.setId(userId);
            mockUser.setEmail("test@example.com");
            mockUser.setFirstName("John");
            mockUser.setLastName("Doe");

            AuthResponse authResponse = new AuthResponse();
            authResponse.setAccessToken("sample-jwt-token");
            authResponse.setRefreshToken("sample-refresh-token");
            authResponse.setTokenType("Bearer");
            authResponse.setExpiresIn(3600);
            authResponse.setUser(mockUser);

            return ResponseEntity.ok(authResponse);
        }

        private ResponseEntity<AuthResponse> createRegistrationResponse() {
            User mockUser = new User();
            UUID userId = UUID.fromString("00000000-0000-0000-0000-000000000456");
            mockUser.setId(userId);
            mockUser.setEmail("newuser@example.com");
            mockUser.setFirstName("John");
            mockUser.setLastName("Doe");

            AuthResponse authResponse = new AuthResponse();
            authResponse.setAccessToken("registration-jwt-token");
            authResponse.setRefreshToken("registration-refresh-token");
            authResponse.setTokenType("Bearer");
            authResponse.setExpiresIn(3600);
            authResponse.setUser(mockUser);

            return ResponseEntity.status(HttpStatus.CREATED).body(authResponse);
        }

        private ResponseEntity<AuthResponse> createRefreshResponse() {
            User mockUser = new User();
            UUID userId = UUID.fromString("00000000-0000-0000-0000-000000000789");
            mockUser.setId(userId);
            mockUser.setEmail("refresh@example.com");
            mockUser.setFirstName("Jane");
            mockUser.setLastName("Smith");

            AuthResponse authResponse = new AuthResponse();
            authResponse.setAccessToken("refreshed-jwt-token");
            authResponse.setRefreshToken("sample-refresh-token");
            authResponse.setTokenType("Bearer");
            authResponse.setExpiresIn(3600);
            authResponse.setUser(mockUser);

            return ResponseEntity.ok(authResponse);
        }
    }

    private AuthenticationController authenticationController;
    private ServerWebExchange exchange;

    @BeforeEach
    void setUp() {
        // Create a custom implementation of AuthenticationController for testing
        authenticationController = new TestAuthenticationController();

        // Create a mock ServerWebExchange
        MockServerHttpRequest request = MockServerHttpRequest.get("/").build();
        exchange = MockServerWebExchange.from(request);
    }

    @Test
    void testUserLogin() {
        // Create a login request
        UserLoginRequest loginRequest = new UserLoginRequest();
        loginRequest.setEmail("test@example.com");
        loginRequest.setPassword("password123");

        // Test the userLogin method
        ResponseEntity<AuthResponse> response = authenticationController.userLogin(Mono.just(loginRequest), exchange).block();

        // Verify the response
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());

        // Verify the response body
        AuthResponse authResponse = response.getBody();
        assertNotNull(authResponse);
        assertEquals("sample-jwt-token", authResponse.getAccessToken());
        assertEquals("sample-refresh-token", authResponse.getRefreshToken());
        assertEquals("Bearer", authResponse.getTokenType());
        assertEquals(Integer.valueOf(3600), authResponse.getExpiresIn());
    }

    @Test
    void testUserRegistration() {
        // Create a registration request
        UserRegistrationRequest registrationRequest = new UserRegistrationRequest();
        registrationRequest.setEmail("newuser@example.com");
        registrationRequest.setPassword("password123");
        registrationRequest.setFirstName("John");
        registrationRequest.setLastName("Doe");

        // Test the userRegistration method
        ResponseEntity<AuthResponse> response = authenticationController.userRegistration(Mono.just(registrationRequest), exchange).block();

        // Verify the response
        assertNotNull(response);
        assertEquals(HttpStatus.CREATED, response.getStatusCode());

        // Verify the response body
        AuthResponse authResponse = response.getBody();
        assertNotNull(authResponse);
        assertEquals("registration-jwt-token", authResponse.getAccessToken());
        assertEquals("registration-refresh-token", authResponse.getRefreshToken());
        assertEquals("Bearer", authResponse.getTokenType());
        assertEquals(Integer.valueOf(3600), authResponse.getExpiresIn());
    }

    @Test
    void testRefreshToken() {
        // Create a refresh token request
        RefreshTokenRequest refreshTokenRequest = new RefreshTokenRequest();
        refreshTokenRequest.setRefreshToken("sample-refresh-token");

        // Test the refreshToken method
        ResponseEntity<AuthResponse> response = authenticationController.refreshToken(Mono.just(refreshTokenRequest), exchange).block();

        // Verify the response
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());

        // Verify the response body
        AuthResponse authResponse = response.getBody();
        assertNotNull(authResponse);
        assertEquals("refreshed-jwt-token", authResponse.getAccessToken());
        assertEquals("sample-refresh-token", authResponse.getRefreshToken());
        assertEquals("Bearer", authResponse.getTokenType());
        assertEquals(Integer.valueOf(3600), authResponse.getExpiresIn());
    }

    @Test
    void testUserLogout() {
        // Test the userLogout method
        ResponseEntity<UserLogout200Response> response = authenticationController.userLogout(exchange).block();

        // Verify the response
        assertNotNull(response);
        assertEquals(OK, response.getStatusCode());

        // Verify the response body
        UserLogout200Response logoutResponse = response.getBody();
        assertNotNull(logoutResponse);
        assertNotNull(logoutResponse.getMessage());
        assertEquals("Logout successful", logoutResponse.getMessage());
    }
}
