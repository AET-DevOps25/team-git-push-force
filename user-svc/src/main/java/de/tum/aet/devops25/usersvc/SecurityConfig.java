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
                .csrf(csrf -> csrf.disable()) // Proper way to disable CSRF in Spring Security 6+
                .authorizeHttpRequests(authz -> authz
                .requestMatchers("/api/users/register", "/").permitAll()
                .anyRequest().authenticated()
                );
        return http.build();
    }
}
