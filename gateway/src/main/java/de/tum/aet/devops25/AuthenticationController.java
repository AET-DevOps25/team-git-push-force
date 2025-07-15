package de.tum.aet.devops25;

import de.tum.aet.devops25.api.generated.controller.AuthenticationApi;
import de.tum.aet.devops25.api.generated.model.*;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
public class AuthenticationController implements AuthenticationApi {

    private final WebClient webClient;
    private final String userServiceUrl;
    private final JwtUtil jwtUtil;

    @Autowired
    public AuthenticationController(WebClient.Builder webClientBuilder,
                                    @Value("${user-svc.url}") String userServiceUrl,
                                    JwtUtil jwtUtil) {
        this.webClient = webClientBuilder.build();
        this.userServiceUrl = userServiceUrl;
        this.jwtUtil = jwtUtil;
    }

    @Override
    public Mono<ResponseEntity<AuthResponse>> refreshToken(Mono<RefreshTokenRequest> refreshTokenRequestMono, ServerWebExchange exchange) {
        return refreshTokenRequestMono.flatMap(refreshTokenRequest -> {
            Claims claims = jwtUtil.validateToken(refreshTokenRequest.getRefreshToken());
            if (claims == null) {
                return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
            }

            String userId = claims.getSubject();

            return webClient.get()
                    .uri(userServiceUrl + "/api/users/" + userId)
                    .retrieve()
                    .bodyToMono(User.class)
                    .map(user -> {
                        String accessToken = jwtUtil.generateAccessToken(userId);

                        AuthResponse authResponse = new AuthResponse()
                                .accessToken(accessToken)
                                .refreshToken(refreshTokenRequest.getRefreshToken())
                                .tokenType("Bearer")
                                .expiresIn((int) (jwtUtil.getJwtExpiration() / 1000))
                                .user(user);

                        return ResponseEntity.ok(authResponse);
                    })
                    .onErrorResume(e -> Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).<AuthResponse>build()));
        });
    }

    @Override
    public Mono<ResponseEntity<AuthResponse>> userLogin(Mono<UserLoginRequest> userLoginRequestMono, ServerWebExchange exchange) {
        return userLoginRequestMono.flatMap(userLoginRequest -> {
            Map<String, String> loginRequest = new HashMap<>();
            loginRequest.put("email", userLoginRequest.getEmail());
            loginRequest.put("password", userLoginRequest.getPassword());

            return webClient.post()
                    .uri(userServiceUrl + "/api/users/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(BodyInserters.fromValue(loginRequest))
                    .retrieve()
                    .bodyToMono(LoginResponse.class)
                    .flatMap(loginResponse -> {
                        if (loginResponse.getToken() == null) {
                            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).<AuthResponse>build());
                        }

                        try {
                            // Extract user ID from token using JwtUtil
                            Claims claims = jwtUtil.validateToken(loginResponse.getToken());
                            String userId = claims.getSubject();

                            // Get user profile using the token
                            return webClient.get()
                                    .uri(userServiceUrl + "/api/users/profile")
                                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + loginResponse.getToken())
                                    .retrieve()
                                    .bodyToMono(User.class)
                                    .map(user -> {
                                        String accessToken = jwtUtil.generateAccessToken(userId);
                                        String refreshToken = jwtUtil.generateRefreshToken(userId);

                                        AuthResponse authResponse = new AuthResponse()
                                                .accessToken(accessToken)
                                                .refreshToken(refreshToken)
                                                .tokenType("Bearer")
                                                .expiresIn((int) (jwtUtil.getJwtExpiration() / 1000))
                                                .user(user);

                                        return ResponseEntity.ok(authResponse);
                                    })
                                    .onErrorResume(e -> {
                                        System.out.println("Error fetching user profile: " + e.getMessage());

                                        // Create a minimal user object with just the ID
                                        User minimalUser = new User().id(UUID.fromString(userId));

                                        String accessToken = jwtUtil.generateAccessToken(userId);
                                        String refreshToken = jwtUtil.generateRefreshToken(userId);

                                        AuthResponse authResponse = new AuthResponse()
                                                .accessToken(accessToken)
                                                .refreshToken(refreshToken)
                                                .tokenType("Bearer")
                                                .expiresIn((int) (jwtUtil.getJwtExpiration() / 1000))
                                                .user(minimalUser);

                                        return Mono.just(ResponseEntity.ok(authResponse));
                                    });
                        } catch (Exception e) {
                            System.out.println("Error parsing token: " + e.getMessage());
                            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).<AuthResponse>build());
                        }
                    })
                    .onErrorResume(e -> {
                        System.out.println("Login error: " + e.getMessage());
                        return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).<AuthResponse>build());
                    });
        });
    }

    @Override
    public Mono<ResponseEntity<UserLogout200Response>> userLogout(ServerWebExchange exchange) {
        // Extract the authorization header from the request
        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).<UserLogout200Response>build());
        }

        // Extract the token
        String token = authHeader.substring(7);

        try {
            // Validate the token (this just checks if the token is valid, we don't need to use the claims)
            jwtUtil.validateToken(token);

            // Blacklist the token
            jwtUtil.blacklistToken(token);

            // If we get here, the token is valid and has been blacklisted, so we can return a successful response
            UserLogout200Response logoutResponse = new UserLogout200Response().message("Logout successful");
            return Mono.just(ResponseEntity.ok(logoutResponse));
        } catch (Exception e) {
            System.out.println("Logout error: " + e.getMessage());
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).<UserLogout200Response>build());
        }
    }

    @Override
    public Mono<ResponseEntity<AuthResponse>> userRegistration(Mono<UserRegistrationRequest> userRegistrationRequestMono, ServerWebExchange exchange) {
        return userRegistrationRequestMono.flatMap(userRegistrationRequest -> {
            Map<String, Object> requestMap = new HashMap<>();
            requestMap.put("email", userRegistrationRequest.getEmail());
            requestMap.put("password", userRegistrationRequest.getPassword());
            requestMap.put("firstName", userRegistrationRequest.getFirstName());
            requestMap.put("lastName", userRegistrationRequest.getLastName());

            if (userRegistrationRequest.getPreferences() != null) {
                Map<String, Object> preferencesMap = new HashMap<>();
                var prefs = userRegistrationRequest.getPreferences();

                preferencesMap.put("preferredEventFormat", prefs.getPreferredEventFormat() != null
                        ? prefs.getPreferredEventFormat().toString()
                        : null);
                preferencesMap.put("industry", prefs.getIndustry());
                preferencesMap.put("language", prefs.getLanguage());
                preferencesMap.put("timezone", prefs.getTimezone());

                requestMap.put("preferences", preferencesMap);
            }

            return webClient.post()
                    .uri(userServiceUrl + "/api/users/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(BodyInserters.fromValue(requestMap))
                    .retrieve()
                    .bodyToMono(User.class)
                    .timeout(Duration.ofSeconds(3))
                    .map(user -> {
                        if (user == null || user.getId() == null) {
                            return ResponseEntity.badRequest().<AuthResponse>build();
                        }

                        String accessToken = jwtUtil.generateAccessToken(user.getId().toString());
                        String refreshToken = jwtUtil.generateRefreshToken(user.getId().toString());

                        AuthResponse authResponse = new AuthResponse()
                                .accessToken(accessToken)
                                .refreshToken(refreshToken)
                                .tokenType("Bearer")
                                .expiresIn((int) (jwtUtil.getJwtExpiration() / 1000))
                                .user(user);

                        return ResponseEntity.status(HttpStatus.CREATED).body(authResponse);
                    })
                    .onErrorResume(e -> {
                        // Check if the error is a WebClientResponseException
                        if (e instanceof org.springframework.web.reactive.function.client.WebClientResponseException) {
                            org.springframework.web.reactive.function.client.WebClientResponseException wcre = 
                                (org.springframework.web.reactive.function.client.WebClientResponseException) e;

                            // Try to parse the error response
                            try {
                                String errorBody = wcre.getResponseBodyAsString();
                                System.out.println("Registration error: " + errorBody);

                                // Return appropriate status code from the error
                                return Mono.just(ResponseEntity
                                    .status(wcre.getStatusCode())
                                    .<AuthResponse>build());
                            } catch (Exception ex) {
                                System.out.println("Error parsing error response: " + ex.getMessage());
                            }
                        } else {
                            System.out.println("Registration error: " + e.getMessage());
                        }

                        return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).<AuthResponse>build());
                    });
        });
    }
}
