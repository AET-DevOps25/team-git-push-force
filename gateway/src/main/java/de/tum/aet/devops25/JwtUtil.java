package de.tum.aet.devops25;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class JwtUtil {

    @Value("${jwt.secret:my-super-long-and-secure-secret-key-1234567890!@#$}")
    private String jwtSecret;

    @Value("${jwt.expiration:3600000}") // 1 hour in milliseconds
    private long jwtExpiration;

    @Value("${jwt.refresh-expiration:604800000}") // 7 days in milliseconds
    private long refreshExpiration;

    // Set to store blacklisted tokens
    private final Set<String> blacklistedTokens = ConcurrentHashMap.newKeySet();

    public String generateAccessToken(String userId) {
        return generateToken(userId, jwtExpiration);
    }

    public String generateRefreshToken(String userId) {
        return generateToken(userId, refreshExpiration);
    }

    private String generateToken(String userId, long expiration) {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes());
        return Jwts.builder()
                .setSubject(userId)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(key)
                .compact();
    }

    public Claims validateToken(String token) {
        // Check if the token is blacklisted
        if (isTokenBlacklisted(token)) {
            throw new io.jsonwebtoken.JwtException("Token has been blacklisted");
        }

        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes());
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public long getJwtExpiration() {
        return jwtExpiration;
    }

    /**
     * Adds a token to the blacklist
     * @param token The token to blacklist
     */
    public void blacklistToken(String token) {
        blacklistedTokens.add(token);
    }

    /**
     * Checks if a token is blacklisted
     * @param token The token to check
     * @return true if the token is blacklisted, false otherwise
     */
    public boolean isTokenBlacklisted(String token) {
        return blacklistedTokens.contains(token);
    }
}
