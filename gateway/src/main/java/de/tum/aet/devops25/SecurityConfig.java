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
        System.out.println("[SECURITY_DEBUG] Configuring security filter chain");

        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .securityContextRepository(NoOpServerSecurityContextRepository.getInstance())
                .authorizeExchange(authorizeExchange -> {
                    System.out.println("[SECURITY_DEBUG] Configuring authorization rules");

                    authorizeExchange
                        .pathMatchers(HttpMethod.OPTIONS, "/**").permitAll() // Allow preflight requests
                        .pathMatchers("/", "/health", "/api/users/health", "/api/concepts/health", "/api/genai/health", "/auth/login", "/auth/register", "/auth/refresh", "/auth/logout", "/api/auth/register", "/actuator/prometheus").permitAll()
                        .anyExchange().authenticated();

                    System.out.println("[SECURITY_DEBUG] Authorization rules configured");
                })
                .addFilterAt(jwtAuthenticationFilter, SecurityWebFiltersOrder.AUTHENTICATION)
                .exceptionHandling(exceptionHandling -> {
                    System.out.println("[SECURITY_DEBUG] Configuring exception handling");

                    exceptionHandling
                        .authenticationEntryPoint((exchange, ex) -> {
                            System.out.println("[SECURITY_DEBUG] Authentication failed: " + ex.getMessage());
                            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                            return exchange.getResponse().setComplete();
                        });

                    System.out.println("[SECURITY_DEBUG] Exception handling configured");
                })
                .build();
    }
}
