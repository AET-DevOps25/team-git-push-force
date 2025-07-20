package de.tum.aet.devops25;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.context.NoOpServerSecurityContextRepository;
import org.springframework.security.config.web.server.SecurityWebFiltersOrder;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        // Removed debug logging for security filter chain configuration

        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .securityContextRepository(NoOpServerSecurityContextRepository.getInstance())
                .authorizeExchange(authorizeExchange -> {
                    // Removed debug logging for authorization rules configuration

                    authorizeExchange
                        .pathMatchers(HttpMethod.OPTIONS, "/**").permitAll() // Allow preflight requests
                        .pathMatchers("/", "/health", "/api/health", "/api/users/health", "/api/concepts/health", "/api/genai/health", 
                                     "/api/auth/login", "/api/auth/register", "/api/auth/refresh", "/api/auth/logout",
                                     "/actuator/prometheus").permitAll()
                        .anyExchange().authenticated();

                    // Removed debug logging for authorization rules completion
                })
                .addFilterAt(jwtAuthenticationFilter, SecurityWebFiltersOrder.AUTHENTICATION)
                .exceptionHandling(exceptionHandling -> {
                    // Removed debug logging for exception handling configuration

                    exceptionHandling
                        .authenticationEntryPoint((exchange, ex) -> {
                            // Keep logging for authentication failures but without DEBUG prefix
                            System.out.println("Authentication failed: " + ex.getMessage());
                            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                            return exchange.getResponse().setComplete();
                        });

                    // Removed debug logging for exception handling completion
                })
                .build();
    }
}
