package de.tum.aet.devops25;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;

import io.jsonwebtoken.Claims;
import reactor.core.publisher.Mono;

@Component
public class JwtAuthenticationFilter implements WebFilter {

    private final JwtUtil jwtUtil;

    public JwtAuthenticationFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String authHeader = exchange.getRequest().getHeaders().getFirst("Authorization");
        String path = exchange.getRequest().getURI().getPath();
        String method = exchange.getRequest().getMethod().toString();

        // Skip authentication for endpoints that don't require it
        if (path.startsWith("/actuator/") ||
            path.equals("/health") ||
            path.equals("/api/health") ||
            path.equals("/auth/register") ||
            path.equals("/api/auth/register") ||
            path.equals("/auth/login") ||
            path.equals("/api/auth/login") ||
            path.equals("/auth/refresh") ||
            path.equals("/api/auth/refresh") ||
            path.equals("/auth/logout") ||
            path.equals("/api/auth/logout")) {
            // Removed debug logging for public endpoints
            return chain.filter(exchange);
        }

        // Removed debug logging for request details

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            // Removed debug logging for token length
            try {
                Claims claims = jwtUtil.validateToken(token);
                if (claims != null) {
                    String userId = claims.getSubject();
                    // Keep logging for successful authentication but without DEBUG prefix
                    System.out.println("Authentication successful for user: " + userId);
                    UsernamePasswordAuthenticationToken authentication = 
                        new UsernamePasswordAuthenticationToken(userId, null, null);

                    return chain.filter(exchange)
                        .contextWrite(ReactiveSecurityContextHolder.withAuthentication(authentication));
                } else {
                    // Keep logging for null claims as it indicates a potential issue
                    System.out.println("Token validation returned null claims");
                }
            } catch (Exception e) {
                // Keep logging for authentication failures as they are important for security
                System.out.println("Token validation failed: " + e.getMessage());
                e.printStackTrace(); // Print stack trace for more detailed error information
                // Token validation failed, continue without authentication
            }
        } else if (authHeader != null) {
            // Keep logging for malformed headers as they indicate potential security issues
            System.out.println("Authorization header present but not in Bearer format");
        } else {
            // Removed detailed logging for missing auth headers as this is common for public resources
        }

        return chain.filter(exchange);
    }
}
