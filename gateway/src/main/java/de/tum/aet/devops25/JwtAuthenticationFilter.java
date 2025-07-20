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
            System.out.println("[AUTH_DEBUG] Skipping authentication for public endpoint: " + path);
            return chain.filter(exchange);
        }

        System.out.println("[AUTH_DEBUG] Request: " + method + " " + path);
        System.out.println("[AUTH_DEBUG] Authorization header: " + (authHeader != null ? "Present" : "Missing"));

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            System.out.println("[AUTH_DEBUG] Bearer token found with length: " + token.length());
            try {
                Claims claims = jwtUtil.validateToken(token);
                if (claims != null) {
                    String userId = claims.getSubject();
                    System.out.println("[AUTH_DEBUG] Token validated successfully for user: " + userId);
                    UsernamePasswordAuthenticationToken authentication = 
                        new UsernamePasswordAuthenticationToken(userId, null, null);

                    return chain.filter(exchange)
                        .contextWrite(ReactiveSecurityContextHolder.withAuthentication(authentication));
                } else {
                    System.out.println("[AUTH_DEBUG] Token validation returned null claims");
                }
            } catch (Exception e) {
                System.out.println("[AUTH_DEBUG] Token validation failed: " + e.getMessage());
                e.printStackTrace(); // Print stack trace for more detailed error information
                // Token validation failed, continue without authentication
            }
        } else if (authHeader != null) {
            System.out.println("[AUTH_DEBUG] Authorization header present but not in Bearer format: " + authHeader);
        } else {
            System.out.println("[AUTH_DEBUG] No Authorization header present for path: " + path);
        }

        return chain.filter(exchange);
    }
}
