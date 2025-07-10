package de.tum.aet.devops25.usersvc;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    @Autowired
    private CustomAuthenticationEntryPoint customAuthenticationEntryPoint;

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // Disable CSRF for APIs
                .headers(headers -> headers
                .frameOptions(frameOptions -> frameOptions.sameOrigin()) // Allow frames from same origin
                )
                .formLogin(form -> form.disable()) // Disable form login
                .httpBasic(httpBasic -> httpBasic.disable()) // Disable HTTP basic auth
                .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // Make it stateless
                .authorizeHttpRequests(authz -> authz
                .requestMatchers("/", "/api/users/register", "/api/users/login", "/health").permitAll()
                .anyRequest().authenticated()
                )
                // Use custom authentication entry point
                .exceptionHandling(exceptionHandling -> exceptionHandling
                .authenticationEntryPoint(customAuthenticationEntryPoint)
                )
                // Register your JWT filter here:
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
