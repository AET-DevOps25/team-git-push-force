package de.tum.aet.devops25.usersvc;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // Disable CSRF for APIs
                .headers(headers -> headers
                .frameOptions(frameOptions -> frameOptions.sameOrigin()) // Allow frames from same origin
                )
                .authorizeHttpRequests(authz -> authz
                .requestMatchers("/", "/api/users/register", "/health").permitAll() // Public endpoints
                .anyRequest().authenticated() // All others require auth
                );
        return http.build();
    }
}
